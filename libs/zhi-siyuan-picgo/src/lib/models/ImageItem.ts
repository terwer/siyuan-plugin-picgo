/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2023-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { getFileHash } from "../utils/md5Util"

/**
 * 提取文件名
 *
 * @param url
 * @version 1.6.0
 * @since 1.6.0
 */
const extractFileName = (url: string) => {
  url = decodeURIComponent(url)
  const parts = url.split("/")
  let fileName = null

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].includes(".") && parts[i] !== "") {
      fileName = parts[i].split("?")[0]
      break
    }
  }

  if (!fileName) {
    fileName = url
  }

  return fileName
}

// // 测试用例
// const testUrls = [
//   "http://example.com/folder/filename.jpg?size=large",
//   "http://example.com/folder/filename.jpg/aaaaaa",
//   "http://example.com/folder/filename.jpg/aaaaaa/bbb?ccc",
//   "http://localhost:8002/api/v4/projects/terwer%2Fgitlab-upload/repository/files/img%2F20240326111449.jpg/raw",
// ]
//
// testUrls.forEach((url) => {
//   const fileName = extractFileName(url)
//   console.log(`URL: ${url} => File Name: ${fileName}`)
// })

/**
 * 图片信息
 */
export class ImageItem {
  /**
   * 文件，
   */
  name: string
  /**
   * 文件名称的Hash，构造函数指定
   */
  hash: string
  /**
   * 原始资源地址
   */
  originUrl: string
  /**
   * 资源地址
   */
  url: string
  /**
   * 资源备注
   */
  alt?: string
  /**
   * 标题
   */
  title?: string
  /**
   * 是否本地
   */
  isLocal: boolean
  /**
   * 图片所属的块 ID，如果没有，则忽略链接替换
   *
   * @since 1.10.0
   */
  blockId: string

  constructor(originUrl: string, url: string, isLocal: boolean, alt?: string, title?: string) {
    this.originUrl = originUrl
    // this.name = originUrl.substring(originUrl.lastIndexOf("/") + 1)
    this.name = extractFileName(originUrl)
    this.hash = getFileHash(this.name)
    this.url = url
    this.isLocal = isLocal
    this.alt = alt ?? ""
    this.title = title ?? ""
    this.blockId = ""
  }
}
