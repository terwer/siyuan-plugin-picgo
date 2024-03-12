import arrayBufferToBuffer from "arraybuffer-to-buffer"

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const readBuffer = (buf: any): Buffer => {
  let imageBuffer = buf
  if (imageBuffer instanceof ArrayBuffer) {
    imageBuffer = arrayBufferToBuffer(imageBuffer)
  }
  return imageBuffer
}

const streamUtils = {
  readBuffer,
}

export default streamUtils
