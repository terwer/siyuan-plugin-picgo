/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 解析的图片
 *
 * @author terwer
 * @since 0.8.0
 */
export class ParsedImage {
  /**
   * 链接
   */
  url: string
  /**
   * 备注
   */
  alt: string
  /**
   * 标题
   */
  title: string
  /**
   * 是否本地
   */
  isLocal: boolean

  constructor() {
    this.url = ""
    this.isLocal = false
    this.alt = ""
    this.title = ""
  }
}
