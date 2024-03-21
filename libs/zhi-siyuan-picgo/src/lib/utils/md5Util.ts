/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { md5 } from "js-md5"

/**
 * 获取文件名的hash
 *
 * @param filename 文件名
 */
export const getFileHash = (filename: string): string => {
  // import { createHash } from "crypto"
  // const hash = createHash("sha256")
  // hash.update(filename)
  // return hash.digest("hex")

  // Base64.toBase64(filename).substring(0, 8);

  return md5(filename)
}
