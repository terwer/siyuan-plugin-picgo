import md5 from "blueimp-md5-es6/js/md5"

/**
 * 获取文件名的hash
 * @param filename 文件名
 */
export const getFileHash = (filename): string => {
  // import { createHash } from "crypto"
  // const hash = createHash("sha256")
  // hash.update(filename)
  // return hash.digest("hex")

  // Base64.toBase64(filename).substring(0, 8);
  return md5(filename)
}
