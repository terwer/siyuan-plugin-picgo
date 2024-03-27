/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { calculateMD5 } from "universal-picgo"

/**
 * 获取文件名的hash
 *
 * @param filename 文件名
 */
export const getFileHash = (filename: string): string => {
  return calculateMD5(filename)
}
