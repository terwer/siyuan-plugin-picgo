import { describe, expect, it } from "vitest"
import {
  isPicgoMainGeneratedDefault,
  isExternalPicgoGeneratedDefault,
  isSiyuanConnectionGeneratedDefault,
  isLskyStateGeneratedDefault,
  classifyDomainDefaults,
} from "./DefaultRecognition"
import type { ConfigDomain } from "./UnifiedConfigTypes"

describe("DefaultRecognition", () => {
  describe("isPicgoMainGeneratedDefault", () => {
    it("returns true for ConfigDb.initialValue defaults only", () => {
      const defaults = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: {
          waitTimeout: 2,
          retryTimes: 5,
          autoUpload: true,
          replaceLink: true,
          txtImageSwitch: false,
        },
      }
      expect(isPicgoMainGeneratedDefault(defaults as any)).toBe(true)
    })

    it("returns false when uploader is not smms", () => {
      const cfg = {
        picBed: { uploader: "github", current: "github" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(isPicgoMainGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when there are extra root keys", () => {
      const cfg = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
        debug: true, // extra key
      }
      expect(isPicgoMainGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when picgoPlugins is non-empty", () => {
      const cfg = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: { "plugin-foo": true },
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(isPicgoMainGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when siyuan behavior differs from defaults", () => {
      const cfg = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: false, replaceLink: true, txtImageSwitch: false },
      }
      expect(isPicgoMainGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when picBed has extra keys (real uploader config)", () => {
      const cfg = {
        picBed: { uploader: "smms", current: "smms", smms: { token: "abc" } },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(isPicgoMainGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false for null/undefined", () => {
      expect(isPicgoMainGeneratedDefault(null)).toBe(false)
      expect(isPicgoMainGeneratedDefault(undefined)).toBe(false)
    })
  })

  describe("isExternalPicgoGeneratedDefault", () => {
    it("returns true for default config with empty PicList values", () => {
      const defaults = {
        useBundledPicgo: true,
        picgoType: "bundled",
        extPicgoApiUrl: "http://127.0.0.1:36677",
        picListApiUrl: "",
        picListApiKey: "",
      }
      expect(isExternalPicgoGeneratedDefault(defaults as any)).toBe(true)
    })

    it("treats legacy uppercase Bundled default as generated default", () => {
      const defaults = {
        useBundledPicgo: true,
        picgoType: "Bundled",
        extPicgoApiUrl: "http://127.0.0.1:36677",
        picListApiUrl: "",
        picListApiKey: "",
      }
      expect(isExternalPicgoGeneratedDefault(defaults as any)).toBe(true)
    })

    it("returns false when picListApiUrl is non-empty (user data)", () => {
      const cfg = {
        useBundledPicgo: true,
        picListApiUrl: "https://my-piclist.example.com/upload",
        picListApiKey: "",
      }
      expect(isExternalPicgoGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when picListApiKey is non-empty (user data)", () => {
      const cfg = {
        useBundledPicgo: true,
        picListApiUrl: "",
        picListApiKey: "secret-key",
      }
      expect(isExternalPicgoGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when useBundledPicgo differs from default", () => {
      const cfg = {
        useBundledPicgo: false,
        picListApiUrl: "",
        picListApiKey: "",
      }
      expect(isExternalPicgoGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false when external config has unknown user fields", () => {
      const cfg = {
        useBundledPicgo: true,
        picgoType: "bundled",
        extPicgoApiUrl: "http://127.0.0.1:36677",
        picListApiUrl: "",
        picListApiKey: "",
        customRouteLabel: "my-route",
      }
      expect(isExternalPicgoGeneratedDefault(cfg as any)).toBe(false)
    })

    it("returns false for null/undefined", () => {
      expect(isExternalPicgoGeneratedDefault(null)).toBe(false)
      expect(isExternalPicgoGeneratedDefault(undefined)).toBe(false)
    })
  })

  describe("isSiyuanConnectionGeneratedDefault", () => {
    it("returns true for default connection config", () => {
      const defaults = { apiUrl: "http://127.0.0.1:6806", password: "" }
      expect(isSiyuanConnectionGeneratedDefault(defaults)).toBe(true)
    })

    it("returns false when apiUrl differs", () => {
      const cfg = { apiUrl: "https://remote.example.com", password: "" }
      expect(isSiyuanConnectionGeneratedDefault(cfg)).toBe(false)
    })

    it("returns false when password is non-empty (user data)", () => {
      const cfg = { apiUrl: "http://127.0.0.1:6806", password: "secret" }
      expect(isSiyuanConnectionGeneratedDefault(cfg)).toBe(false)
    })

    it("returns false when cookie is present (user data)", () => {
      const cfg = { apiUrl: "http://127.0.0.1:6806", password: "", cookie: "session=abc" }
      expect(isSiyuanConnectionGeneratedDefault(cfg)).toBe(false)
    })

    it("returns false for null/undefined", () => {
      expect(isSiyuanConnectionGeneratedDefault(null)).toBe(false)
      expect(isSiyuanConnectionGeneratedDefault(undefined)).toBe(false)
    })
  })

  describe("isLskyStateGeneratedDefault", () => {
    it("returns true for empty/undefined token", () => {
      expect(isLskyStateGeneratedDefault("")).toBe(true)
      expect(isLskyStateGeneratedDefault(null)).toBe(true)
      expect(isLskyStateGeneratedDefault(undefined)).toBe(true)
    })

    it("returns false for non-empty token (user data)", () => {
      expect(isLskyStateGeneratedDefault("abc123")).toBe(false)
    })
  })

  describe("classifyDomainDefaults", () => {
    it("returns 'missing' for null/undefined data", () => {
      expect(classifyDomainDefaults("picgoMain", null)).toBe("missing")
      expect(classifyDomainDefaults("externalPicList", undefined)).toBe("missing")
    })

    it("returns 'user-data' for picgoMain with real uploader config", () => {
      const data = {
        picBed: { uploader: "github", current: "github", github: { token: "ghp_xxx" } },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(classifyDomainDefaults("picgoMain", data)).toBe("user-data")
    })

    it("returns 'generated-default' for picgoMain with only defaults", () => {
      const data = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(classifyDomainDefaults("picgoMain", data)).toBe("generated-default")
    })

    it("sub-domains (picgoSettings, siyuanBehavior, pluginValues, uploaderConfig) delegate to picgoMain check", () => {
      const defaults = {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      }
      expect(classifyDomainDefaults("picgoSettings", defaults)).toBe("generated-default")
      expect(classifyDomainDefaults("pluginValues", defaults)).toBe("generated-default")
      expect(classifyDomainDefaults("uploaderConfig", defaults)).toBe("generated-default")
    })

    it("returns 'user-data' for externalPicList with non-empty PicList URL", () => {
      const data = { useBundledPicgo: true, picListApiUrl: "https://example.com", picListApiKey: "" }
      expect(classifyDomainDefaults("externalPicList", data)).toBe("user-data")
    })

    it("returns 'user-data' for siyuanConnection with non-default apiUrl", () => {
      const data = { apiUrl: "https://remote:6806", password: "" }
      expect(classifyDomainDefaults("siyuanConnection", data)).toBe("user-data")
    })

    it("pasteBootstrap is always 'generated-default'", () => {
      expect(classifyDomainDefaults("pasteBootstrap", {})).toBe("generated-default")
      expect(classifyDomainDefaults("pasteBootstrap", { autoUpload: false })).toBe("generated-default")
    })
  })
})
