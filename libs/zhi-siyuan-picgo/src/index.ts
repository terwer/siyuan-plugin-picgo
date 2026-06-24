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
  PicListUploader,
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
import { SiYuanKernelStorageAdapter } from "./lib/SiYuanKernelStorageAdapter"
import {
  getDefaultLocalPicGoDir,
  getSiyuanWorkspaceDir,
  getWorkspacePicGoConfigPath,
  resolveSiyuanPicGoPaths,
  resolveSiyuanPicGoOwnerFilePath,
  SIYUAN_PICGO_KERNEL_CONFIG_PATH,
  SIYUAN_PICGO_KERNEL_EXTERNAL_PATH,
  SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH,
  SIYUAN_PICGO_MAIN_CONFIG_KEY,
  SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
  SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
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
  PicListUploader,
  PluginLoaderDb,
  PICGO_HEADLESS_ERROR_CODES,
  SIYUAN_PICGO_FILE_MAP_KEY,
  SiYuanKernelStorageAdapter,
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
  resolveSiyuanPicGoOwnerFilePath,
  retrieveImageFromClipboardAsBlob,
  SIYUAN_PICGO_KERNEL_CONFIG_PATH,
  SIYUAN_PICGO_KERNEL_EXTERNAL_PATH,
  SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH,
  SIYUAN_PICGO_MAIN_CONFIG_KEY,
  SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
  SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
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
  SiyuanPicGoMigrationStatus,
} from "./lib/siyuanPicgoMigrationState"
export type {
  ConfigDomain,
  UnifiedConfigMigrationState,
  UnifiedConfigMigrationState as SiyuanPicGoMigrationSnapshot,
} from "universal-picgo"
export type {
  SiyuanPicGoInstanceOptions,
  SiyuanPicGoPathOverrides,
  SiyuanPicGoPaths,
} from "./lib/siyuanPicgoPaths"
export type { SiyuanConfigLike } from "./lib/siyuanConfigLike"
export type { ISiyuanPicGoHeadlessManager } from "./lib/SiyuanPicGoHeadlessManager"
