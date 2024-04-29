import React, { Children } from 'react';
import HeaderPopControls from './HeaderPopControls';

const Header = ({ children, className, loading, popNameRef, handleWebcamChange, startButtonRef, onStart }) =>
{

    return (
        <header
            className={`${className} w-full`}>
            <div
                className="flex flex-col justify-start items-center h-72 bg-transparent ml-2 mr-2">
                <a
                    className="overflow-hidden w-1/2 hover:scale-125 h-20 transition-all pt-[30px]"
                    href='https://eyepop.ai'
                    target='_blank'>
                    <img
                        src="https://raw.githubusercontent.com/64blit/files/main/pose_follow/ep_logo.png"
                        className="object-contain h-full self-center" />
                </a>

                {children}

            </div>

        </header>
    );
};

export default Header;
