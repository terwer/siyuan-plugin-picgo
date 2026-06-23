/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * PicGo 3.0 Unified Configuration barrel export.
 *
 * @module config
 * @since 3.0.0
 */

export { createUnifiedPicGoConfigFacade } from "./UnifiedConfigFacade"
export { runV3Migration, retryV3Migration, type V3MigrationOptions } from "./V3MigrationService"

export {
  // Types
  type ConfigDomain,
  type ReadyUnifiedPicGoConfigFacade,
  type UnifiedConfigSnapshot,
  type UnifiedConfigMigrationState,
  type UnifiedPicGoConfigFacadeOptions,
  type UnifiedConfigPaths,
  type PasteTakeoverSnapshot,
  type SiyuanConfigLike,
  type MigrationDomainState,
  type MigrationDomainStatus,
  type MigrationGlobalStatus,
  type ConfigFlushFailure,

  // Constants
  ALL_CONFIG_DOMAINS,
  OWNER_FILE_MAP,
  INITIAL_MIGRATION_STATE,
  MASK_VALUE,
  SENSITIVE_FIELD_PATTERNS,
  MAIN_CONFIG_LOGICAL_KEY,
  EXTERNAL_CONFIG_LOGICAL_KEY,
  SIYUAN_CONNECTION_LOGICAL_KEY,
  KERNEL_MAIN_CONFIG_PATH,
  KERNEL_EXTERNAL_CONFIG_PATH,
  KERNEL_SIYUAN_CONNECTION_PATH,
  PICGO_MAIN_DEFAULTS,
  EXTERNAL_PICGO_DEFAULTS,
  SIYUAN_CONNECTION_DEFAULTS,
  DOMAIN_DEFAULTS,

  // Errors
  ConfigNotReadyError,
  ConfigFlushError,
  ConfigReadError,
} from "./UnifiedConfigTypes"

export { maskSnapshot, maskSensitiveFields, maskIfSensitive, isSensitiveField } from "./MaskUtils"

export {
  isPicgoMainGeneratedDefault,
  isExternalPicgoGeneratedDefault,
  isSiyuanConnectionGeneratedDefault,
  classifyDomainDefaults,
  type DefaultClassification,
} from "./DefaultRecognition"
