/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

export const currentWin = (window || globalThis || undefined) as any
export const parentWin = (window?.parent || window?.top || window?.self || undefined) as any
export const win = currentWin?.fs?.rm ? currentWin : parentWin?.fs?.rm ? parentWin : currentWin
export const hasNodeEnv = typeof parentWin?.fs?.rm !== "undefined"
