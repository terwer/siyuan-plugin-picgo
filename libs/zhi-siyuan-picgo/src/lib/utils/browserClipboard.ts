/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * This handler retrieves the images from the clipboard as a blob and returns it in a callback.
 *
 * @param pasteEvent
 * @param callback
 */
export const retrieveImageFromClipboardAsBlob = (pasteEvent: any, callback: any) => {
  if (pasteEvent.clipboardData == false) {
    if (typeof callback == "function") {
      callback(undefined)
    }
  }

  const items = pasteEvent.clipboardData.items

  if (items == undefined) {
    if (typeof callback == "function") {
      callback(undefined)
    }
  }

  let imgLength = 0
  for (let i = 0; i < items!.length; i++) {
    // Skip content if not image
    if (items[i].type.indexOf("image") == -1) continue
    // Retrieve image on clipboard as blob
    const blob = items[i].getAsFile()
    imgLength++
    if (typeof callback == "function") {
      callback(blob)
    }
  }

  // no img
  if (imgLength == 0) {
    if (typeof callback == "function") {
      callback(undefined)
    }
  }
}
