import React, { useEffect, useRef, useState } from 'react';
import DemoVideo from './presentation-pages/DemoVideo';
import PipelineVisualization from './presentation-pages/PipelineVisualization';
import JsonExplorer from './presentation-pages/JsonExplorer';
import Header from './Header';
import HeaderPopControls from './HeaderPopControls';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faGear, faComputer, faVideo, faChain, faPlay, faPause } from '@fortawesome/free-solid-svg-icons';


const EyePopPresentation = ({ className, json = { status: { 'message': 'Loading...' } }, popNameRef, handleWebcamChange, startButtonRef, onStart, loading }) =>
{
    const navButton1Ref = useRef();
    const navButton2Ref = useRef();
    const navButton3Ref = useRef();

    const [ swipe, setSwipe ] = useState();
    const [ slideIndex, setSlideIndex ] = useState(0);
    const [ showControls, setShowControls ] = useState(false);
    const [ paused, setPaused ] = useState(false);
    const [ reset, setReset ] = useState("");

    return (
        <div className={`${className} w-full h-20 absolute left-0 top-0 flex flex-row justify-center bg-transparent gap-0`} >

            <Header
                handleWebcamChange={handleWebcamChange}
                startButtonRef={startButtonRef}
                onStart={onStart}
                popNameRef={popNameRef}
                loading={loading}
            />

            <HeaderPopControls
                handleWebcamChange={handleWebcamChange}
                startButtonRef={startButtonRef}
                onStart={onStart}
                popNameRef={popNameRef}
                loading={loading}
                showControls={!loading}
            />

        </div>
    );
};

export default EyePopPresentation;
