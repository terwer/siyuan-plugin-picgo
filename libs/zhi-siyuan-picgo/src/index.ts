/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicGo } from "./lib/siyuanPicgo"
import { SiyuanPicgoPostApi } from "./lib/siyuanPicgoPostApi"
import {
  calculateMD5,
  ConfigDb,
  ExternalPicgoConfigDb,
  IConfig,
  IExternalPicgoConfig,
  IImgInfo,
  IPicGo,
  IPicgoDb,
  IPicGoPlugin,
  IPluginConfig,
  PicgoTypeEnum,
  PluginLoaderDb,
  win,
  isSiyuanProxyAvailable,
} from "universal-picgo"
import { SiyuanConfig as SiyuanPicgoConfig } from "zhi-siyuan-api"
import { PicgoHelper, PicgoHelperEvents } from "./lib/picgoHelper"
import { retrieveImageFromClipboardAsBlob } from "./lib/utils/browserClipboard"
import { copyToClipboardInBrowser, generateUniqueName } from "./lib/utils/utils"
import { ImageItem } from "./lib/models/ImageItem"
import { ImageParser } from "./lib/parser/ImageParser"
import { ParsedImage } from "./lib/models/ParsedImage"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./lib/constants"
import { handleConfigWithFunction, handleStreamlinePluginName } from "./lib/utils/common"

export { SiyuanPicGo, SiyuanPicgoConfig, SiyuanPicgoPostApi, PicgoHelper, PicgoHelperEvents }
export { ImageItem, ImageParser, ParsedImage, SIYUAN_PICGO_FILE_MAP_KEY }
export {
  retrieveImageFromClipboardAsBlob,
  copyToClipboardInBrowser,
  calculateMD5,
  generateUniqueName,
  isSiyuanProxyAvailable,
}
export { handleConfigWithFunction, handleStreamlinePluginName }
export { ConfigDb, PluginLoaderDb, ExternalPicgoConfigDb }
export { PicgoTypeEnum }
export { win }
export {
  type IPicGo,
  type IImgInfo,
  type IPicgoDb,
  type IConfig,
  type IExternalPicgoConfig,
  type IPluginConfig,
  type IPicGoPlugin,
}
