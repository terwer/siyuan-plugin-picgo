import type { IPicGo, IPluginConfig } from "../types"
import {
  PICGO_HEADLESS_ERROR_CODES,
  type PicGoUploaderConfigSchema,
  type PicGoUploaderListItem,
  type PicGoUploaderSchemaAuditResult,
  type PicGoUploaderSchemaChoice,
  type PicGoUploaderSchemaField,
  type PicGoUploaderSchemaFieldType,
  type PicGoValidationFieldError,
} from "./types"

const SUPPORTED_SCHEMA_FIELD_TYPES: PicGoUploaderSchemaFieldType[] = ["input", "password", "confirm", "list"]

export const BUILT_IN_UPLOADER_IDS = [
  "github",
  "gitlab",
  "aliyun",
  "tcyun",
  "qiniu",
  "upyun",
  "smms",
  "imgur",
  "awss3",
  "lsky",
] as const

export type BuiltInUploaderId = (typeof BUILT_IN_UPLOADER_IDS)[number]

export const isBuiltInUploaderId = (uploaderId: string): uploaderId is BuiltInUploaderId => {
  return (BUILT_IN_UPLOADER_IDS as readonly string[]).includes(uploaderId)
}

export const listPicGoUploaders = (ctx: IPicGo): PicGoUploaderListItem[] => {
  return ctx.helper.uploader.getIdList().map((id) => {
    const uploader = ctx.helper.uploader.get(id)
    return {
      id,
      name: normalizeDisplayText(uploader?.name, id),
      builtin: isBuiltInUploaderId(id),
      schemaAvailable: typeof uploader?.config === "function",
    }
  })
}

export const getPicGoUploaderSchema = (ctx: IPicGo, uploaderId: string): PicGoUploaderConfigSchema | undefined => {
  const uploader = ctx.helper.uploader.get(uploaderId)
  if (!uploader || typeof uploader.config !== "function") {
    return undefined
  }

  return {
    id: uploaderId,
    name: normalizeDisplayText(uploader.name, uploaderId),
    builtin: isBuiltInUploaderId(uploaderId),
    fields: uploader.config(ctx).map((field) => normalizePluginConfigField(uploaderId, field)),
  }
}

export const auditBuiltInUploaderSchemas = (ctx: IPicGo): PicGoUploaderSchemaAuditResult => {
  const errors: PicGoValidationFieldError[] = []
  const registeredIds = ctx.helper.uploader.getIdList()

  BUILT_IN_UPLOADER_IDS.forEach((uploaderId) => {
    const uploader = ctx.helper.uploader.get(uploaderId)
    if (!registeredIds.includes(uploaderId) || !uploader) {
      errors.push({
        code: PICGO_HEADLESS_ERROR_CODES.UNKNOWN_UPLOADER,
        uploaderId,
        message: `Built-in uploader "${uploaderId}" is not registered`,
      })
      return
    }

    if (typeof uploader.config !== "function") {
      errors.push({
        code: PICGO_HEADLESS_ERROR_CODES.SCHEMA_UNAVAILABLE,
        uploaderId,
        message: `Built-in uploader "${uploaderId}" does not expose a serializable config schema`,
      })
      return
    }

    const fields = uploader.config(ctx)
    fields.forEach((field) => {
      if (!SUPPORTED_SCHEMA_FIELD_TYPES.includes(field.type as PicGoUploaderSchemaFieldType)) {
        errors.push({
          code: PICGO_HEADLESS_ERROR_CODES.UNSUPPORTED_SCHEMA_FIELD,
          uploaderId,
          field: field.name,
          message: `Unsupported schema field type "${field.type}" for ${uploaderId}.${field.name}`,
        })
      }
    })
  })

  return {
    ok: errors.length === 0,
    errors,
  }
}

const normalizePluginConfigField = (uploaderId: string, field: IPluginConfig): PicGoUploaderSchemaField => {
  const type = normalizeFieldType(field.type)
  const alias = normalizeOptionalText((field as any).alias)
  const message = normalizeOptionalText((field as any).message)
  const label = normalizeOptionalText((field as any).label) ?? alias ?? field.name

  const normalized: PicGoUploaderSchemaField = {
    name: field.name,
    type,
    label,
    alias,
    message,
    required: Boolean(field.required),
    default: cloneSerializable(field.default),
    valuePath: `picBed.${uploaderId}.${field.name}`,
    sensitive: isSensitiveField(field.name, type),
  }

  const choices = normalizeChoices((field as any).choices)
  if (choices.length > 0) {
    normalized.choices = choices
  }

  return normalized
}

const normalizeFieldType = (type: string): PicGoUploaderSchemaFieldType => {
  if (SUPPORTED_SCHEMA_FIELD_TYPES.includes(type as PicGoUploaderSchemaFieldType)) {
    return type as PicGoUploaderSchemaFieldType
  }
  return "input"
}

const normalizeChoices = (choices: unknown): PicGoUploaderSchemaChoice[] => {
  if (!Array.isArray(choices)) {
    return []
  }

  return choices
    .map((choice) => {
      if (typeof choice === "string" || typeof choice === "number" || typeof choice === "boolean") {
        const value = String(choice)
        return { label: value, value }
      }
      if (choice && typeof choice === "object") {
        const value = String((choice as any).value ?? (choice as any).name ?? (choice as any).label ?? "")
        if (!value) {
          return undefined
        }
        return {
          label: String((choice as any).label ?? (choice as any).name ?? value),
          value,
        }
      }
      return undefined
    })
    .filter((choice): choice is PicGoUploaderSchemaChoice => Boolean(choice))
}

const isSensitiveField = (name: string, type: PicGoUploaderSchemaFieldType): boolean => {
  return type === "password" || /(?:token|secret|password)/i.test(name)
}

const normalizeDisplayText = (value: unknown, fallback: string): string => {
  const normalized = normalizeOptionalText(value)
  return normalized ?? fallback
}

const normalizeOptionalText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined
  }
  return value.trim().length > 0 ? value : undefined
}

const cloneSerializable = <T>(value: T): T => {
  if (typeof value === "undefined") {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}
