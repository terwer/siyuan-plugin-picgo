/**
 * PicGo 3.0 Unified Config Facade — Integration Tests
 *
 * User-facing test scenarios that verify the facade works correctly
 * from the caller's perspective — no SiYuan runtime required.
 *
 * Covers tasks.md 6.6, 6.7, 6.8, 6.9 as runnable unit tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createUnifiedPicGoConfigFacade } from "./UnifiedConfigFacade"
import { MASK_VALUE, ConfigFlushError } from "./UnifiedConfigTypes"
import type { ReadyUnifiedPicGoConfigFacade } from "./UnifiedConfigTypes"

// ── Test Adapters ────────────────────────────────────────────────────

/** Simulates localStorage-based adapter (pure browser fallback). */
function localStorageAdapter(dbPath: string) {
  return {
    mode: "sync" as const,
    read: () => {
      try {
        const raw = window.localStorage.getItem(dbPath)
        return raw ? JSON.parse(raw) : {}
      } catch { return {} }
    },
    write: async (data: Record<string, any>) => {
      window.localStorage.setItem(dbPath, JSON.stringify(data))
    },
  }
}

/** Simulates Kernel-backed adapter (separate backend per owner file). */
function kernelAdapter(initialData?: Record<string, any>) {
  let data = initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  return {
    mode: "async" as const,
    read: async () => data,
    write: async (newData: Record<string, any>) => { data = JSON.parse(JSON.stringify(newData)) },
    _getData: () => data,
  }
}

/** Simulates a failing Kernel adapter (unavailable service). */
function failingAdapter() {
  return {
    mode: "async" as const,
    read: async () => { throw new Error("SiYuan kernel API unavailable") },
    write: async () => { throw new Error("SiYuan kernel API unavailable") },
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

const silentLogger = () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })

const baseOptions = (overrides?: Record<string, any>) => ({
  siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "" },
  paths: { configPath: "test-picgo.cfg.json" },
  getLogger: silentLogger,
  ...overrides,
})

// ── Helper to create facade with separate adapters per owner file ─────

async function createFacadeWithAdapters(adapters: {
  picgo?: ReturnType<typeof kernelAdapter>
  external?: ReturnType<typeof kernelAdapter>
  siyuan?: ReturnType<typeof kernelAdapter>
}): Promise<ReadyUnifiedPicGoConfigFacade> {
  const map: Record<string, any> = {
    "test-picgo.cfg.json": adapters.picgo ?? kernelAdapter(),
    "universal-picgo/external-picgo-cfg.json": adapters.external ?? kernelAdapter(),
    "siyuan-cfg": adapters.siyuan ?? kernelAdapter(),
  }
  return createUnifiedPicGoConfigFacade({
    ...baseOptions(),
    storageAdapterFactory: (path: string) => map[path] ?? kernelAdapter(),
  })
}

// ═══════════════════════════════════════════════════════════════════════
// 6.6: User saves config → can read it back from same owner file
// ═══════════════════════════════════════════════════════════════════════
describe("6.6 Facade per-domain routing & persistence", () => {
  afterEach(() => window.localStorage.clear())

  it("user saves picgo config → reads it back correctly", async () => {
    const facade = await createFacadeWithAdapters({})

    // User action: save github uploader config
    await facade.updatePicGoConfig((draft) => {
      draft.picBed = {
        uploader: "github",
        current: "github",
        github: { repo: "user/repo", token: "fake-tok-test", branch: "main", path: "img/", customUrl: "" },
      } as any
    })
    await facade.flush(["picgoMain"])

    // User expectation: config is persisted and readable
    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed.uploader).toBe("github")
    expect((cfg.picBed as any).github?.repo).toBe("user/repo")
  })

  it("user saves external/PicList config → reads it back from external-picgo-cfg.json", async () => {
    const facade = await createFacadeWithAdapters({})

    await facade.updateExternalPicGoConfig((draft) => {
      draft.useBundledPicgo = false
      draft.picListApiUrl = "https://my-piclist.example.com"
      draft.picListApiKey = "secret-123"
    })
    await facade.flush(["externalPicList"])

    const cfg = await facade.getExternalPicGoConfig()
    expect(cfg.useBundledPicgo).toBe(false)
    expect(cfg.picListApiUrl).toBe("https://my-piclist.example.com")
    expect(cfg.picListApiKey).toBe("secret-123")
  })

  it("user saves siyuan connection → reads it back from siyuan-cfg", async () => {
    const siyuanAdpt = kernelAdapter({ apiUrl: "http://127.0.0.1:6806", password: "" })
    const facade = await createFacadeWithAdapters({ siyuan: siyuanAdpt })

    await facade.updateSiyuanConnectionConfig((draft) => {
      draft.apiUrl = "https://remote-host:6806"
      draft.password = "new-password"
    })
    await facade.flush(["siyuanConnection"])

    const cfg = await facade.getSiyuanConnectionConfig()
    expect(cfg.apiUrl).toBe("https://remote-host:6806")
    expect(cfg.password).toBe("new-password")
  })

  it("cross-session: config saved in 'session A' is readable in 'session B'", async () => {
    // Session A: user configures PicGo
    const picgoAdpt = kernelAdapter()
    const extAdpt = kernelAdapter()
    const siyuanAdpt = kernelAdapter()

    const facadeA = await createFacadeWithAdapters({ picgo: picgoAdpt, external: extAdpt, siyuan: siyuanAdpt })
    await facadeA.updatePicGoConfig((d) => { d.debug = true })
    await facadeA.updateExternalPicGoConfig((d) => { d.picListApiUrl = "https://piclist.lan" })
    await facadeA.updateSiyuanConnectionConfig((d) => { d.apiUrl = "https://new-host:6806" })
    await facadeA.flush()

    // Session B: create new facade with same adapters (simulating same workspace)
    const facadeB = await createFacadeWithAdapters({ picgo: picgoAdpt, external: extAdpt, siyuan: siyuanAdpt })

    // User expects: all config from session A is visible
    const picgoCfg = await facadeB.getPicGoConfig()
    const extCfg = await facadeB.getExternalPicGoConfig()
    const siyuanCfg = await facadeB.getSiyuanConnectionConfig()

    expect(picgoCfg.debug).toBe(true)
    expect(extCfg.picListApiUrl).toBe("https://piclist.lan")
    expect(siyuanCfg.apiUrl).toBe("https://new-host:6806")
  })

  it("different domains don't leak into wrong owner files", async () => {
    const picgoAdpt = kernelAdapter()
    const extAdpt = kernelAdapter()

    const facade = await createFacadeWithAdapters({ picgo: picgoAdpt, external: extAdpt })

    // Save to picgo only
    await facade.updatePicGoConfig((d) => { d.debug = true })
    await facade.flush(["picgoMain"])

    // External should NOT have debug flag
    const extCfg = await facade.getExternalPicGoConfig()
    expect((extCfg as any).debug).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 6.7: External/PicList config behavior
// ═══════════════════════════════════════════════════════════════════════
describe("6.7 External/PicList config & error handling", () => {
  afterEach(() => window.localStorage.clear())

  it("external defaults are sensible (PicList URL/API key empty by default)", async () => {
    const facade = await createFacadeWithAdapters({})

    const cfg = await facade.getExternalPicGoConfig()
    expect(cfg.useBundledPicgo).toBe(true)
    expect(cfg.picListApiUrl).toBe("")
    expect(cfg.picListApiKey).toBe("")
  })

  it("user can configure remote PicList URL and API key", async () => {
    const facade = await createFacadeWithAdapters({})

    await facade.updateExternalPicGoConfig((d) => {
      d.useBundledPicgo = false
      d.picListApiUrl = "https://remote-piclist.example.com/upload"
      d.picListApiKey = "pk_abc123"
    })
    await facade.flush(["externalPicList"])

    const cfg = await facade.getExternalPicGoConfig()
    expect(cfg.useBundledPicgo).toBe(false)
    expect(cfg.picListApiUrl).toBe("https://remote-piclist.example.com/upload")
    expect(cfg.picListApiKey).toBe("pk_abc123")
  })

  it("ensureReady() prevents overwriting real external config with defaults", async () => {
    // Simulate: external-picgo-cfg.json already has real user config
    const realUserConfig = {
      useBundledPicgo: false,
      picgoType: "PicList",
      extPicgoApiUrl: "http://192.168.1.100:36677",
      picListApiUrl: "https://real-piclist.example.com",
      picListApiKey: "real-key",
    }
    const extAdpt = kernelAdapter(realUserConfig)
    const facade = await createFacadeWithAdapters({ external: extAdpt })

    const cfg = await facade.getExternalPicGoConfig()
    // Real user data preserved, NOT overwritten by defaults
    expect(cfg.useBundledPicgo).toBe(false)
    expect(cfg.picListApiUrl).toBe("https://real-piclist.example.com")
    expect(cfg.picListApiKey).toBe("real-key")
    // Default extPicgoApiUrl should be PRESERVED (was user-set)
    expect(cfg.extPicgoApiUrl).toBe("http://192.168.1.100:36677")
  })

  it("sensitive PicList API key is masked in snapshot", async () => {
    const facade = await createFacadeWithAdapters({})

    await facade.updateExternalPicGoConfig((d) => {
      d.picListApiKey = "super-secret-key"
    })
    await facade.flush(["externalPicList"])

    const snap = facade.getSnapshot()
    const masked = facade.maskSnapshot(snap)

    // API key should be masked in diagnostic output
    expect(masked.externalPicgo.picListApiKey).toBe(MASK_VALUE)
    // But real value preserved in runtime snapshot (for API calls)
    expect(snap.externalPicgo.picListApiKey).toBe("super-secret-key")
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 6.8: Plugin runtime artifacts NOT treated as user config
// ═══════════════════════════════════════════════════════════════════════
describe("6.8 Plugin runtime artifacts vs user config separation", () => {
  afterEach(() => window.localStorage.clear())

  it("plugin enable/config values ARE in picgo.cfg.json owner file", async () => {
    const facade = await createFacadeWithAdapters({})

    // User enables a plugin and sets its config
    await facade.updatePicGoConfig((d) => {
      d.picgoPlugins = { "plugin-watermark": true }
      ;(d as any)["plugin-watermark"] = { text: "Hello", position: "bottom-right" }
    })
    await facade.flush(["pluginValues"])

    const cfg = await facade.getPicGoConfig()
    expect(cfg.picgoPlugins?.["plugin-watermark"]).toBe(true)
    expect((cfg as any)["plugin-watermark"]?.text).toBe("Hello")
  })

  it("plugin enable values persist across sessions", async () => {
    const picgoAdpt = kernelAdapter()

    const facade1 = await createFacadeWithAdapters({ picgo: picgoAdpt })
    await facade1.updatePicGoConfig((d) => {
      d.picgoPlugins = { "plugin-compress": true }
    })
    await facade1.flush(["pluginValues"])

    // New facade sees the persisted plugin config
    const facade2 = await createFacadeWithAdapters({ picgo: picgoAdpt })
    const cfg = await facade2.getPicGoConfig()
    expect(cfg.picgoPlugins?.["plugin-compress"]).toBe(true)
  })

  it("PC-only paths (pluginBaseDir, zhiNpmPath) are NOT in owner files", async () => {
    // These are passed via UnifiedPicGoConfigFacadeOptions.paths,
    // NOT stored in the owner file data. The facade doesn't write
    // them to picgo.cfg.json.
    const facade = await createFacadeWithAdapters({})

    const cfg = await facade.getPicGoConfig()
    // These paths should never appear as config keys
    expect((cfg as any).pluginBaseDir).toBeUndefined()
    expect((cfg as any).zhiNpmPath).toBeUndefined()
    expect((cfg as any).baseDir).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 6.9: Pure browser fallback with ready/migration/mask rules
// ═══════════════════════════════════════════════════════════════════════
describe("6.9 Pure browser fallback (localStorage adapter)", () => {
  afterEach(() => window.localStorage.clear())

  it("facade works with localStorage adapter (pure browser fallback)", async () => {
    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      storageAdapterFactory: localStorageAdapter,
    })

    // Ready state should work
    const snap = facade.getSnapshot()
    expect(snap.picgo).toBeDefined()
    expect(snap.pasteTakeover.autoUpload).toBe(true)
  })

  it("localStorage fallback: save and read back config", async () => {
    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      storageAdapterFactory: localStorageAdapter,
    })

    await facade.updatePicGoConfig((d) => {
      d.picBed = { uploader: "smms", current: "smms", smms: { token: "tok_ls" } } as any
    })
    await facade.flush(["picgoMain"])

    // Verify it's actually in localStorage
    const raw = window.localStorage.getItem("test-picgo.cfg.json")
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.picBed?.smms?.token).toBe("tok_ls")
  })

  it("localStorage fallback: migration runs and marker is stored", async () => {
    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      storageAdapterFactory: localStorageAdapter,
    })

    const state = await facade.getMigrationState()
    expect(state.version).toBe("v3.0-unified-async-config-source")
    expect(state.status).toBe("done")
  })

  it("localStorage fallback: maskSnapshot works correctly", async () => {
    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "browser-secret" },
      storageAdapterFactory: localStorageAdapter,
    })

    await facade.updateSiyuanConnectionConfig((d) => {
      d.password = "browser-secret"
    })
    await facade.flush(["siyuanConnection"])

    const snap = facade.getSnapshot()
    const masked = facade.maskSnapshot(snap)

    expect(masked.siyuanConnection.password).toBe(MASK_VALUE)
    expect(snap.siyuanConnection.password).toBe("browser-secret")
  })

  it("localStorage fallback: defaults merged when storage is empty", async () => {
    window.localStorage.clear()

    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      storageAdapterFactory: localStorageAdapter,
    })

    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed?.uploader).toBe("smms")
    expect(cfg.siyuan?.autoUpload).toBe(true)
  })

  it("localStorage fallback: existing data NOT overwritten by defaults", async () => {
    // Pre-populate localStorage with user config
    window.localStorage.setItem("test-picgo.cfg.json", JSON.stringify({
      picBed: { uploader: "github", current: "github" },
      picgoPlugins: {},
    }))

    const facade = await createUnifiedPicGoConfigFacade({
      ...baseOptions(),
      storageAdapterFactory: localStorageAdapter,
    })

    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed?.uploader).toBe("github") // User value preserved
  })
})
