/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

const currentWin = (window || globalThis || undefined) as any
const parentWin = (window?.parent || window?.top || window?.self || undefined) as any
export const win = currentWin?.fs ? currentWin : parentWin?.fs ? parentWin : currentWin
export const hasNodeEnv = typeof win?.fs !== "undefined"
