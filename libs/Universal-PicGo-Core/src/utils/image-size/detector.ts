/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { imageType, typeHandlers } from "./types"
import { win } from "universal-picgo-store"

const keys = Object.keys(typeHandlers) as imageType[]

// This map helps avoid validating for every single image type
const firstBytes: { [byte: number]: imageType } = {
  0x38: "psd",
  0x42: "bmp",
  0x44: "dds",
  0x47: "gif",
  0x49: "tiff",
  0x4d: "tiff",
  0x52: "webp",
  0x69: "icns",
  0x89: "png",
  0xff: "jpg",
}

export function detector(input: typeof win.Uint8Array): imageType | undefined {
  const byte = input[0]
  if (byte in firstBytes) {
    const type = firstBytes[byte]
    if (type && typeHandlers[type].validate(input)) {
      return type
    }
  }

  const finder = (key: imageType) => typeHandlers[key].validate(input)
  return keys.find(finder)
}
