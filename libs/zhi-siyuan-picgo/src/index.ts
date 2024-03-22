/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicgoPostApi } from "./lib/siyuanPicgoPostApi"
import {
  ConfigDb,
  ExternalPicgoConfigDb,
  IExternalPicgoConfig,
  IImgInfo,
  IPicGo,
  IPicgoDb,
  IConfig,
  PicgoTypeEnum,
  PluginLoaderDb,
} from "universal-picgo"
import { SiyuanConfig as SiyuanPicgoConfig } from "zhi-siyuan-api"
import { PicgoHelper } from "./lib/picgoHelper"
import { retrieveImageFromClipboardAsBlob } from "./lib/utils/browserClipboard"
import { copyToClipboardInBrowser } from "./lib/utils/utils"

export { SiyuanPicgoConfig, SiyuanPicgoPostApi, PicgoHelper }
export { retrieveImageFromClipboardAsBlob, copyToClipboardInBrowser }
export { ConfigDb, PluginLoaderDb, ExternalPicgoConfigDb }
export { PicgoTypeEnum }
export { type IPicGo, type IImgInfo, type IPicgoDb, type IConfig, type IExternalPicgoConfig }
