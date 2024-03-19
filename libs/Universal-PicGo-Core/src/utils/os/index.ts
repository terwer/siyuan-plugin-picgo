/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { isWsl } from "./is-wsl"
import { win } from "universal-picgo-store"

export type Platform = "darwin" | "win32" | "win10" | "linux" | "wsl"

const getCurrentPlatform = (): Platform => {
  const os = win.require("os")

  const platform = win.process.platform
  if (isWsl()) {
    return "wsl"
  }
  if (platform === "win32") {
    const currentOS = os.release().split(".")[0]
    if (currentOS === "10") {
      return "win10"
    } else {
      return "win32"
    }
  } else if (platform === "darwin") {
    return "darwin"
  } else {
    return "linux"
  }
}

export { getCurrentPlatform }
