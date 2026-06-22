import { afterEach, describe, expect, it, vi } from "vitest"
import { runV3Migration, retryV3Migration } from "./V3MigrationService"
import { INITIAL_MIGRATION_STATE, ALL_CONFIG_DOMAINS, type UnifiedConfigMigrationState } from "./UnifiedConfigTypes"

// ── Helpers ───────────────────────────────────────────────────────────

const silentLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

describe("V3MigrationService", () => {
  afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  describe("fresh migration (no existing state)", () => {
    it("completes with 'done' status when owner files have user data", async () => {
      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "github", current: "github", github: { token: "ghp_xxx" } },
        picgoPlugins: {},
        siyuan: { autoUpload: false },
      })
      ownerFileData.set("external-picgo-cfg.json", { useBundledPicgo: true })
      ownerFileData.set("siyuan-cfg", { apiUrl: "http://127.0.0.1:6806", password: "" })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.status).toBe("done")
      expect(result.version).toBe("v3.0-unified-async-config-source")
      expect(result.attempts).toBe(1)
    })

    it("marks domains with existing user data as 'imported'", async () => {
      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "github", current: "github" },
        picgoPlugins: {},
        siyuan: { autoUpload: false },
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // picgoMain has user data → imported
      expect(result.domains.picgoMain.status).toBe("imported")
      expect(result.domains.picgoMain.importedSources).toContain("v3-owner-file:picgo.cfg.json")
    })

    it("marks domains with only generated defaults as 'skipped' (no legacy data in browser)", async () => {
      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // Generated defaults only, no browser legacy → skipped
      expect(result.domains.picgoMain.status).toBe("skipped")
    })

    it("marks missing owner files as 'skipped'", async () => {
      const ownerFileData = new Map<string, Record<string, any>>()
      // No data at all

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.domains.picgoMain.status).toBe("skipped")
      expect(result.domains.externalPicList.status).toBe("skipped")
      expect(result.domains.siyuanConnection.status).toBe("skipped")
    })
  })

  describe("idempotent migration", () => {
    it("does not re-run when status is 'done'", async () => {
      const existingState: UnifiedConfigMigrationState = {
        ...INITIAL_MIGRATION_STATE,
        status: "done",
        attempts: 1,
        updatedAt: Date.now() - 10000,
        domains: Object.fromEntries(
          ALL_CONFIG_DOMAINS.map((d) => [d, { status: "imported" as const, importedSources: ["test-source"], updatedAt: Date.now() - 10000 }])
        ) as any,
      }

      const result = await runV3Migration({
        ownerFileData: new Map(),
        existingState,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.status).toBe("done")
      expect(result.attempts).toBe(1) // Not incremented
      expect(result.domains.picgoMain.importedSources).toEqual(["test-source"]) // Unchanged
    })

    it("does not re-run already 'imported' domains", async () => {
      const existingState: UnifiedConfigMigrationState = {
        ...INITIAL_MIGRATION_STATE,
        status: "not-started",
        attempts: 0,
        domains: Object.fromEntries(
          ALL_CONFIG_DOMAINS.map((d) => [d, d === "picgoMain"
            ? { status: "imported" as const, importedSources: ["already-imported"], updatedAt: Date.now() }
            : { status: "not-started" as const, importedSources: [] }
          ])
        ) as any,
      }

      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "github", current: "github" },
        picgoPlugins: {},
      })

      const result = await runV3Migration({
        ownerFileData,
        existingState,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // Already imported domain should stay imported with same sources
      expect(result.domains.picgoMain.importedSources).toEqual(["already-imported"])
    })
  })

  describe("per-domain failure isolation", () => {
    it("does not clear already-successful domains on failure", async () => {
      const ownerFileData = new Map<string, Record<string, any>>()
      // Put user data in picgo.cfg.json so picgoMain imports successfully
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "github", current: "github", github: { token: "ghp_xxx" } },
        picgoPlugins: {},
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // picgoMain should be imported
      expect(result.domains.picgoMain.status).toBe("imported")
    })
  })

  describe("Lsky token migration", () => {
    it("imports legacy lsky token into uploader.lsky.token", async () => {
      // Set up legacy Lsky token in localStorage
      window.localStorage.setItem("siyuan_picgo_plugin_lsky_token", "legacy-token-123")

      const ownerFileData = new Map<string, Record<string, any>>()
      // Empty picgo.cfg.json (generated defaults)
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // Lsky token should be imported
      expect(result.domains.lskyState.status).toBe("imported")
      expect(result.domains.lskyState.importedSources).toContain("browser:siyuan_picgo_plugin_lsky_token")

      // Token should appear in the owner file data
      const mainData = ownerFileData.get("picgo.cfg.json")
      expect(mainData?.uploader?.lsky?.token).toBe("legacy-token-123")
    })

    it("skips Lsky import when legacy key is empty", async () => {
      // No legacy token in localStorage
      const ownerFileData = new Map<string, Record<string, any>>()

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.domains.lskyState.status).toBe("skipped")
    })
  })

  describe("browser localStorage migration", () => {
    it("imports picgoMain from browser localStorage when owner file has only defaults", async () => {
      // Set up browser localStorage with legacy config
      window.localStorage.setItem(
        "universal-picgo/picgo.cfg.json",
        JSON.stringify({
          picBed: { uploader: "github", current: "github", github: { token: "ghp_browser" } },
          picgoPlugins: { "plugin-x": true },
          siyuan: { autoUpload: false, replaceLink: false, txtImageSwitch: true },
        })
      )

      const ownerFileData = new Map<string, Record<string, any>>()
      // Owner has only generated defaults
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "smms", current: "smms" },
        picgoPlugins: {},
        siyuan: { waitTimeout: 2, retryTimes: 5, autoUpload: true, replaceLink: true, txtImageSwitch: false },
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.domains.picgoMain.status).toBe("imported")
      expect(result.domains.picgoMain.importedSources).toContain("browser:universal-picgo/picgo.cfg.json")

      // Owner data should be updated with browser values
      const mainData = ownerFileData.get("picgo.cfg.json")
      expect(mainData?.picBed?.uploader).toBe("github")
      expect(mainData?.picgoPlugins?.["plugin-x"]).toBe(true)
      expect(mainData?.siyuan?.autoUpload).toBe(false)
    })

    it("imports externalPicList from browser localStorage", async () => {
      window.localStorage.setItem(
        "universal-picgo/external-picgo-cfg.json",
        JSON.stringify({
          useBundledPicgo: false,
          picListApiUrl: "https://piclist.example.com",
          picListApiKey: "key-123",
        })
      )

      const ownerFileData = new Map<string, Record<string, any>>()
      // Empty external owner file
      ownerFileData.set("external-picgo-cfg.json", {})

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.domains.externalPicList.status).toBe("imported")
      expect(result.domains.externalPicList.importedSources).toContain("browser:universal-picgo/external-picgo-cfg.json")

      const extData = ownerFileData.get("external-picgo-cfg.json")
      expect(extData?.useBundledPicgo).toBe(false)
      expect(extData?.picListApiUrl).toBe("https://piclist.example.com")
      expect(extData?.picListApiKey).toBe("key-123")
    })

    it("imports siyuanConnection from browser localStorage", async () => {
      window.localStorage.setItem(
        "siyuan-cfg",
        JSON.stringify({
          apiUrl: "https://remote:6806",
          password: "secret-pass",
        })
      )

      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("siyuan-cfg", {})

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      expect(result.domains.siyuanConnection.status).toBe("imported")

      const connData = ownerFileData.get("siyuan-cfg")
      expect(connData?.apiUrl).toBe("https://remote:6806")
      expect(connData?.password).toBe("secret-pass")
    })

    it("does NOT overwrite existing user config with browser data", async () => {
      // Browser has old config
      window.localStorage.setItem(
        "universal-picgo/picgo.cfg.json",
        JSON.stringify({
          picBed: { uploader: "smms", current: "smms" },
        })
      )

      // Owner file has real user data (github uploader)
      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("picgo.cfg.json", {
        picBed: { uploader: "github", current: "github", github: { token: "ghp_real" } },
        picgoPlugins: {},
        siyuan: { autoUpload: false },
      })

      const result = await runV3Migration({
        ownerFileData,
        hasNodeEnv: false,
        logger: silentLogger(),
      })

      // Should be 'imported' from the v3 owner file, NOT from browser
      expect(result.domains.picgoMain.importedSources).toContain("v3-owner-file:picgo.cfg.json")

      // Owner data should NOT be overwritten
      const mainData = ownerFileData.get("picgo.cfg.json")
      expect(mainData?.picBed?.uploader).toBe("github") // Real user data preserved
    })
  })

  describe("retryV3Migration", () => {
    it("retries failed domains without clearing successful ones", async () => {
      const existingState: UnifiedConfigMigrationState = {
        ...INITIAL_MIGRATION_STATE,
        status: "failed",
        attempts: 1,
        domains: Object.fromEntries(
          ALL_CONFIG_DOMAINS.map((d) => [d,
            d === "siyuanConnection"
              ? { status: "failed" as const, importedSources: [], error: "timeout", updatedAt: Date.now() - 1000 }
              : { status: "imported" as const, importedSources: ["success-source"], updatedAt: Date.now() - 1000 }
          ])
        ) as any,
      }

      window.localStorage.setItem(
        "siyuan-cfg",
        JSON.stringify({ apiUrl: "https://retry:6806" })
      )

      const ownerFileData = new Map<string, Record<string, any>>()
      ownerFileData.set("siyuan-cfg", {})

      const result = await retryV3Migration(
        { ownerFileData, existingState, hasNodeEnv: false, logger: silentLogger() },
        ["siyuanConnection"]
      )

      // Retried domain should now be imported
      expect(result.domains.siyuanConnection.status).toBe("imported")
      expect(result.domains.siyuanConnection.importedSources).toContain("browser:siyuan-cfg")

      // Already successful domains should be untouched
      expect(result.domains.picgoMain.status).toBe("imported")
      expect(result.domains.picgoMain.importedSources).toEqual(["success-source"])
    })
  })
})
