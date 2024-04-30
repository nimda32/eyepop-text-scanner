import React, { useEffect, useState, useRef } from 'react';


const MaskCanvas = ({ canvasSize, maskRect, className }) =>
{

    const mask = useRef();

    useEffect(() =>
    {
        if (!mask.current) return;
        if (!maskRect) return;

        const canvas = mask.current;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, .8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // use the maskRect to clear the center of the canvas, based on it's x, y, width, and height
        if (maskRect)
        {
            ctx.clearRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
        }

    }, [ mask, maskRect ]);

    return (
        <canvas
            style={{
                pointerEvents: 'none',
            }}
            className={className}
            ref={mask}
        />
    );
}

export default MaskCanvas;  
