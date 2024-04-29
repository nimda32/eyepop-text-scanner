import React, { useEffect, useRef } from "react";

const DemoVideo = ({ updateTrigger }) =>
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
            <div className="pt-20 pl-5 pr-5 pb-40 flex flex-col  justify-center">

                <video id={`video + ${updateTrigger}`} ref={videoRef} muted src="../../../assets/3.6.24 compilation_1.mp4" controls playsInline loop></video>

            </div>
        </>
    );
};

export default DemoVideo;
