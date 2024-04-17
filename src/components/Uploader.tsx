import { createSignal, onMount, type Component } from 'solid-js';
import { MD5, lib } from 'crypto-js';
import Uppy, { BasePlugin, UploadResult } from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import '@uppy/core/dist/style.min.css';
import './drag-drop.css';
import '@uppy/informer/dist/style.min.css';
import XHRUpload from '@uppy/xhr-upload';
import Informer from '@uppy/informer';
import Toggle from './Toggle';

class VerifyStatusPlugin extends BasePlugin {
    private: (() => boolean);

	constructor(uppy: Uppy, opts: any) {
		super(uppy);
		this.id = 'VerifyStatus';
		this.type = 'verify';
        this.private = opts.private;
	}

	prepareUpload = async (fileIDs: string[]) => {
        if (fileIDs.length !== 1) {
            // Should never happen
            console.log("More than one file selected (???)")
            this.uppy.cancelAll();
            return Promise.resolve();
        }
        const f = this.uppy.getFile(fileIDs[0]);
        const buf = await f.data.arrayBuffer();
        const hash = MD5(lib.WordArray.create(buf)).toString();
        console.log(hash);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/bms/score/status?md5=${hash}`);
        let r = await res.json();
        if (r["status"] === "OK") {
            if (r["private"] === this.private() || !(confirm(`Selected chart has already been uploaded with the following privacy setting: ${r["private"] ? "private" : "public"}; change to ${this.private() ? "private" : "public"}?`))) {
                this.uppy.cancelAll();
                window.location.href = `/view?md5=${hash}`;
                return Promise.resolve();
            }
        }
        this.uppy.setFileState(fileIDs[0], {
            xhrUpload: {
                //@ts-ignore: it actually exists but Uppy types are a bit messed up I think
                ...f.xhrUpload,
                endpoint: `${import.meta.env.VITE_API_URL}/bms/score/register${this.private() ? "?private" : ""}`
            }
        })
		return Promise.resolve();
	};

	install() {
		this.uppy.addPreProcessor(this.prepareUpload);
	}

	uninstall() {
		this.uppy.removePreProcessor(this.prepareUpload);
	}
}

const Uploader: Component = () => {
    const [privateUp, setPrivateUp] = createSignal(false);

    const uppy = new Uppy({ autoProceed: true,
        allowMultipleUploadBatches: false,
        restrictions: {
            maxFileSize: 5 * 1024000,
            allowedFileTypes: ['.bms', '.bme', '.bml', '.pms'],
            maxNumberOfFiles: 1
        }
    });

    const uploadedFileRedirect = (result: UploadResult) => {
        if (result.successful.length > 0) {
            const resMd5 = result.successful[0].response?.body["md5"];
            window.location.href = `/view?md5=${resMd5}`;
        }
        else
            alert("Error uploading file");
    };

    onMount(async () => {
        uppy.use(DragDrop, { target: '#uploader', height: '20vh', note: "Supported files: .bms, .bme, .bml, .pms / Max file size: 5MB" })
            .use(Informer, { target: '#notify' })
            .use(XHRUpload, { endpoint: `${import.meta.env.VITE_API_URL}/bms/score/register` })
            .use(VerifyStatusPlugin, { private: privateUp })
            .on('complete', uploadedFileRedirect);
    });

    return (
        <div class="px-4 pt-4">
            <Toggle text="Private upload" setValue={setPrivateUp} />
            <div id="uploader"></div>
            <div id="notify"></div>
        </div>
    )
};

export default Uploader;
