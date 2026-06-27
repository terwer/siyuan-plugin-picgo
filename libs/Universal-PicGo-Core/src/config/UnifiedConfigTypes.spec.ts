import { describe, expect, it } from "vitest"
import {
  ALL_CONFIG_DOMAINS,
  OWNER_FILE_MAP,
  ConfigNotReadyError,
  ConfigFlushError,
  MASK_VALUE,
  SENSITIVE_FIELD_PATTERNS,
  INITIAL_MIGRATION_STATE,
  KERNEL_MAIN_CONFIG_PATH,
  KERNEL_EXTERNAL_CONFIG_PATH,
  KERNEL_SIYUAN_CONNECTION_PATH,
  MAIN_CONFIG_LOGICAL_KEY,
  EXTERNAL_CONFIG_LOGICAL_KEY,
  SIYUAN_CONNECTION_LOGICAL_KEY,
  type ConfigDomain,
  type UnifiedConfigMigrationState,
} from "./UnifiedConfigTypes"

describe("ConfigDomain constants", () => {
  it("ALL_CONFIG_DOMAINS contains exactly 9 domains", () => {
    expect(ALL_CONFIG_DOMAINS).toHaveLength(9)
  })

  it("every ConfigDomain maps to an owner file", () => {
    for (const domain of ALL_CONFIG_DOMAINS) {
      expect(OWNER_FILE_MAP[domain]).toBeDefined()
      expect(typeof OWNER_FILE_MAP[domain]).toBe("string")
    }
  })

  it("picgoMain, picgoSettings, siyuanBehavior, pluginValues, uploaderConfig, lskyState, pasteBootstrap share picgo.cfg.json", () => {
    const sharedDomains: ConfigDomain[] = [
      "picgoMain", "picgoSettings", "siyuanBehavior",
      "pluginValues", "uploaderConfig", "lskyState", "pasteBootstrap",
    ]
    for (const d of sharedDomains) {
      expect(OWNER_FILE_MAP[d]).toBe("picgo.cfg.json")
    }
  })

  it("externalPicList maps to external-picgo-cfg.json", () => {
    expect(OWNER_FILE_MAP.externalPicList).toBe("external-picgo-cfg.json")
  })

  it("siyuanConnection maps to siyuan-cfg", () => {
    expect(OWNER_FILE_MAP.siyuanConnection).toBe("siyuan-cfg")
  })

  it("only 3 unique owner files exist", () => {
    const unique = new Set(Object.values(OWNER_FILE_MAP))
    expect(unique.size).toBe(3)
    expect(unique.has("picgo.cfg.json")).toBe(true)
    expect(unique.has("external-picgo-cfg.json")).toBe(true)
    expect(unique.has("siyuan-cfg")).toBe(true)
  })
})

describe("Kernel path constants", () => {
  it("KERNEL_MAIN_CONFIG_PATH is correct", () => {
    expect(KERNEL_MAIN_CONFIG_PATH).toBe("/data/storage/syp/picgo/picgo.cfg.json")
  })

  it("KERNEL_EXTERNAL_CONFIG_PATH is correct", () => {
    expect(KERNEL_EXTERNAL_CONFIG_PATH).toBe("/data/storage/syp/picgo/external-picgo-cfg.json")
  })

  it("KERNEL_SIYUAN_CONNECTION_PATH is correct", () => {
    expect(KERNEL_SIYUAN_CONNECTION_PATH).toBe("/data/storage/syp/siyuan-cfg.json")
  })
})

describe("Logical key constants", () => {
  it("MAIN_CONFIG_LOGICAL_KEY is correct", () => {
    expect(MAIN_CONFIG_LOGICAL_KEY).toBe("universal-picgo/picgo.cfg.json")
  })

  it("EXTERNAL_CONFIG_LOGICAL_KEY is correct", () => {
    expect(EXTERNAL_CONFIG_LOGICAL_KEY).toBe("universal-picgo/external-picgo-cfg.json")
  })

  it("SIYUAN_CONNECTION_LOGICAL_KEY is correct", () => {
    expect(SIYUAN_CONNECTION_LOGICAL_KEY).toBe("siyuan-cfg")
  })
})

describe("ConfigNotReadyError", () => {
  it("has the correct name", () => {
    const err = new ConfigNotReadyError()
    expect(err.name).toBe("ConfigNotReadyError")
    expect(err).toBeInstanceOf(Error)
  })

  it("accepts a custom message", () => {
    const err = new ConfigNotReadyError("custom message")
    expect(err.message).toBe("custom message")
  })

  it("has a useful default message", () => {
    const err = new ConfigNotReadyError()
    expect(err.message).toContain("not ready")
  })
})

describe("ConfigFlushError", () => {
  it("has the correct name", () => {
    const err = new ConfigFlushError([])
    expect(err.name).toBe("ConfigFlushError")
    expect(err).toBeInstanceOf(Error)
  })

  it("stores failure details", () => {
    const failures = [
      { domain: "picgoMain" as ConfigDomain, ownerFile: "picgo.cfg.json", error: "write failed" },
      { domain: "externalPicList" as ConfigDomain, ownerFile: "external-picgo-cfg.json", error: "disk full" },
    ]
    const err = new ConfigFlushError(failures)
    expect(err.failures).toEqual(failures)
    expect(err.failures).toHaveLength(2)
  })

  it("message includes domain count", () => {
    const failures = [
      { domain: "siyuanConnection" as ConfigDomain, ownerFile: "siyuan-cfg", error: "timeout" },
    ]
    const err = new ConfigFlushError(failures)
    expect(err.message).toContain("1 domain")
  })
})

describe("SENSITIVE_FIELD_PATTERNS", () => {
  it("detects password as sensitive", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("password"))).toBe(true)
  })

  it("detects token as sensitive", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("token"))).toBe(true)
  })

  it("detects cookie as sensitive", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("cookie"))).toBe(true)
  })

  it("detects picListApiKey as sensitive", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("picListApiKey"))).toBe(true)
  })

  it("detects secretKey / accessKey variants", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("secretKey"))).toBe(true)
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("accessKeyId"))).toBe(true)
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("accessKeySecret"))).toBe(true)
  })

  it("does NOT flag non-sensitive fields", () => {
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("server"))).toBe(false)
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("apiUrl"))).toBe(false)
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("useBundledPicgo"))).toBe(false)
    expect(SENSITIVE_FIELD_PATTERNS.some((p) => p.test("picgoType"))).toBe(false)
  })

  it("MASK_VALUE is ******", () => {
    expect(MASK_VALUE).toBe("******")
  })
})

describe("INITIAL_MIGRATION_STATE", () => {
  it("has correct version marker", () => {
    expect(INITIAL_MIGRATION_STATE.version).toBe("v3.0-unified-async-config-source")
  })

  it("starts as not-started", () => {
    expect(INITIAL_MIGRATION_STATE.status).toBe("not-started")
  })

  it("has 0 attempts", () => {
    expect(INITIAL_MIGRATION_STATE.attempts).toBe(0)
  })

  it("has all 9 domains in not-started state", () => {
    const state: UnifiedConfigMigrationState = INITIAL_MIGRATION_STATE
    expect(Object.keys(state.domains)).toHaveLength(9)
    for (const d of ALL_CONFIG_DOMAINS) {
      expect(state.domains[d]).toBeDefined()
      expect(state.domains[d].status).toBe("not-started")
      expect(state.domains[d].importedSources).toEqual([])
    }
  })
})
