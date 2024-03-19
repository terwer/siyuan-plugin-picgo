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
import { IBuildInEvent } from "../enums"

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
  const { spawn } = win.require("child_process")

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

    let execution
    if (platform === "darwin") {
      execution = spawn("osascript", [scriptPath, imagePath])
    } else if (platform === "win32" || platform === "win10") {
      execution = spawn("powershell", [
        "-noprofile",
        "-noninteractive",
        "-nologo",
        "-sta",
        "-executionpolicy",
        "unrestricted",
        // fix windows 10 native cmd crash bug when "picgo upload"
        // https://github.com/PicGo/PicGo-Core/issues/32
        // '-windowstyle','hidden',
        // '-noexit',
        "-file",
        scriptPath,
        imagePath,
      ])
    } else {
      execution = spawn("sh", [scriptPath, imagePath])
    }

    execution.stdout.on("data", (data: typeof win.Buffer) => {
      if (platform === "linux") {
        if (data.toString().trim() === "no xclip or wl-clipboard") {
          ctx.emit(IBuildInEvent.NOTIFICATION, {
            title: "xclip or wl-clipboard not found",
            body: "Please install xclip(for x11) or wl-clipboard(for wayland) before run picgo",
          })
          return reject(new Error("Please install xclip(for x11) or wl-clipboard(for wayland) before run picgo"))
        }
      }
      const imgPath = data.toString().trim()

      // if the filePath is the real file in system
      // we should keep it instead of removing
      let shouldKeepAfterUploading = false

      // in macOS if your copy the file in system, it's basename will not equal to our default basename
      if (path.basename(imgPath) !== path.basename(imagePath)) {
        // if the path is not generate by picgo
        // but the path exists, we should keep it
        if (fs.existsSync(imgPath)) {
          shouldKeepAfterUploading = true
        }
      }
      // if the imgPath is invalid
      if (imgPath !== "no image" && !fs.existsSync(imgPath)) {
        return reject(new Error(`Can't find ${imgPath}`))
      }

      resolve({
        imgPath,
        shouldKeepAfterUploading,
      })
    })
  })
}

export { getClipboardImageElectron }
