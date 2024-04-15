import { onMount, type Component } from 'solid-js';
import { MD5, lib } from 'crypto-js';
import Uppy, { BasePlugin, UploadResult } from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/informer/dist/style.min.css';
import XHRUpload from '@uppy/xhr-upload';
import Informer from '@uppy/informer';

class VerifyStatusPlugin extends BasePlugin {
	constructor(uppy: Uppy) {
		super(uppy);
		this.id = 'VerifyStatus';
		this.type = 'verify';
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
            this.uppy.cancelAll();
            window.location.href = `/view?md5=${hash}`;
        }
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
            .use(VerifyStatusPlugin)
            .use(XHRUpload, { endpoint: `${import.meta.env.VITE_API_URL}/bms/score/register` })
            .on('complete', uploadedFileRedirect);
    });

    return (
        <div class="px-4 pt-4">
          <div id="uploader"></div>
          <div id="notify"></div>
        </div>
    )
};

export default Uploader;
