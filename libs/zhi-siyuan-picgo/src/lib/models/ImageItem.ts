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

  constructor(originUrl: string, url: string, isLocal: boolean, alt?: string, title?: string) {
    this.originUrl = originUrl
    this.name = originUrl.substring(originUrl.lastIndexOf("/") + 1)
    this.hash = getFileHash(this.name)
    this.url = url
    this.isLocal = isLocal
    this.alt = alt ?? ""
    this.title = title ?? ""
  }
}
