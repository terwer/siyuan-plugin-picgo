import { describe, expect, it } from "vitest"
import { DEFAULT_MAX_UPLOAD_COUNT, MAX_UPLOAD_COUNT_LIMIT, normalizeMaxUploadCount } from "./uploadLimit"

describe("normalizeMaxUploadCount", () => {
  it("falls back to the default for missing or invalid values", () => {
    expect(normalizeMaxUploadCount(undefined)).toBe(DEFAULT_MAX_UPLOAD_COUNT)
    expect(normalizeMaxUploadCount(null)).toBe(DEFAULT_MAX_UPLOAD_COUNT)
    expect(normalizeMaxUploadCount("not-a-number")).toBe(DEFAULT_MAX_UPLOAD_COUNT)
    expect(normalizeMaxUploadCount(0)).toBe(DEFAULT_MAX_UPLOAD_COUNT)
    expect(normalizeMaxUploadCount(-3)).toBe(DEFAULT_MAX_UPLOAD_COUNT)
  })

  it("accepts configured values and floors fractions", () => {
    expect(normalizeMaxUploadCount(44)).toBe(44)
    expect(normalizeMaxUploadCount("50")).toBe(50)
    expect(normalizeMaxUploadCount(44.9)).toBe(44)
  })

  it("clamps values above the supported limit", () => {
    expect(normalizeMaxUploadCount(MAX_UPLOAD_COUNT_LIMIT + 1)).toBe(MAX_UPLOAD_COUNT_LIMIT)
  })
})
