import React, { useEffect, useState, videoRef, resultCanvasRef, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import AdvancedControls from './AdvancedControls';
import { EyePop } from "@eyepop.ai/eyepop";
import { Render2d } from '@eyepop.ai/eyepop-render-2d';
import EyePopVisuals from './EyePopVisuals';
import MaskCanvas from './MaskCanvas';


const MobileScanner = ({ className, handleWebcamChange, onStart }) =>
{
    const sharedClass = 'object-contain h-full w-full d-block aboslute flex-none';
    const marginsStyle = 'p-4 mr-[5rem] ml-[5rem] mt-[1rem]';

    let isDrawing = false;

    const [ loading, setLoading ] = useState(true);
    const [ eyePopEndpoint, setEyePopEndpoint ] = useState(null);
    const [ liveIngress, setLiveIngress ] = useState(null);
    const [ webcamDevices, setWebcamDevices ] = useState([]);
    const [ selectedWebcam, setSelectedWebcam ] = useState(null);
    const [ videoPlaying, setVideoPlaying ] = useState(false);
    const [ isBoxDrawing, setIsBoxDrawing ] = useState(false);

    const resultCanvasRef = useRef();
    const [ canvasCtx, setCanvasCtx ] = useState(null);
    const videoRef = useRef();
    const cameraModalRef = useRef();
    const popNameRef = useRef();

    const [ maskRect, setMaskRect ] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [ maskSize, setMaskSize ] = useState({ width: 0, height: 0 });

    useEffect(() =>
    {
        if (webcamDevices.length > 0) return;
        if (!loading) return;

        populateWebcamDevices();

    }, [ loading ]);

    useEffect(() =>
    {
        if (!resultCanvasRef.current) return;
        if (!videoRef.current) return;
        const ctx = resultCanvasRef.current.getContext('2d');
        setCanvasCtx(ctx);

        async function setupEyePop()
        {
            try
            {
                const response = await fetch('/eyepop/session');
                const sessionData = await response.json();

                console.log('EyePop Session data:', sessionData);

                // Set the endpoint
                const endpoint = await EyePop.endpoint({
                    auth: { session: sessionData },
                }).onStateChanged((from, to) =>
                {
                    console.log("Endpoint state transition from " + from + " to " + to);
                }).onIngressEvent((event) =>
                {
                    console.log('Ingress event:', event);
                }).connect();

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

        let animationLoop = null;
        const blitVideoAnimation = () =>
        {
            if (!isDrawing)
            {
                const source_height = videoRef.current.videoHeight;
                const source_width = videoRef.current.videoWidth;

                const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
                const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

                const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
                const scaledWidth = source_width * scaleFactor;
                const scaledHeight = source_height * scaleFactor;

                resultCanvasRef.current.width = scaledWidth;
                resultCanvasRef.current.height = scaledHeight;

                ctx.drawImage(videoRef.current, 0, 0, scaledWidth, scaledHeight);
            }

            animationLoop = requestAnimationFrame(blitVideoAnimation);
        }

        const startAnimation = () =>
        {
            animationLoop = requestAnimationFrame(blitVideoAnimation);
        }

        videoRef.current.addEventListener('play', startAnimation);

        return () =>
        {
            cancelAnimationFrame(animationLoop);
            videoRef.current.removeEventListener('play', startAnimation);
        }

    }, [ resultCanvasRef, videoRef ]);

    const toggleCamera = async () =>
    {
        if (!videoRef.current) return;

        if (videoRef.current.paused)
        {
            selectWebcam(selectedWebcam);
        } else
        {
            // release webcam and close the live ingress
            const stream = videoRef.current.srcObject;

            stream.getTracks().forEach((track) =>
            {
                track.stop();
            });

            videoRef.current.srcObject = null;
        }

        setVideoPlaying(!videoPlaying);
    }

    const startInference = async () =>
    {
        console.log('Starting inference:', eyePopEndpoint);

        const dataUrl = resultCanvasRef.current.toDataURL('image/png');
        const binary = atob(dataUrl.split(',')[ 1 ]);
        const array = [];

        for (let i = 0; i < binary.length; i++)
        {
            array.push(binary.charCodeAt(i));
        }

        const blob = new Blob([ new Uint8Array(array) ], { type: 'image/png' });

        eyePopEndpoint
            .process({ stream: blob, mimeType: 'image/png' })
            .then(async (results) =>
            {
                const remoteOverlayContext = resultCanvasRef.current.getContext('2d');

                const remoteRender = Render2d.renderer(remoteOverlayContext, [
                    Render2d.renderBox(),
                ]);

                for await (let result of results)
                {
                    console.log('Result:', result);
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

    }

    let startX, startY;
    const handleDynamicBoxDraw = (e) =>
    {
        if (!canvasCtx) return;

        const source_height = resultCanvasRef.current.height;
        const source_width = resultCanvasRef.current.width;

        const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
        const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

        const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
        const scaledWidth = source_width * scaleFactor;
        const scaledHeight = source_height * scaleFactor;

        resultCanvasRef.current.width = scaledWidth;
        resultCanvasRef.current.height = scaledHeight;
        setMaskSize({ width: scaledWidth, height: scaledHeight })


        const rect = resultCanvasRef.current.getBoundingClientRect();

        let x, y;

        if (e.type === 'mousedown' || e.type === 'mousemove')
        {
            x = (e.clientX - rect.left) * scaleFactor;
            y = (e.clientY - rect.top) * scaleFactor;
        } else if (e.type === 'touchstart' || e.type === 'touchmove')
        {
            x = (e.touches[ 0 ].clientX - rect.left) * scaleFactor;
            y = (e.touches[ 0 ].clientY - rect.top) * scaleFactor;
        }

        canvasCtx.strokeStyle = 'blue';
        canvasCtx.lineWidth = 2;

        if (e.type === 'mousedown' || e.type === 'touchstart')
        {
            startX = x;
            startY = y;
            isDrawing = true;
        } else if ((e.type === 'mousemove' && e.buttons === 1) || e.type === 'touchmove')
        {
            if (isDrawing)
            {
                canvasCtx.clearRect(0, 0, resultCanvasRef.current.width, resultCanvasRef.current.height);
                canvasCtx.beginPath();
                canvasCtx.rect(startX, startY, x - startX, y - startY);
                canvasCtx.stroke();
            }

            setMaskRect({
                x: startX,
                y: startY,
                width: x - startX,
                height: y - startY,
            });

        } else if (e.type === 'mouseup' || e.type === 'touchend')
        {
            isDrawing = false;

        }
    }


    // add listeners for click and drag events that will draw a box on the canvas
    useEffect(() =>
    {
        if (!canvasCtx) return;

        resultCanvasRef.current.addEventListener('mousedown', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('mousemove', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('mouseup', handleDynamicBoxDraw);

        resultCanvasRef.current.addEventListener('touchstart', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('touchmove', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('touchend', handleDynamicBoxDraw);

        return () =>
        {
            resultCanvasRef.current.removeEventListener('mousedown', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('mousemove', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('mouseup', handleDynamicBoxDraw);

            resultCanvasRef.current.removeEventListener('touchstart', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('touchmove', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('touchend', handleDynamicBoxDraw);
        }
    }, [ canvasCtx ]);


    return (
        <div className='flex flex-col items-center justify-between h-full'>


            <div className={`absolute left-0 top-0 w-full h-full p-0 justify-center `} >

                <MaskCanvas
                    maskRect={maskRect}
                    canvasSize={maskSize}
                    id="mask-canvas"
                    className={`${sharedClass} fixed top-0 left-0 w-full h-full flex justify-center p-0`}
                ></MaskCanvas>

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
                className={` ${loading ? 'h-0' : 'h-14'} transition-all duration-500 z-10 `}>

                <div
                    className={`${marginsStyle} bg-blue-400 flex h-full justify-center items-center rounded-3xl shadow-2xl p-5`}>

                    {loading && <div className='text-blue-100 font-extrabold text-center text-xl w-32 overflow-hidden'>Loading...</div>}

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
                        onClick={() => toggleCamera()}
                        className={`${loading && 'hidden'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-3xl h-10 mr-5 min-w-32 w-44 self-center hover:scale-125 transition-all`} >
                        {videoPlaying ? 'Stop' : 'Start'}
                    </button>

                </div>
            </div>


            <div className="bg-blue-400 flex h-20 w-20 justify-center m-5 items-center rounded-full shadow-2xl p-5 z-10">
                <FontAwesomeIcon className='text-blue-100 rounded-full p-2 w-full h-full' icon={faCamera} onClick={() => startInference()} />
            </div>


        </div>
    );

}


export default MobileScanner;
