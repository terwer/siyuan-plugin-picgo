/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo } from "universal-picgo"

export interface IGuiMenuItem {
  label: string
  handle: (ctx: IPicGo, guiApi: any) => Promise<void>
}

/**
 * 上传 Markdown 图片的选项。
 */
export interface UploadMarkdownImagesOptions {
  /**
   * 是否把正文中已有的外链图片也上传到图床。
   *
   * 默认 false，保持只上传本地图片的历史行为；开启后同时处理本地图片和外链图片。
   */
  includeRemoteImages?: boolean
}
