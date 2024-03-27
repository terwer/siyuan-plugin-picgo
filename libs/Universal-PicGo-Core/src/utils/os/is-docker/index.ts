/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { win } from "universal-picgo-store"

let isDockerCached: boolean

function hasDockerEnv() {
  try {
    const fs = win.fs
    fs.statSync("/.dockerenv")
    return true
  } catch {
    return false
  }
}

function hasDockerCGroup() {
  try {
    const fs = win.fs
    return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker")
  } catch {
    return false
  }
}

const isDocker = () => {
  if (isDockerCached === undefined) {
    isDockerCached = hasDockerEnv() || hasDockerCGroup()
  }

  return isDockerCached
}

export { isDocker }
