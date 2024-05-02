import ModelSelector from "./ModelSelector";
import React, { useState } from "react";

const SettingsDialog = React.forwardRef((props, ref) =>
{
    const [ popId, setPopId ] = useState('');
    const [ popSecret, setPopSecret ] = useState('');

    return (
        <dialog id="my_modal_2" ref={ref} className="modal">
            <div className="modal-box text-white flex flex-col w-7/12 max-w-5xl justify-center justify-items-center align-middle items-center ">
                {props.showModelSelector && <ModelSelector className={`h-full text-4xl`} setModel={props.setModel} />}

                <button className="btn btn-primary text-4xl m-5"
                    onClick={() =>
                    {
                        window.open('https://dashboard.eyepop.ai', '_blank')
                    }
                    }>
                    <div className="text-black text-4xl">Visit EyePop.ai</div>
                </button>

                <div className="flex flex-col w-full gap-5">

                    <label htmlFor="popUuid" className="text-white text-4xl m-2">Pop UUID:</label>
                    <input type="text" id="popUuid" name="popUuid" className="input-field input bg-gray-950 text-white"
                        onChange={(e) => { setPopId(e.target.value) }} />
                    <label htmlFor="popSecret" className="text-white text-4xl m-2">Pop Secret:</label>
                    <input type="text" id="popSecret" name="popSecret" className="input-field input bg-gray-950 text-white"
                        onChange={(e) => { setPopSecret(e.target.value) }} />

                    {
                        popId &&
                        popSecret &&
                        <button className="btn btn-primary text-4xl" onClick={() => { props.setPopUUID(popId); props.setPopSecret(popSecret); }}>
                            Continue
                        </button>
                    }
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    )
});

export default SettingsDialog;
