import React, { useState, useEffect, useRef } from "react";


export const ResultsOverlay = ({ title, labelsList }) =>
{


    return (
        <>
            {title && labelsList.length > 0 &&

                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-around pointer-events-none overflow-hidden p-[5rem] ">

                    <div className="z-20 text-6xl text-green-500 w-full m-[5rem] p-5 rounded-xl  bg-gray-800">
                        {title}
                    </div>

                    <div className="z-20 flex flex-row gap-2 w-full flex-wrap  m-[5rem] p-5 rounded-xl bg-gray-800">
                        {labelsList.map((label, index) => (
                            <a
                                key={index}
                                href={`https://www.google.com/search?q=${label}+cocktail+recipes`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-4xl text-blue-500 underline pointer-events-auto"
                                style={{ overflowWrap: "break-word" }}
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                </div>}
        </>
    );

}
