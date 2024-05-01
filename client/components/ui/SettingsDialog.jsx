import ModelSlector from "./ModelSelector";
import React from "react";

const SettingsDialog = React.forwardRef((props, ref) => (

    <dialog id="my_modal_2" ref={ref} className="modal">

        <div className="modal-box text-white flex flex-col w-7/12 max-w-5xl justify-center justify-items-center align-middle items-center" >

            {props.showModelSelector && <ModelSlector className={`h-full`} setModel={props.setModel} />}

            <div className="flex flex-col w-full">
                <label htmlFor="popUuid" className="text-white">POP UUID:</label>
                <input type="text" id="popUuid" name="popUuid" className="input-field input bg-gray-950 text-white"
                    onChange={(e) => { props.setPopUUID(e.target.value) }} />
            </div>

        </div>

        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>

    </dialog>
));

export default SettingsDialog;
