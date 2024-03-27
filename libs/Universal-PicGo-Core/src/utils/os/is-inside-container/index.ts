/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { win } from "universal-picgo-store"
import { isDocker } from "../is-docker"

let cachedResult: boolean

// Podman detection
const hasContainerEnv = () => {
  try {
    const fs = win.fs
    fs.statSync("/run/.containerenv")
    return true
  } catch {
    return false
  }
}

export default function isInsideContainer() {
  if (cachedResult === undefined) {
    cachedResult = hasContainerEnv() || isDocker()
  }

  return cachedResult
}
