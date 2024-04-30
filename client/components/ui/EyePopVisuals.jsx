import React, { useEffect, useRef } from 'react';




const EyePopVisuals = ({ className, resultCanvasRef, videoRef, setModel }) =>
{
    const sharedClass = 'object-contain h-full bg-transparent d-block';

    // when the f key is pressed make the canvas go full screen
    const toggleFullScreen = () =>
    {
        if (!document.fullscreenElement)
        {
            resultCanvasRef.current.requestFullscreen();
        } else
        {
            if (document.exitFullscreen)
            {
                document.exitFullscreen();
            }
        }
    }

    //handle the key press event
    const handleKeyPress = (e) =>
    {
        if (e.key === 'f')
        {
            toggleFullScreen();
        }
    }

    useEffect(() =>
    {
        // Add key press event listener when component mounts
        window.addEventListener('keypress', handleKeyPress);

        // Remove event listener when component unmounts
        return () =>
        {
            window.removeEventListener('keypress', handleKeyPress);
        };

    }, []);

    const modelSelectionRef = useRef();

    useEffect(() =>
    {
        console.log('modelSelectionRef', modelSelectionRef.current, resultCanvasRef.current, videoRef.current, setModel);

    }, []);

    return (
        <div className={`${className} w-full h-full flex justify-center p-0 `} >

            <div className="flex w-full absolute bottom-0 left-0 justify-center items-center">
                <div
                    className="flex h-20 justify-center items-center ml-2 pr-2 rounded-t-xl pt-2 bg-primary-gradient">

                    <h5 className="text-xl text-center text-white">Select Model:</h5>

                    <select
                        ref={modelSelectionRef}
                        onChange={() => { setModel(modelSelectionRef.current.value); }}
                        className="btn select select-bordered outline border-black max-w-xs w-1/2 m-5 text-white rounded-xl transition-all bg-black hover:bg-purple-500 hover:text-white"
                    >
                        <option className='text-white bg-black' value="peopleCommon">People + Common Objects</option>
                        <option className='text-white bg-black' value="text">Text</option>
                        <option className='text-white bg-black' value="peopleBody">People + 2D Body Pose</option>
                        <option className='text-white bg-black' value="people3d">People + 3D Pose + Hands + Face</option>
                    </select>
                </div>
            </div>

            <canvas
                id="result-overlay"
                ref={resultCanvasRef}
                className={`${sharedClass} aboslute w-full h-full flex-none`}
            ></canvas>

            <video
                ref={videoRef}
                className={`${sharedClass} hidden absolute flex-none`}
                autoPlay
                playsInline
                muted
            ></video>
        </div>
    );
};

export default EyePopVisuals;
