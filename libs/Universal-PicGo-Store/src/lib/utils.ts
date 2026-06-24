/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

const safeGet = (target: any, key: string): any => {
  try {
    return target?.[key]
  } catch {
    return undefined
  }
}

const browserWindow = typeof window !== "undefined" ? window : undefined

export const currentWin = (browserWindow || globalThis || undefined) as any
export const parentWin = (browserWindow?.parent || browserWindow?.top || browserWindow?.self || undefined) as any

const hasFsRm = (target: any): boolean => typeof safeGet(safeGet(target, "fs"), "rm") !== "undefined"
const hasRequire = (target: any): boolean => typeof safeGet(target, "require") === "function"

export const win = hasFsRm(currentWin) ? currentWin : hasFsRm(parentWin) ? parentWin : currentWin
export const hasNodeEnv = hasFsRm(currentWin) && hasRequire(currentWin)
