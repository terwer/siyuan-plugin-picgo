/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IClipboardImage, IPicGo } from "../../types"

const getClipboardImageBrowser = async (ctx: IPicGo): Promise<IClipboardImage> => {
  throw new Error("getClipboardImage is not supported in browser")
}

export { getClipboardImageBrowser }
