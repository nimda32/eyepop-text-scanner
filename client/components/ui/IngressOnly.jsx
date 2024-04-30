import React, { useEffect, useState, videoRef, resultCanvasRef, useRef } from 'react';
import AdvancedControls from './AdvancedControls';
import { EyePop } from "@eyepop.ai/eyepop";
import { Render2d } from '@eyepop.ai/eyepop-render-2d';
import EyePopVisuals from './EyePopVisuals';


const IngressOnly = ({ className, handleWebcamChange, onStart }) =>
{
    const sharedClass = 'object-contain h-full d-block aboslute';
    const marginsStyle = 'p-4 mr-[5rem] ml-[5rem] mt-[1rem]';


    const [ eyePopSessionData, setEyePopSessionData ] = useState({});
    const [ loading, setLoading ] = useState(true);
    const [ eyePopEndpoint, setEyePopEndpoint ] = useState(null);
    const [ liveIngress, setLiveIngress ] = useState(null);
    const [ webcamDevices, setWebcamDevices ] = useState([]);
    const [ selectedWebcam, setSelectedWebcam ] = useState(null);

    const resultCanvasRef = useRef();
    const videoRef = useRef();
    const cameraModalRef = useRef();
    const popNameRef = useRef();

    useEffect(() =>
    {
        if (webcamDevices.length > 0) return;
        if (!loading) return;

        populateWebcamDevices();

    }, [ loading ]);

    useEffect(() =>
    {

        async function setupEyePop()
        {

            console.log('URL params:', window.location.search);
            const urlParams = new URLSearchParams(window.location.search);

            console.log('URL params:', urlParams);
            const mobileValue = urlParams.get('mobile');

            console.log('Mobile value:', mobileValue);
            if (!mobileValue)
            {
                alert('URL Invalid, please try again');
                return; // Exit the useEffect if there is no mobileValue
            }

            try
            {
                const mobileData = JSON.parse(decodeURIComponent(mobileValue));
                setEyePopSessionData(mobileData);
                console.log('EyePop Session data:', mobileData);

                // Set the endpoint
                const endpoint = await EyePop.endpoint({
                    auth: { session: mobileData },
                }).onStateChanged((from, to) =>
                {
                    console.log("Endpoint state transition from " + from + " to " + to);
                }).onIngressEvent((event) =>
                {
                    console.log('Ingress event:', event);

                    if (event.event === 'stream-ready')
                    {
                        startInference(endpoint, event.ingressId)
                    }
                }).connect();

                console.log('____EyePop Endpoint:', endpoint);
                setEyePopEndpoint(endpoint);
                setLoading(false);
                popNameRef.current.innerText = endpoint.popName();

            } catch (error)
            {
                console.error('Error parsing mobile data:', error);
                alert('Failed to parse session data, please check the URL and try again.');
            }
        }
        setupEyePop();

    }, [ setEyePopSessionData ]);

    const toggleIngress = async () =>
    {
        if (!liveIngress)
        {
            selectWebcam(selectedWebcam);
            return;
        }

        if (liveIngress)
        {

            // release webcam and close the live ingress
            const stream = videoRef.current.srcObject;

            stream.getTracks().forEach((track) =>
            {
                track.stop();
            });

            videoRef.current.srcObject = null;
            await liveIngress.close();

            setLiveIngress(null);

        }
    }

    const startInference = async (endpoint, ingressId) =>
    {
        console.log('Starting inference:', ingressId, endpoint);

        endpoint
            .process({ ingressId: ingressId })
            .then(async (results) =>
            {
                const remoteOverlayContext = resultCanvasRef.current.getContext('2d');

                const remoteRender = Render2d.renderer(remoteOverlayContext, [
                    Render2d.renderBox(),
                ]);

                for await (let result of results)
                {
                    const { source_width, source_height } = result;
                    const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
                    const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

                    const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
                    const scaledWidth = source_width * scaleFactor;
                    const scaledHeight = source_height * scaleFactor;

                    resultCanvasRef.current.width = scaledWidth;
                    resultCanvasRef.current.height = scaledHeight;

                    remoteOverlayContext.clearRect(0, 0, scaledWidth, scaledHeight);
                    remoteOverlayContext.drawImage(videoRef.current, 0, 0, scaledWidth, scaledHeight);
                    remoteRender.draw(result);
                }
            });

    }

    const populateWebcamDevices = async () =>
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
        setWebcamDevices(webcamDevices);
        setSelectedWebcam(webcamDevices[ 0 ].deviceId);
    }

    const selectWebcam = async (deviceID) =>
    {
        console.log('Selecting webcam:', deviceID);
        setSelectedWebcam(deviceID);

        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceID } });
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        console.log('Setting webcam:', deviceID, stream);

        stream.getTracks().forEach((track) =>
        {
            console.log('Track:', track);
        });

        const liveIngress = await eyePopEndpoint.liveIngress(stream);
        console.log('Live Ingress:', liveIngress);
        setLiveIngress(liveIngress);
    }


    return (
        <div className='flex flex-row justify-center'>


            <div className={`absolute left-0 top-0 w-full h-full flex justify-center p-0 `} >

                <canvas
                    id="result-overlay-mobile"
                    ref={resultCanvasRef}
                    className={`${sharedClass}`}
                ></canvas>

                <video
                    ref={videoRef}
                    className={`${sharedClass} hidden`}
                    autoPlay
                    playsInline
                    muted
                ></video>
            </div>

            <div
                className={`${className}  ${loading ? 'h-0' : 'h-14'} transition-all duration-500 z-10 `}>

                <div
                    className={`${marginsStyle} bg-blue-400 flex h-full justify-center items-center rounded-3xl shadow-2xl p-5`}>

                    <div
                        className='text-blue-100 font-extrabold text-xl w-32 overflow-hidden'
                        ref={popNameRef}
                    >
                    </div>

                    <select
                        className={`${loading && 'hidden'} bg-white text-gray-700 border border-gray-300 rounded-3xl h-10 mr-5 w-72 self-center`}
                        onChange={(e) => { selectWebcam(e.target.value) }}
                    >

                        {webcamDevices.map((device, index) => (
                            <option key={index} value={device.deviceId}>
                                {device.label}
                            </option>
                        ))}

                    </select>

                    <button
                        ref={null}
                        onClick={toggleIngress}
                        className={`${loading && 'hidden'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-3xl h-10 mr-5 min-w-32 w-44 self-center hover:scale-125 transition-all`} >
                        {liveIngress ? 'Stop' : 'Start'}
                    </button>

                </div>
            </div>


        </div>
    );

}


export default IngressOnly;
