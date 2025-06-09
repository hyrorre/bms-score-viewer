import { createSignal, onMount, type Component } from 'solid-js'
import Uppy, { BasePlugin, UploadResult } from '@uppy/core'
import DragDrop from '@uppy/drag-drop'

import '@uppy/core/dist/style.min.css'
import './drag-drop.css'
import '@uppy/informer/dist/style.min.css'
import Informer from '@uppy/informer'
import Toggle from './Toggle'

class VerifyStatusPlugin extends BasePlugin {
  private: () => boolean

  constructor(uppy: Uppy, opts: any) {
    super(uppy)
    this.id = 'VerifyStatus'
    this.type = 'verify'
    this.private = opts.private
  }

  prepareUpload = async (fileIDs: string[]) => {
    if (fileIDs.length !== 1) {
      // Should never happen
      console.log('More than one file selected (???)')
      this.uppy.cancelAll()
      return Promise.resolve()
    }
    const f = this.uppy.getFile(fileIDs[0])
    const buf = await f.data.arrayBuffer()
    return Promise.resolve()
  }

  install() {
    this.uppy.addPreProcessor(this.prepareUpload)
  }

  uninstall() {
    this.uppy.removePreProcessor(this.prepareUpload)
  }
}

const Uploader: Component = () => {
  const [privateUp, setPrivateUp] = createSignal(false)

  const uppy = new Uppy({
    autoProceed: true,
    allowMultipleUploadBatches: false,
    restrictions: {
      maxFileSize: 5 * 1024000,
      allowedFileTypes: ['.bms', '.bme', '.bml', '.pms'],
      maxNumberOfFiles: 1,
    },
  })

  const uploadedFileRedirect = (result: UploadResult) => {
    if (result.successful.length > 0) {
      const resMd5 = result.successful[0].response?.body['md5']
      window.location.href = `/view?md5=${resMd5}`
    } else alert('Error uploading file')
  }

  onMount(async () => {
    uppy
      .use(DragDrop, {
        target: '#uploader',
        height: '20vh',
        note: 'Supported files: .bms, .bme, .bml, .pms / Max file size: 5MB',
      })
      .use(Informer, { target: '#notify' })
      .use(VerifyStatusPlugin, { private: privateUp })
      .on('complete', uploadedFileRedirect)
  })

  return (
    <div class="px-4 pt-4">
      <Toggle text="Private upload" setValue={setPrivateUp} />
      <div id="uploader"></div>
      <div id="notify"></div>
    </div>
  )
}

export default Uploader
