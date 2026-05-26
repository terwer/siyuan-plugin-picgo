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
  PicGoHeadlessError,
  PICGO_HEADLESS_ERROR_CODES,
  PluginLoaderDb,
  UniversalPicGoHeadlessManager,
  calculateMD5,
  createPicGoHeadlessManager,
  isSiyuanProxyAvailable,
  win,
  type IPicGoHeadlessManager,
  type PicGoHeadlessErrorCode,
  type PicGoHeadlessErrorInput,
  type PicGoHeadlessManagerOptions,
  type PicGoHeadlessSaveUploaderConfigOptions,
  type PicGoUploaderConfigSchema,
  type PicGoUploaderListItem,
  type PicGoUploaderSchemaAuditResult,
  type PicGoUploaderSchemaChoice,
  type PicGoUploaderSchemaField,
  type PicGoUploaderSchemaFieldType,
  type PicGoValidationFieldError,
  type PicGoValidationResult,
} from "universal-picgo"
import { SiyuanConfig as SiyuanPicgoConfig } from "zhi-siyuan-api"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./lib/constants"
import { ImageItem } from "./lib/models/ImageItem"
import { ParsedImage } from "./lib/models/ParsedImage"
import { ImageParser } from "./lib/parser/ImageParser"
import { PicgoHelper, PicgoHelperEvents } from "./lib/picgoHelper"
import {
  SiyuanPicGoHeadlessManager,
  createSiyuanPicGoHeadlessManager,
} from "./lib/SiyuanPicGoHeadlessManager"
import {
  getDefaultLocalPicGoDir,
  getSiyuanWorkspaceDir,
  getWorkspacePicGoConfigPath,
  resolveSiyuanPicGoPaths,
  toUniversalPicGoOptions,
} from "./lib/siyuanPicgoPaths"
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
  PicGoHeadlessError,
  PluginLoaderDb,
  PICGO_HEADLESS_ERROR_CODES,
  SIYUAN_PICGO_FILE_MAP_KEY,
  SiyuanPicGo,
  SiyuanPicGoHeadlessManager,
  SiyuanPicgoConfig,
  SiyuanPicgoPostApi,
  UniversalPicGoHeadlessManager,
  calculateMD5,
  copyToClipboardInBrowser,
  createPicGoHeadlessManager,
  createSiyuanPicGoHeadlessManager,
  generateUniqueName,
  handleConfigWithFunction,
  handleStreamlinePluginName,
  getDefaultLocalPicGoDir,
  getSiyuanWorkspaceDir,
  getWorkspacePicGoConfigPath,
  isSiyuanProxyAvailable,
  replaceImageLink,
  resolveSiyuanPicGoPaths,
  retrieveImageFromClipboardAsBlob,
  toUniversalPicGoOptions,
  win,
  type IConfig,
  type IExternalPicgoConfig,
  type IImgInfo,
  type IPicGo,
  type IPicGoPlugin,
  type IPicgoDb,
  type IPicGoHeadlessManager,
  type IPluginConfig,
  type PicGoHeadlessErrorCode,
  type PicGoHeadlessErrorInput,
  type PicGoHeadlessManagerOptions,
  type PicGoHeadlessSaveUploaderConfigOptions,
  type PicGoUploaderConfigSchema,
  type PicGoUploaderListItem,
  type PicGoUploaderSchemaAuditResult,
  type PicGoUploaderSchemaChoice,
  type PicGoUploaderSchemaField,
  type PicGoUploaderSchemaFieldType,
  type PicGoValidationFieldError,
  type PicGoValidationResult,
}

export type {
  SharedMigrationState,
  SiyuanPicGoMigrationSnapshot,
  SiyuanPicGoMigrationStatus,
} from "./lib/siyuanPicgoMigrationState"
export type {
  SiyuanPicGoInstanceOptions,
  SiyuanPicGoPathOverrides,
  SiyuanPicGoPaths,
} from "./lib/siyuanPicgoPaths"
export type { SiyuanConfigLike } from "./lib/siyuanConfigLike"
export type { ISiyuanPicGoHeadlessManager } from "./lib/SiyuanPicGoHeadlessManager"
