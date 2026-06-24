/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { MASK_VALUE, SENSITIVE_FIELD_PATTERNS, type UnifiedConfigSnapshot } from "./UnifiedConfigTypes"

/**
 * Mask utilities for sensitive configuration fields.
 *
 * Sensitive fields (passwords, tokens, keys, cookies) MUST be rendered
 * as "******" in logs, errors, migration reports, diagnostics, and any
 * non-persistence output. Real values MUST only exist in owner files
 * and runtime memory needed for API calls.
 *
 * @module MaskUtils
 * @since 3.0.0
 */

/**
 * Determine whether a field name matches any sensitive field pattern.
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName))
}

/**
 * Deep-clone and mask all sensitive fields in an object tree.
 *
 * Recursively walks the object. When a key matches a sensitive field
 * pattern and the value is a non-empty string, replaces it with MASK_VALUE.
 * Arrays are traversed element by element.
 *
 * IMPORTANT: The mask is applied to a deep CLONE — the original object
 * is NEVER mutated. Masked values MUST NOT be written back to owner files.
 *
 * @param obj - Any JSON-serializable value.
 * @returns Deep-cloned copy with sensitive string values replaced by "******".
 */
export function maskSensitiveFields<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveFields(item)) as unknown as T
  }

  if (typeof obj === "object") {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (isSensitiveField(key) && typeof value === "string" && value.length > 0) {
        result[key] = MASK_VALUE
      } else if (typeof value === "object" && value !== null) {
        result[key] = maskSensitiveFields(value)
      } else {
        result[key] = value
      }
    }
    return result as T
  }

  return obj
}

/**
 * Mask sensitive fields in a unified config snapshot.
 *
 * Returns a deep-cloned copy with all passwords, tokens, cookies, and
 * API keys replaced by "******". Safe for logging, diagnostics, and
 * audit evidence.
 *
 * @param snapshot - The raw unified config snapshot.
 * @returns Deep-cloned snapshot with all sensitive fields masked.
 */
export function maskSnapshot(snapshot: UnifiedConfigSnapshot): UnifiedConfigSnapshot {
  return maskSensitiveFields(snapshot)
}

/**
 * Mask a single config value if it is a string that matches a known
 * sensitive field name context.
 *
 * @param value - The value string (or undefined).
 * @param fieldName - The field name for sensitivity detection.
 * @returns The original value if field is not sensitive or value is empty; "******" otherwise.
 */
export function maskIfSensitive(value: string | undefined, fieldName: string): string | undefined {
  if (value === undefined || value === "") {
    return value
  }
  return isSensitiveField(fieldName) ? MASK_VALUE : value
}
