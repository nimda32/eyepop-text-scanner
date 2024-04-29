import React, { useEffect, useRef } from "react";


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faComputer, faVideo, faChain } from '@fortawesome/free-solid-svg-icons';


const PipelineVisualization = ({ updateTrigger }) =>
{

    const videoRef = useRef();

    useEffect(() =>
    {
        if (!videoRef.current) return;

        videoRef.current.currentTime = 0;
        videoRef.current.play();
    }, [ updateTrigger ]);


    return (
        <>

            <video ref={videoRef} className="max-h-[100%]" width={'100%'} id={`video${updateTrigger}`} src="../../../assets/graphic.webm" playsInline controls loop></video>

        </>
    );
};

export default PipelineVisualization;
