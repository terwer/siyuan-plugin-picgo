/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import {
  ConfigDb,
  ExternalPicgoConfigDb,
  IConfig,
  IExternalPicgoConfig,
  IImgInfo,
  IPicGo,
  IPicGoPlugin,
  IPicgoDb,
  IPluginConfig,
  PicgoTypeEnum,
  PluginLoaderDb,
  calculateMD5,
  isSiyuanProxyAvailable,
  win,
} from "universal-picgo"
import { SiyuanConfig as SiyuanPicgoConfig } from "zhi-siyuan-api"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./lib/constants"
import { ImageItem } from "./lib/models/ImageItem"
import { ParsedImage } from "./lib/models/ParsedImage"
import { ImageParser } from "./lib/parser/ImageParser"
import { PicgoHelper, PicgoHelperEvents } from "./lib/picgoHelper"
import { SiyuanPicGo } from "./lib/siyuanPicgo"
import { SiyuanPicgoPostApi } from "./lib/siyuanPicgoPostApi"
import { retrieveImageFromClipboardAsBlob } from "./lib/utils/browserClipboard"
import { handleConfigWithFunction, handleStreamlinePluginName } from "./lib/utils/common"
import { copyToClipboardInBrowser, generateUniqueName, replaceImageLink } from "./lib/utils/utils"

export {
  ConfigDb,
  ExternalPicgoConfigDb,
  ImageItem,
  ImageParser,
  ParsedImage,
  PicgoHelper,
  PicgoHelperEvents,
  PicgoTypeEnum,
  PluginLoaderDb,
  SIYUAN_PICGO_FILE_MAP_KEY,
  SiyuanPicGo,
  SiyuanPicgoConfig,
  SiyuanPicgoPostApi,
  calculateMD5,
  copyToClipboardInBrowser,
  generateUniqueName,
  handleConfigWithFunction,
  handleStreamlinePluginName,
  isSiyuanProxyAvailable,
  replaceImageLink,
  retrieveImageFromClipboardAsBlob,
  win,
  type IConfig,
  type IExternalPicgoConfig,
  type IImgInfo,
  type IPicGo,
  type IPicGoPlugin,
  type IPicgoDb,
  type IPluginConfig,
}
