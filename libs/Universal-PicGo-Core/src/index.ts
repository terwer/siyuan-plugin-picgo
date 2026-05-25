import { UniversalPicGo } from "./core/UniversalPicGo"
import { ExternalPicgo } from "./core/ExternalPicgo"
import ConfigDb from "./db/config"
import PluginLoaderDb from "./db/pluginLoder"
import ExternalPicgoConfigDb from "./db/externalPicGo"
import { picgoEventBus } from "./utils/picgoEventBus"
import { currentWin, hasNodeEnv, parentWin, win } from "universal-picgo-store"
import { IBusEvent, PicgoTypeEnum } from "./utils/enums"
import {
  IConfig,
  IExternalPicgoConfig,
  IImgInfo,
  IPicBedType,
  IPicGo,
  IPicgoDb,
  IPicGoPlugin,
  IPluginConfig,
  IUniversalPicGoOptions,
  IUploaderConfigItem,
  IUploaderConfigListItem,
} from "./types"
import { calculateMD5, isFileOrBlob, isSiyuanProxyAvailable } from "./utils/common"
import { deepMerge, getByPath, setByPath, unsetByPath } from "./utils/pathObject"
import { isElectronRuntime, isPicGoPluginPackageName, isThirdPartyPluginRuntimeAvailable } from "./utils/pluginRuntime"
import { UniversalPicGoHeadlessManager, createPicGoHeadlessManager } from "./headless"

export { UniversalPicGo, ExternalPicgo, picgoEventBus }
export { UniversalPicGoHeadlessManager, createPicGoHeadlessManager }
export { ConfigDb, PluginLoaderDb, ExternalPicgoConfigDb }
export { PicgoTypeEnum, IBusEvent }
export { isFileOrBlob, calculateMD5, isSiyuanProxyAvailable }
export { deepMerge, getByPath, setByPath, unsetByPath }
export { isElectronRuntime, isPicGoPluginPackageName, isThirdPartyPluginRuntimeAvailable }
export { win, currentWin, parentWin, hasNodeEnv }
export {
  type IPicGo,
  type IImgInfo,
  type IPicgoDb,
  type IConfig,
  type IExternalPicgoConfig,
  type IPicBedType,
  type IUploaderConfigItem,
  type IUploaderConfigListItem,
  type IPluginConfig,
  type IPicGoPlugin,
  type IUniversalPicGoOptions,
}
export {
  BUILT_IN_UPLOADER_IDS,
  PICGO_HEADLESS_ERROR_CODES,
  PicGoHeadlessError,
  auditBuiltInUploaderSchemas,
  getPicGoUploaderSchema,
  isBuiltInUploaderId,
  listPicGoUploaders,
  type BuiltInUploaderId,
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
} from "./headless"
