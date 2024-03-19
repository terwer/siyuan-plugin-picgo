/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IClipboardImage, IPicGo } from "../../types"
import { win } from "universal-picgo-store"
import { CLIPBOARD_IMAGE_FOLDER } from "../constants"
import { ensureFolderSync } from "../nodeUtils"
import dayjs from "dayjs"
import { getCurrentPlatform, Platform } from "../os"
import macClipboardScript from "./script/mac.applescript?raw"
import windowsClipboardScript from "./script/windows.ps1?raw"
import windows10ClipboardScript from "./script/windows10.ps1?raw"
import linuxClipboardScript from "./script/linux.sh?raw"
import wslClipboardScript from "./script/wsl.sh?raw"

const platform2ScriptContent: {
  [key in Platform]: string
} = {
  darwin: macClipboardScript,
  win32: windowsClipboardScript,
  win10: windows10ClipboardScript,
  linux: linuxClipboardScript,
  wsl: wslClipboardScript,
}

/**
 * powershell will report error if file does not have a '.ps1' extension,
 * so we should keep the extension name consistent with corresponding shell
 */
const platform2ScriptFilename: {
  [key in Platform]: string
} = {
  darwin: "mac.applescript",
  win32: "windows.ps1",
  win10: "windows10.ps1",
  linux: "linux.sh",
  wsl: "wsl.sh",
}

const createImageFolder = (ctx: IPicGo): void => {
  const fs = win.fs
  const path = win.require("path")
  const imagePath = path.join(ctx.baseDir, CLIPBOARD_IMAGE_FOLDER)
  ensureFolderSync(fs, imagePath)
}

const getClipboardImageElectron = async (ctx: IPicGo): Promise<IClipboardImage> => {
  const fs = win.fs
  const path = win.require("path")

  createImageFolder(ctx)
  // add an clipboard image folder to control the image cache file
  const imagePath = path.join(ctx.baseDir, CLIPBOARD_IMAGE_FOLDER, `${dayjs().format("YYYYMMDDHHmmss")}.png`)
  return await new Promise<IClipboardImage>((resolve: Function, reject: Function): void => {
    const platform = getCurrentPlatform()
    const scriptPath = path.join(ctx.baseDir, platform2ScriptFilename[platform])
    // If the script does not exist yet, we need to write the content to the script file
    if (!fs.existsSync(scriptPath)) {
      fs.writeFileSync(scriptPath, platform2ScriptContent[platform], "utf8")
    }

    throw new Error("开发中...")
  })
}

export { getClipboardImageElectron }
