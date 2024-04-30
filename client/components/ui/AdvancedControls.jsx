import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useRef, useState } from 'react';
import QrControls from './QrControls';

const AdvancedControls = ({ className, loading, popNameRef, handleWebcamChange, startButtonRef, onStart }) =>
{

    const cameraModalRef = useRef();
    const marginsStyle = 'p-4 mr-[5rem] ml-[5rem] mt-[1rem]';
    const [ webcamDevices, setWebcamDevices ] = useState([]);

    useEffect(() =>
    {
        if (webcamDevices.length > 0) return;
        if (!loading) return;

        populateWebcamDevices();

    }, [ loading ]);

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
    }

    return (

        <div
            className={`${className}  ${loading ? 'h-0' : 'h-14'} transition-all duration-500 `}>

            <div
                className={`${marginsStyle} bg-blue-400 flex h-full justify-center items-center rounded-3xl shadow-2xl p-5`}>

                <div
                    className='text-blue-100 font-extrabold text-xl w-32 overflow-hidden'
                    ref={popNameRef}
                >
                </div>

                <select
                    className={`${loading && 'hidden'} bg-white text-gray-700 border border-gray-300 rounded-3xl h-10 m-5 w-40 self-center`}
                    onChange={(e) => { handleWebcamChange(e.target.value) }}
                >
                    {webcamDevices.map((device, index) => (
                        <option key={index} value={device.deviceId}>
                            {device.label}
                        </option>
                    ))}
                </select>

                <button
                    ref={startButtonRef}
                    onClick={onStart}
                    className={`${loading && 'hidden'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-3xl h-10 m-5 min-w-32 w-44 self-center hover:scale-125 transition-all`} >
                    Start Camera
                </button>


                <QrControls loading={loading} popNameRef={popNameRef} handleWebcamChange={handleWebcamChange} startButtonRef={startButtonRef} onStart={onStart}
                />

            </div>


        </div>
    );
};

export default AdvancedControls;
