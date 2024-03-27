/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import isInsideContainer from "../is-inside-container"
import { win } from "universal-picgo-store"

const isWsl = () => {
  const fs = win.fs
  const os = win.require("os")
  if (win.process.platform !== "linux") {
    return false
  }

  if (os.release().toLowerCase().includes("microsoft")) {
    if (isInsideContainer()) {
      return false
    }

    return true
  }

  try {
    return fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isInsideContainer() : false
  } catch {
    return false
  }
}

export { isWsl }
