/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * Picgo处理文章统一返回结果
 */
export class PicgoPostResult {
  /**
   * 是否成功
   */
  flag: boolean
  /**
   * 是否有图片
   */
  hasImages: boolean
  /**
   * 处理后的文章链接
   */
  mdContent: string
  /**
   * 错误信息
   */
  errmsg: string

  constructor() {
    this.flag = false
    this.hasImages = false
    this.mdContent = ""
    this.errmsg = ""
  }
}
