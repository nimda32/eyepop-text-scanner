import React, { useEffect, useRef, useState } from 'react';
import MobileScanner from './ui/MobileScanner.jsx';

export function Main()
{

    const resultCanvasRef = useRef();
    const videoRef = useRef();
    const popNameRef = useRef();

    return (
        <MobileScanner popNameRef={popNameRef} resultCanvasRef={resultCanvasRef} videoRef={videoRef} />
    );
}

