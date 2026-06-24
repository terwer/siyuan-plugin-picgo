import type { IConfig, IImgInfo, IPicGo, IUniversalPicGoOptions } from "../types"

export const PICGO_HEADLESS_ERROR_CODES = {
  UNKNOWN_UPLOADER: "UNKNOWN_UPLOADER",
  SCHEMA_UNAVAILABLE: "SCHEMA_UNAVAILABLE",
  UNSUPPORTED_SCHEMA_FIELD: "UNSUPPORTED_SCHEMA_FIELD",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_TYPE: "INVALID_FIELD_TYPE",
  INVALID_FIELD_CHOICE: "INVALID_FIELD_CHOICE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
} as const

export type PicGoHeadlessErrorCode =
  (typeof PICGO_HEADLESS_ERROR_CODES)[keyof typeof PICGO_HEADLESS_ERROR_CODES]

export type PicGoUploaderSchemaFieldType = "input" | "password" | "confirm" | "list"

export interface PicGoUploaderSchemaChoice {
  label: string
  value: string
}

export interface PicGoUploaderListItem {
  id: string
  name: string
  builtin: boolean
  schemaAvailable: boolean
}

export interface PicGoUploaderSchemaField {
  name: string
  type: PicGoUploaderSchemaFieldType
  label?: string
  alias?: string
  message?: string
  required: boolean
  default?: unknown
  valuePath: string
  sensitive: boolean
  choices?: PicGoUploaderSchemaChoice[]
}

export interface PicGoUploaderConfigSchema {
  id: string
  name: string
  builtin: boolean
  fields: PicGoUploaderSchemaField[]
}

export interface PicGoValidationFieldError {
  code: PicGoHeadlessErrorCode
  uploaderId: string
  field?: string
  message: string
}

export interface PicGoValidationResult {
  ok: boolean
  uploaderId: string
  errors: PicGoValidationFieldError[]
}

export interface PicGoUploaderSchemaAuditResult {
  ok: boolean
  errors: PicGoValidationFieldError[]
}

export interface PicGoHeadlessManagerOptions extends IUniversalPicGoOptions {
  /**
   * Reuse an already initialized PicGo context. When provided, path options are
   * ignored and no new UniversalPicGo instance is created.
   */
  picgo?: IPicGo
}

export interface PicGoHeadlessSaveUploaderConfigOptions {
  /**
   * Also make this uploader the PicGo current uploader after a successful save.
   */
  setCurrent?: boolean
  /**
   * Validate with the public schema before persisting. Defaults to true.
   */
  validate?: boolean
  /**
   * Documented raw escape hatch for advanced callers. When true, validation is
   * skipped but the write is still scoped to the target uploader section.
   */
  unsafeRaw?: boolean
}

export interface IPicGoHeadlessManager {
  getContext(): IPicGo
  getConfig(): Promise<IConfig>
  getCurrentUploader(): Promise<string>
  setCurrentUploader(uploaderId: string): Promise<PicGoValidationResult>
  listUploaders(): PicGoUploaderListItem[]
  getUploaderSchema(uploaderId: string): PicGoUploaderConfigSchema
  getUploaderConfig<T extends Record<string, unknown> = Record<string, unknown>>(uploaderId: string): Promise<T>
  validateUploaderConfig(uploaderId: string, config: Record<string, unknown>): PicGoValidationResult
  saveUploaderConfig(
    uploaderId: string,
    config: Record<string, unknown>,
    options?: PicGoHeadlessSaveUploaderConfigOptions
  ): Promise<PicGoValidationResult>
  auditUploaderSchemas(): PicGoUploaderSchemaAuditResult
  upload(input?: any[]): Promise<IImgInfo[]>
}

export interface PicGoHeadlessErrorInput {
  code: PicGoHeadlessErrorCode
  message: string
  uploaderId?: string
  field?: string
  errors?: PicGoValidationFieldError[]
  cause?: unknown
}

export class PicGoHeadlessError extends Error {
  public readonly code: PicGoHeadlessErrorCode
  public readonly uploaderId?: string
  public readonly field?: string
  public readonly errors?: PicGoValidationFieldError[]
  public readonly cause?: unknown

  constructor(input: PicGoHeadlessErrorInput) {
    super(input.message)
    this.name = "PicGoHeadlessError"
    this.code = input.code
    this.uploaderId = input.uploaderId
    this.field = input.field
    this.errors = input.errors
    this.cause = input.cause
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      uploaderId: this.uploaderId,
      field: this.field,
      errors: this.errors,
    }
  }
}
