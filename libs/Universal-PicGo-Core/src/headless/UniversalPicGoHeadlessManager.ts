import { UniversalPicGo } from "../core/UniversalPicGo"
import type { IConfig, IImgInfo, IPicGo } from "../types"
import {
  auditBuiltInUploaderSchemas,
  getPicGoUploaderSchema,
  listPicGoUploaders,
} from "./uploaderSchemas"
import {
  PICGO_HEADLESS_ERROR_CODES,
  PicGoHeadlessError,
  type IPicGoHeadlessManager,
  type PicGoHeadlessManagerOptions,
  type PicGoHeadlessSaveUploaderConfigOptions,
  type PicGoUploaderConfigSchema,
  type PicGoUploaderListItem,
  type PicGoUploaderSchemaAuditResult,
  type PicGoUploaderSchemaField,
  type PicGoValidationFieldError,
  type PicGoValidationResult,
} from "./types"

const DEFAULT_UPLOADER_ID = "smms"

class UniversalPicGoHeadlessManager implements IPicGoHeadlessManager {
  private readonly ctx: IPicGo

  constructor(options: PicGoHeadlessManagerOptions = {}) {
    const { picgo, ...picgoOptions } = options
    this.ctx = picgo ?? new UniversalPicGo(picgoOptions)
  }

  getContext(): IPicGo {
    return this.ctx
  }

  getConfig(): IConfig {
    return cloneSerializable(this.ctx.getConfig<IConfig>())
  }

  getCurrentUploader(): string {
    const configuredUploader =
      this.ctx.getConfig<string>("picBed.uploader") || this.ctx.getConfig<string>("picBed.current")
    if (configuredUploader && this.hasUploader(configuredUploader)) {
      return configuredUploader
    }
    return DEFAULT_UPLOADER_ID
  }

  setCurrentUploader(uploaderId: string): PicGoValidationResult {
    if (!this.hasUploader(uploaderId)) {
      return this.unknownUploaderResult(uploaderId)
    }

    this.ctx.saveConfig({
      "picBed.current": uploaderId,
      "picBed.uploader": uploaderId,
    })
    return okResult(uploaderId)
  }

  listUploaders(): PicGoUploaderListItem[] {
    return listPicGoUploaders(this.ctx)
  }

  getUploaderSchema(uploaderId: string): PicGoUploaderConfigSchema {
    if (!this.hasUploader(uploaderId)) {
      throw this.unknownUploaderError(uploaderId)
    }

    const schema = getPicGoUploaderSchema(this.ctx, uploaderId)
    if (!schema) {
      throw new PicGoHeadlessError({
        code: PICGO_HEADLESS_ERROR_CODES.SCHEMA_UNAVAILABLE,
        uploaderId,
        message: `Uploader "${uploaderId}" does not expose a headless config schema`,
      })
    }
    return schema
  }

  getUploaderConfig<T extends Record<string, unknown> = Record<string, unknown>>(uploaderId: string): T {
    if (!this.hasUploader(uploaderId)) {
      throw this.unknownUploaderError(uploaderId)
    }
    return cloneSerializable((this.ctx.getConfig<T>(`picBed.${uploaderId}`) ?? {}) as T)
  }

  validateUploaderConfig(uploaderId: string, config: Record<string, unknown>): PicGoValidationResult {
    if (!this.hasUploader(uploaderId)) {
      return this.unknownUploaderResult(uploaderId)
    }

    const schema = this.getUploaderSchema(uploaderId)
    const normalizedConfig = this.withSchemaDefaults(schema, config)
    const errors: PicGoValidationFieldError[] = []

    schema.fields.forEach((field) => {
      const value = normalizedConfig[field.name]
      if (field.required && isEmptyValue(value)) {
        errors.push({
          code: PICGO_HEADLESS_ERROR_CODES.MISSING_REQUIRED_FIELD,
          uploaderId,
          field: field.name,
          message: `Missing required field "${field.name}" for uploader "${uploaderId}"`,
        })
        return
      }

      if (!isEmptyValue(value)) {
        const typeError = validateFieldType(uploaderId, field, value)
        if (typeError) {
          errors.push(typeError)
          return
        }

        const choiceError = validateFieldChoice(uploaderId, field, value)
        if (choiceError) {
          errors.push(choiceError)
        }
      }
    })

    return {
      ok: errors.length === 0,
      uploaderId,
      errors,
    }
  }

  saveUploaderConfig(
    uploaderId: string,
    config: Record<string, unknown>,
    options: PicGoHeadlessSaveUploaderConfigOptions = {}
  ): PicGoValidationResult {
    if (!this.hasUploader(uploaderId)) {
      return this.unknownUploaderResult(uploaderId)
    }

    const schema = this.getUploaderSchema(uploaderId)
    const currentConfig = this.getUploaderConfig(uploaderId)
    const normalizedConfig = options.unsafeRaw
      ? { ...currentConfig, ...cloneSerializable(config) }
      : this.withSchemaDefaults(schema, { ...currentConfig, ...config })

    if (options.validate !== false && !options.unsafeRaw) {
      const validation = this.validateUploaderConfig(uploaderId, normalizedConfig)
      if (!validation.ok) {
        return validation
      }
    }

    this.ctx.saveConfig({
      [`picBed.${uploaderId}`]: normalizedConfig,
    })

    if (options.setCurrent) {
      this.ctx.saveConfig({
        "picBed.current": uploaderId,
        "picBed.uploader": uploaderId,
      })
    }

    return okResult(uploaderId)
  }

  auditUploaderSchemas(): PicGoUploaderSchemaAuditResult {
    return auditBuiltInUploaderSchemas(this.ctx)
  }

  async upload(input?: any[]): Promise<IImgInfo[]> {
    const uploaderId = this.getCurrentUploader()
    const validation = this.validateUploaderConfig(uploaderId, this.getUploaderConfig(uploaderId))
    if (!validation.ok) {
      throw new PicGoHeadlessError({
        code: PICGO_HEADLESS_ERROR_CODES.VALIDATION_FAILED,
        uploaderId,
        message: `Uploader "${uploaderId}" config is invalid`,
        errors: validation.errors,
      })
    }

    try {
      const result = await this.ctx.upload(input)
      if (result instanceof Error) {
        throw result
      }
      return result
    } catch (e) {
      throw new PicGoHeadlessError({
        code: PICGO_HEADLESS_ERROR_CODES.UPLOAD_FAILED,
        uploaderId,
        message: normalizeErrorMessage(e),
        cause: e,
      })
    }
  }

  private hasUploader(uploaderId: string): boolean {
    return Boolean(uploaderId && this.ctx.helper.uploader.get(uploaderId))
  }

  private withSchemaDefaults(
    schema: PicGoUploaderConfigSchema,
    config: Record<string, unknown>
  ): Record<string, unknown> {
    const normalizedConfig = cloneSerializable(config)
    schema.fields.forEach((field) => {
      if (typeof normalizedConfig[field.name] === "undefined" && typeof field.default !== "undefined") {
        normalizedConfig[field.name] = cloneSerializable(field.default)
      }
    })
    return normalizedConfig
  }

  private unknownUploaderResult(uploaderId: string): PicGoValidationResult {
    return {
      ok: false,
      uploaderId,
      errors: [
        {
          code: PICGO_HEADLESS_ERROR_CODES.UNKNOWN_UPLOADER,
          uploaderId,
          message: `Unknown uploader "${uploaderId}"`,
        },
      ],
    }
  }

  private unknownUploaderError(uploaderId: string): PicGoHeadlessError {
    return new PicGoHeadlessError({
      code: PICGO_HEADLESS_ERROR_CODES.UNKNOWN_UPLOADER,
      uploaderId,
      message: `Unknown uploader "${uploaderId}"`,
    })
  }
}

const okResult = (uploaderId: string): PicGoValidationResult => ({
  ok: true,
  uploaderId,
  errors: [],
})

const validateFieldType = (
  uploaderId: string,
  field: PicGoUploaderSchemaField,
  value: unknown
): PicGoValidationFieldError | undefined => {
  if (field.type === "confirm" && typeof value !== "boolean") {
    return {
      code: PICGO_HEADLESS_ERROR_CODES.INVALID_FIELD_TYPE,
      uploaderId,
      field: field.name,
      message: `Field "${field.name}" for uploader "${uploaderId}" must be a boolean`,
    }
  }

  if ((field.type === "input" || field.type === "password" || field.type === "list") && typeof value === "object") {
    return {
      code: PICGO_HEADLESS_ERROR_CODES.INVALID_FIELD_TYPE,
      uploaderId,
      field: field.name,
      message: `Field "${field.name}" for uploader "${uploaderId}" must be a scalar value`,
    }
  }

  return undefined
}

const validateFieldChoice = (
  uploaderId: string,
  field: PicGoUploaderSchemaField,
  value: unknown
): PicGoValidationFieldError | undefined => {
  if (field.type !== "list" || !field.choices || field.choices.length === 0) {
    return undefined
  }

  const allowedValues = field.choices.map((choice) => choice.value)
  if (!allowedValues.includes(String(value))) {
    return {
      code: PICGO_HEADLESS_ERROR_CODES.INVALID_FIELD_CHOICE,
      uploaderId,
      field: field.name,
      message: `Field "${field.name}" for uploader "${uploaderId}" must be one of: ${allowedValues.join(", ")}`,
    }
  }

  return undefined
}

const isEmptyValue = (value: unknown): boolean => {
  return value === undefined || value === null || (typeof value === "string" && value.trim().length === 0)
}

const cloneSerializable = <T>(value: T): T => {
  if (typeof value === "undefined") {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

const createPicGoHeadlessManager = (options?: PicGoHeadlessManagerOptions): UniversalPicGoHeadlessManager => {
  return new UniversalPicGoHeadlessManager(options)
}

export { UniversalPicGoHeadlessManager, createPicGoHeadlessManager }
