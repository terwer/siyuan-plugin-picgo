/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IClipboardImage, IPicGo } from "../types"
import { hasNodeEnv } from "universal-picgo-store"
import { getClipboardImageElectron } from "./clipboard/electron"
import { getClipboardImageBrowser } from "./clipboard/browser"

// Thanks to vs-picgo: https://github.com/Spades-S/vs-picgo/blob/master/src/extension.ts
const getClipboardImage = async (ctx: IPicGo): Promise<IClipboardImage> => {
  if (hasNodeEnv) {
    return await getClipboardImageElectron(ctx)
  } else {
    return await getClipboardImageBrowser(ctx)
  }
}

export default getClipboardImage
