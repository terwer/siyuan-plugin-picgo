import { describe, expect, it } from "vitest"
import { maskSensitiveFields, maskSnapshot, maskIfSensitive, isSensitiveField } from "./MaskUtils"
import { type UnifiedConfigSnapshot } from "./UnifiedConfigTypes"

describe("MaskUtils", () => {
  describe("isSensitiveField", () => {
    it("returns true for password", () => {
      expect(isSensitiveField("password")).toBe(true)
    })

    it("returns true for token", () => {
      expect(isSensitiveField("token")).toBe(true)
    })

    it("returns true for cookie", () => {
      expect(isSensitiveField("cookie")).toBe(true)
    })

    it("returns true for picListApiKey", () => {
      expect(isSensitiveField("picListApiKey")).toBe(true)
    })

    it("returns true for accessKeyId", () => {
      expect(isSensitiveField("accessKeyId")).toBe(true)
    })

    it("returns true for secretAccessKey", () => {
      expect(isSensitiveField("secretAccessKey")).toBe(true)
    })

    it("returns false for non-sensitive fields", () => {
      expect(isSensitiveField("apiUrl")).toBe(false)
      expect(isSensitiveField("useBundledPicgo")).toBe(false)
      expect(isSensitiveField("picgoType")).toBe(false)
      expect(isSensitiveField("autoUpload")).toBe(false)
    })
  })

  describe("maskIfSensitive", () => {
    it("masks a sensitive string value", () => {
      expect(maskIfSensitive("my-secret-token", "token")).toBe("******")
    })

    it("does not mask a non-sensitive string value", () => {
      expect(maskIfSensitive("http://127.0.0.1:6806", "apiUrl")).toBe("http://127.0.0.1:6806")
    })

    it("returns undefined for undefined input", () => {
      expect(maskIfSensitive(undefined, "password")).toBeUndefined()
    })

    it("returns empty string for empty string input", () => {
      expect(maskIfSensitive("", "password")).toBe("")
    })
  })

  describe("maskSensitiveFields", () => {
    it("masks password and cookie in flat object", () => {
      const input = { apiUrl: "http://localhost", password: "secret123", cookie: "session=abc" }
      const result = maskSensitiveFields(input)
      expect(result.apiUrl).toBe("http://localhost")
      expect(result.password).toBe("******")
      expect(result.cookie).toBe("******")
    })

    it("masks nested sensitive fields", () => {
      const input = {
        picBed: {
          lsky: { server: "https://lsky.example.com", password: "mypass", token: "abc123" },
        },
      }
      const result = maskSensitiveFields(input)
      expect(result.picBed.lsky.server).toBe("https://lsky.example.com")
      expect(result.picBed.lsky.password).toBe("******")
      expect(result.picBed.lsky.token).toBe("******")
    })

    it("masks picListApiKey in external config", () => {
      const input = {
        useBundledPicgo: true,
        picListApiUrl: "https://piclist.example.com",
        picListApiKey: "secret-key-123",
      }
      const result = maskSensitiveFields(input)
      expect(result.useBundledPicgo).toBe(true)
      expect(result.picListApiUrl).toBe("https://piclist.example.com")
      expect(result.picListApiKey).toBe("******")
    })

    it("does NOT mutate the original object", () => {
      const input = { password: "secret123", apiUrl: "http://example.com" }
      const result = maskSensitiveFields(input)
      expect(result.password).toBe("******")
      // Original must be unchanged
      expect(input.password).toBe("secret123")
      expect(input.apiUrl).toBe("http://example.com")
    })

    it("handles arrays of objects", () => {
      const input = [
        { name: "config1", token: "abc" },
        { name: "config2", password: "xyz" },
      ]
      const result = maskSensitiveFields(input)
      expect(result).toHaveLength(2)
      expect(result[0].token).toBe("******")
      expect(result[1].password).toBe("******")
      expect(result[0].name).toBe("config1")
      expect(result[1].name).toBe("config2")
    })

    it("handles null and undefined", () => {
      expect(maskSensitiveFields(null)).toBeNull()
      expect(maskSensitiveFields(undefined)).toBeUndefined()
    })

    it("handles empty object", () => {
      const result = maskSensitiveFields({})
      expect(result).toEqual({})
    })

    it("handles primitive values", () => {
      expect(maskSensitiveFields(42)).toBe(42)
      expect(maskSensitiveFields("hello")).toBe("hello")
    })

    it("does NOT mask empty strings even if field is sensitive", () => {
      const input = { password: "", token: "" }
      const result = maskSensitiveFields(input)
      expect(result.password).toBe("")
      expect(result.token).toBe("")
    })
  })

  describe("maskSnapshot", () => {
    it("masks all sensitive fields in a full snapshot", () => {
      const snapshot: UnifiedConfigSnapshot = {
        picgo: {
          picBed: {
            uploader: "lsky",
            lsky: { server: "https://lsky.example.com", password: "pass123", token: "tok456" },
          },
          picgoPlugins: {},
          siyuan: { autoUpload: true, replaceLink: true, txtImageSwitch: false },
        } as any,
        externalPicgo: {
          useBundledPicgo: false,
          picListApiUrl: "https://piclist.example.com",
          picListApiKey: "top-secret-key",
        },
        siyuanConnection: {
          apiUrl: "http://127.0.0.1:6806",
          password: "admin123",
          cookie: "session=xyz",
        },
        pasteTakeover: { autoUpload: true, allowPicAndText: false, replaceLink: true },
        migration: {
          version: "v3.0-unified-async-config-source",
          status: "done",
          attempts: 1,
          domains: {
            picgoMain: { status: "imported", importedSources: [] },
            picgoSettings: { status: "imported", importedSources: [] },
            siyuanBehavior: { status: "imported", importedSources: [] },
            siyuanConnection: { status: "imported", importedSources: [] },
            externalPicList: { status: "imported", importedSources: [] },
            pluginValues: { status: "imported", importedSources: [] },
            uploaderConfig: { status: "imported", importedSources: [] },
            lskyState: { status: "imported", importedSources: [] },
            pasteBootstrap: { status: "imported", importedSources: [] },
          },
        },
      }

      const masked = maskSnapshot(snapshot)

      // Sensitive fields masked
      expect((masked.picgo.picBed as any).lsky.password).toBe("******")
      expect((masked.picgo.picBed as any).lsky.token).toBe("******")
      expect(masked.externalPicgo.picListApiKey).toBe("******")
      expect(masked.siyuanConnection.password).toBe("******")
      expect(masked.siyuanConnection.cookie).toBe("******")

      // Non-sensitive fields unchanged
      expect(masked.siyuanConnection.apiUrl).toBe("http://127.0.0.1:6806")
      expect(masked.externalPicgo.picListApiUrl).toBe("https://piclist.example.com")
      expect(masked.pasteTakeover.autoUpload).toBe(true)

      // Original snapshot unchanged
      expect(snapshot.siyuanConnection.password).toBe("admin123")
    })
  })
})
