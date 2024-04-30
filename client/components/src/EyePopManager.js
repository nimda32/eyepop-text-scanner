import { EyePop } from "@eyepop.ai/eyepop";
import { Render2d } from "@eyepop.ai/eyepop-render-2d";
import QRCode from "qrcode";

export default class EyePopManager
{

    static instance = null;

    constructor(resultCanvasRef, videoRef, popNameRef, startButtonRef, setters = { setProgress, setLoading, setJSON })
    {

        if (EyePopManager.instance)
        {
            return EyePopManager.instance;
        }

        this.startButtonRef = startButtonRef.current;
        this.resultCanvasRef = resultCanvasRef.current;
        this.resultContext = this.resultCanvasRef.getContext("2d");
        this.videoRef = videoRef.current;
        this.popNameElement = popNameRef.current;

        this.endpoint = undefined;
        this.popSession = undefined;
        this.popPlotter = undefined;
        this.popLiveIngress = undefined;
        this.context = undefined;

        this.webcam = undefined;

        this.predictionData = [];

        this.setProgress = setters.setProgress;
        this.setLoading = setters.setLoading;
        this.setJSON = setters.setJSON;

        this.stop = false;
        this.isJobRunning = false;

        this.liveEgress = null;

        this.popComps = {
            "text": "ep_infer id=1 model=eyepop-person:EPPersonB1_Person_TorchScriptCuda_float32 threshold=0.8 ! ep_infer id=2 tracing=deepsort model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8 secondary-to-id=1 secondary-for-class-ids=<0> ! ep_infer id=3  category-name='text' model=eyepop-text:EPTextB1_Text_TorchScriptCuda_float32 threshold=0.6 secondary-to-id=1 secondary-for-class-ids=<0> ! ep_infer id=4 category-name='text' secondary-to-id=3 model=PARSeq:PARSeq_TextDataset_TorchScriptCuda_float32 threshold=0.1 ! ep_infer id=5 category-name='sports equipment' model=eyepop-sports:EPSportsB1_Sports_TorchScriptCuda_float32 threshold=0.55",
            "peopleCommon": "ep_infer id=1  category-name=common-objects model=eyepop-coco:EPCocoB1_EPCOCO_TorchScriptCuda_float32  threshold=0.75  ! ep_infer id=2   tracing=deepsort   model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8    secondary-to-id=1   secondary-for-class-ids=<1>",

            "peopleBody": "ep_infer id=1   model=eyepop-person:EPPersonB1_Person_TorchScriptCuda_float32  ! ep_infer id=2  tracing=deepsort  model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8   secondary-to-id=1  secondary-for-class-ids=<0>  thread=true! ep_infer id=3  thread=true  threshold=0.5  model=Mediapipe:BlazeFace_ShortRange_BlazeFace_TensorFlowLite_float32  secondary-to-id=1  secondary-for-class-ids=" < 0 > "  primary-for-absent-class-ids=true  secondary-box-padding=0.1 ! ep_infer id=4  thread=true  model=eyepop-gender:EPGenderB1_Ensemble_Dataset_TorchScriptCuda_float32  secondary-to-id=1  secondary-for-class-ids=" < 0 > "  primary-for-absent-class-ids=true  secondary-box-padding=0.1 ! ep_infer id=5  thread=true  model=eyepop-age:EPAgeB1_Ensemble_Dataset_TorchScriptCuda_float32  secondary-to-id=1  secondary-for-class-ids=" < 0 > "  primary-for-absent-class-ids=true  secondary-box-padding=0.1 ",
            // "peopleBody": "ep_infer id=1    category-name=person    model=eyepop-person:EPPersonB1_Person_TorchScriptCuda_float32  threshold=0.8 ! ep_infer id=2   tracing=deepsort   model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8    secondary-to-id=1   secondary-for-class-ids=<0>  ! ep_infer id=3    threshold=0.5   category-name=2d-body-points   model=Mediapipe:MoveNet_SinglePose_Thunder_MoveNet_TensorFlowLite_float32   secondary-to-id=1   secondary-for-class-ids=\"<0>\"   secondary-box-padding=0.1  ! ep_mixer name=\"meta_mixer\"",

            "people3d": "ep_infer id=1 category-name=person   model=eyepop-person:EPPersonB1_Person_TorchScriptCuda_float32  ! ep_infer id=2   tracing=deepsort   model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8    secondary-to-id=1   secondary-for-class-ids=<0>  ! tee name=t   t. ! ep_infer id=3    threshold=0.75   model=Mediapipe:BlazePose_BlazePose_TensorFlowLite_float32   secondary-to-id=1   secondary-for-class-ids=<0>   secondary-box-padding=0.5     thread=true ! ep_infer id=4 category-name=3d-body-points   threshold=0.75   model=Mediapipe:BlazePose_Landmarks_Heavy_BlazePose_Landmarks_TensorFlowLite_float32   secondary-to-id=3   secondary-for-class-ids=<0>   secondary-box-padding=0.56     orientation-target-angle=-90.0 ! meta_mixer.   t. ! ep_infer id=5   threshold=0.75   model=Mediapipe:Palm_Palm_TensorFlowLite_float32 threshold=0.6   secondary-to-id=1   secondary-for-class-ids=<0>   secondary-box-padding=0.25     thread=true ! ep_infer id=6  category-name=3d-hand-points   model=Mediapipe:Hand_Landmarks_Hand_TensorFlowLite_float32   threshold=0.75   secondary-to-id=5   secondary-for-class-ids=<1>   orientation-target-angle=-90.0 ! meta_mixer.  t. ! ep_infer id=7   threshold=0.75   category-name=2d-face-points   model=Mediapipe:BlazeFace_ShortRange_BlazeFace_TensorFlowLite_float32   secondary-to-id=1   secondary-for-class-ids=\"<0>\"   primary-for-absent-class-ids=true   secondary-box-padding=0.1   ! ep_infer id=8  category-name=3d-face-mesh   model=Mediapipe:Face_Mesh_FaceMesh_TensorFlowLite_float32   secondary-box-padding=1.25   secondary-to-id=7   secondary-for-class-ids=<0>   orientation-target-angle=-90.0 ! ep_infer id=9 category-name=expression   model=eyepop-expression:EPExpressionDS_Ensemble_Dataset_TorchScriptCuda_float32   secondary-to-id=7   secondary-for-class-ids=<0>  ! ep_mixer name=\"meta_mixer\" hide-object-ids=\"3,*;5,*;7,*\""
        };

        this.getWebcam();
        this.setProgress(0);
        this.setLoading(true);

        this.setup();

        EyePopManager.instance = this;
    }

    async getWebcam()
    {
        // A hack to get the webcam devices listed if they do not appear
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) =>
        {

            stream.getTracks().forEach((track) =>
            {
                track.stop();
            });

        });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const webcamDevices = devices.filter(device => device.kind === 'videoinput');

        this.setWebcam(webcamDevices[ 0 ].deviceId);
    }

    createQrCode()
    {

        console.log('Creating QR Code...', "http://localhost:3000/client/?mobile=" + JSON.stringify(this.popSession));

        QRCode.toCanvas(document.getElementById('qrCodeEyePop'),
            "http://localhost:3000/eyepop?=" + JSON.stringify(this.popSession), function (error)
        {
            if (error) console.error(error)
            console.log('success!')
        });

        // add a link as text as a sybling to the canvas
        const link = document.createElement('a');
        link.href = "http://localhost:3000/client/?mobile=" + JSON.stringify(this.popSession)
        link.innerHTML = "http://localhost:3000/client/?mobile=....";
        link.classList.add('text-blue-300', 'font-bold', 'text-sm', 'h-8', 'select-text');
        link.target = "_blank";

        const parent = document.getElementById('qrCodeEyePop').parentElement;
        parent.appendChild(link);

    }

    setWebcam(deviceID)
    {
        this.webcam = { id: deviceID };
    }

    setErrorMessage(message)
    {
        this.popNameElement.innerHTML = message;
        this.popNameElement.classList = [];
        this.popNameElement.classList.add('w-full', 'text-center', 'text-red-800', 'font-bold', 'text-sm', 'overflow-y-scroll', 'h-44', 'select-text');

        const parent = this.popNameElement.parentElement;
        const copy = this.popNameElement.cloneNode(true);

        console.log(parent);
        // remove all children from the parent without a loop
        parent.innerHTML = '';

        // make a clone of popNameElement and append it to the parent
        parent.appendChild(copy);
        parent.classList.remove('h-full')
        parent.classList.add('bg-black', 'h-44');

    }

    async toggleStart()
    {
        console.log('Starting');
        const scope = EyePopManager.instance;

        // if it's not running, start it
        if (!scope.isJobRunning)
        {
            await scope.startWebcamIngress();
            scope.startButtonRef.innerHTML = "Start";
            scope.setLoading(false);
            return;
        }

        scope.setLoading(true);
        scope.startButtonRef.innerHTML = "Stop";
        await scope.popLiveIngress.close();

        scope.webcam.stream.getTracks()
            .forEach((track) =>
            {
                track.stop();
            });

        scope.isJobRunning = false;
        scope.setLoading(false);
    }

    async setModel(model)
    {
        const scope = EyePopManager.instance;
        if (!scope.endpoint) return;

        scope.endpoint.changePopComp(scope.popComps[ model ])

    }

    async setup()
    {

        this.popNameElement.innerHTML = "Loading...";
        console.log("Setting up Pop Manager...");
        const isAuthenticated = await this.authenticate();
        const isConnected = await this.connect();
        console.log("Is Authenticated: ", isAuthenticated);
        console.log("Is Connected: ", isConnected);

        if (!isAuthenticated || !isConnected)
        {
            this.setErrorMessage("Error authenticating you pop...");
            return;
        }

        this.context = this.resultCanvasRef.getContext("2d");
        this.popPlotter = Render2d.renderer(this.context, [
            Render2d.renderBox(true),
            Render2d.renderPose(),
            Render2d.renderFace(),
            Render2d.renderHand(),
            // Render2d.renderTrail(1.0,
            // '$..keyPoints[?(@.category=="3d-body-points")].points[?(@.classLabel.includes("nose"))]')
        ]);

        this.setLoading(false);

        console.log("Pop Manager setup complete. ", this.popSession);
        this.toggleStart();
    }

    async authenticate()
    {
        try
        {
            const response = await fetch('/eyepop/session');
            const data = await response.json();

            console.log('Created new EyePop session:', data);
            this.popSession = data;

            if ('error' in this.popSession)
            {
                this.setErrorMessage("Authentication Failed... " + JSON.stringify(data));
                return false;
            }

            return true;

        } catch (error)
        {
            console.error('Authentication failed:', error);

            this.setErrorMessage("Authentication Error... " + error);

            return false;
        }
    }

    async connect()
    {
        if (this.endpoint) return false;
        if (!this.popSession) return false;

        try
        {

            console.log('Connecting to EyePop endpoint...', JSON.stringify(this.popSession));

            this.endpoint = await EyePop.endpoint({
                auth: { session: this.popSession },
            }).onStateChanged((from, to) =>
            {
                console.log("Endpoint state transition from " + from + " to " + to);
            }).onIngressEvent(async (ingressEvent) =>
            {
                console.log(ingressEvent);
                if (ingressEvent.event == 'stream-ready')
                {

                    // stop the webcam stream
                    if (this.webcam)
                    {
                        this.webcam.stream.getTracks().forEach((track) =>
                        {
                            track.stop();
                        });
                    }

                    await this.startRemoteStream(ingressEvent.ingressId);
                    this.startLiveInference(ingressEvent.ingressId);


                } else
                {
                    if (this.liveEgress && this.liveEgress.ingressId() == ingressEvent.ingressId)
                    {
                        this.videoRef.pause();
                        this.videoRef.srcObject = null;
                        this.resultContext.clearRect(0, 0, this.resultContext.width, this.resultContext.height);
                        this.liveEgress = null;
                    }
                }
            }).connect();

            this.popNameElement.innerHTML = this.endpoint.popName();
            this.createQrCode();

            return true;

        } catch (error)
        {

            console.error('Connection failed:', error);
            this.setErrorMessage("Connection Error..." + JSON.stringify(error));
            return false;

        }
    }

    async startRemoteStream(ingressId)
    {
        this.liveEgress = await this.endpoint.liveEgress(ingressId);
        this.videoRef.srcObject = await this.liveEgress.stream();
        this.videoRef.play();
    }

    async startLiveInference(ingressId)
    {
        this.endpoint.process({ ingressId: ingressId })
            .then(async (results) =>
            {
                for await (let result of results)
                {
                    // console.log(result);
                    this.setJSON(result);
                    this.drawPrediction(result);
                }
            });
    }

    async startWebcamIngress()
    {
        const scope = EyePopManager.instance;
        console.log('Starting webcam ingress...');
        console.log('Webcam:', scope.webcam);
        scope.isJobRunning = true;
        scope.webcam.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: scope.webcam.id } });
        scope.videoRef.srcObject = scope.webcam.stream;
        scope.videoRef.play();

        try
        {
            scope.popLiveIngress = await scope.endpoint.liveIngress(scope.webcam.stream);
            scope.endpoint.process({ ingressId: scope.popLiveIngress.ingressId() })
                .then(async (results) =>
                {
                    for await (let result of results)
                    {
                        // console.log(result);
                        scope.setJSON(result);
                        this.drawPrediction(result);
                    }
                });
        } catch (error)
        {
            console.error("Failed to call liveIngress:", error);
        }
    }


    drawPrediction(result)
    {
        if (!this.context) return;
        if (!result) return;
        const { source_width, source_height } = result;
        const parentWidth = this.resultCanvasRef.parentElement.clientWidth;
        const parentHeight = this.resultCanvasRef.parentElement.clientHeight;

        const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
        const scaledWidth = source_width * scaleFactor;
        const scaledHeight = source_height * scaleFactor;

        this.resultCanvasRef.width = scaledWidth;
        this.resultCanvasRef.height = scaledHeight;

        this.context.clearRect(0, 0, scaledWidth, scaledHeight);
        this.context.drawImage(this.videoRef, 0, 0, scaledWidth, scaledHeight);

        this.popPlotter.draw(result);

    }

    getClosestPrediction(time)
    {
        if (this.predictionData.length === 0) return;

        let closest = this.predictionData[ 0 ];
        let closestDifference = Math.abs(this.predictionData[ 0 ].seconds - time);

        for (let i = 0; i < this.predictionData.length; i++)
        {
            const diff = Math.abs(this.predictionData[ i ].seconds - time);
            closestDifference = Math.abs(closest.seconds - time);

            if (diff < closestDifference)
            {
                closest = this.predictionData[ i ];
            }


        }

        console.log('Closest prediction: ', closestDifference, closest.seconds, time);

        return closest;
    }

    getVideoDuration(video)
    {
        return new Promise((resolve) =>
        {
            video.onloadedmetadata = () =>
            {
                video.pause();
                resolve(video.duration);
            };
        });
    }


    disconnect()
    {
        this.endpoint.disconnect();
    }

}
