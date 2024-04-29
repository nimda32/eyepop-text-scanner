import React, { useEffect, useState } from 'react';
import AdvancedControls from './AdvancedControls.jsx';

const HeaderPopControls = ({ className, loading, popNameRef, handleWebcamChange, startButtonRef, onStart, showControls }) =>
{
    const [ webcamDevices, setWebcamDevices ] = useState([]);

    useEffect(() =>
    {
        console.log('loading', loading);
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

        <>
            <AdvancedControls className={`${className} ${!showControls && 'hidden'}`} loading={loading} popNameRef={popNameRef} handleWebcamChange={handleWebcamChange} startButtonRef={startButtonRef} onStart={onStart}
            />
        </>
    );
};

export default HeaderPopControls;
