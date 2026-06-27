/**
 * PicGo 3.0 — Settings Store Pattern Tests
 *
 * Tests the underlying patterns that settings UI stores use:
 * - 4.1: bundled PicGo settings read/write via facade (equivalent to useBundledPicGoSetting)
 * - 4.2: headless API config read/save pattern (equivalent to UniversalPicGoHeadlessManager)
 * - 4.5: SiYuan connection settings with mask (equivalent to useSiyuanSetting)
 *
 * All tests are pure unit tests — no Vue, no SiYuan runtime needed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createUnifiedPicGoConfigFacade } from "./UnifiedConfigFacade"
import { ConfigReadError, MASK_VALUE } from "./UnifiedConfigTypes"
import type { ReadyUnifiedPicGoConfigFacade } from "./UnifiedConfigTypes"

// ── Helpers ──────────────────────────────────────────────────────────

const silentLogger = () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })

function memAdapter(initialData?: Record<string, any>) {
  let data = initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  return {
    mode: "sync" as const,
    read: () => data,
    write: async (d: Record<string, any>) => { data = JSON.parse(JSON.stringify(d)) },
    _getData: () => data,
  }
}

async function createFacade(adapters?: {
  picgo?: ReturnType<typeof memAdapter>
  external?: ReturnType<typeof memAdapter>
  siyuan?: ReturnType<typeof memAdapter>
}): Promise<ReadyUnifiedPicGoConfigFacade> {
  const map: Record<string, any> = {
    "test-picgo.cfg.json": adapters?.picgo ?? memAdapter(),
    "universal-picgo/external-picgo-cfg.json": adapters?.external ?? memAdapter(),
    "siyuan-cfg": adapters?.siyuan ?? memAdapter(),
  }
  return createUnifiedPicGoConfigFacade({
    siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "" },
    paths: { configPath: "test-picgo.cfg.json" },
    getLogger: silentLogger,
    storageAdapterFactory: (path: string) => map[path] ?? memAdapter(),
  })
}

// ═══════════════════════════════════════════════════════════════════════
// 4.1: Settings UI store pattern — bundled PicGo config
// ═══════════════════════════════════════════════════════════════════════
describe("4.1 Settings UI — bundled PicGo config store pattern", () => {
  afterEach(() => window.localStorage.clear())

  it("user opens settings → sees current uploader config", async () => {
    const picgoAdpt = memAdapter({
      picBed: { uploader: "github", current: "github", github: { repo: "u/r", token: "ghp_x", branch: "main", path: "", customUrl: "" } },
      picgoPlugins: {},
      siyuan: { autoUpload: false },
    })
    const facade = await createFacade({ picgo: picgoAdpt })

    // Equivalent to: const cfgRef = getBundledPicGoSetting(ctx)
    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed.uploader).toBe("github")
    expect(cfg.siyuan?.autoUpload).toBe(false)
    expect((cfg.picBed as any).github?.repo).toBe("u/r")
  })

  it("user changes uploader to smms → saves → reads back smms", async () => {
    const facade = await createFacade()

    // Equivalent to: ctx.saveConfig({ "picBed.current": "smms", "picBed.uploader": "smms" })
    await facade.updatePicGoConfig((draft) => {
      draft.picBed = { uploader: "smms", current: "smms", smms: { token: "tok" } } as any
    })
    await facade.flush(["picgoMain"])

    // User refreshes page → reads config again
    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed.uploader).toBe("smms")
    expect((cfg.picBed as any).smms?.token).toBe("tok")
  })

  it("user toggles siyuan.autoUpload → saves → reads back", async () => {
    const facade = await createFacade()

    // User unchecks autoUpload
    await facade.updatePicGoConfig((draft) => {
      draft.siyuan = { ...(draft.siyuan ?? {}), autoUpload: false } as any
    })
    await facade.flush(["siyuanBehavior"])

    const snap = facade.getSnapshot()
    expect(snap.pasteTakeover.autoUpload).toBe(false)
  })

  it("settings save failure surfaced as ConfigFlushError with domain info", async () => {
    // Adapter that fails on write
    const failingWrite = {
      ...memAdapter({ picBed: { uploader: "github", current: "github" } }),
      write: async () => { throw new Error("disk full") },
    }
    const facade = await createFacade({ picgo: failingWrite })

    await facade.updatePicGoConfig((draft) => { draft.debug = true })

    await expect(facade.flush(["picgoMain"])).rejects.toThrow("1 domain")
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 4.1: Settings UI store pattern — external/PicList config
// ═══════════════════════════════════════════════════════════════════════
describe("4.1 Settings UI — external/PicList config store pattern", () => {
  afterEach(() => window.localStorage.clear())

  it("user opens external settings → sees defaults (bundled=true, PicList URL empty)", async () => {
    const facade = await createFacade()

    // Equivalent to: const cfgRef = getExternalPicGoSetting(ctx)
    const cfg = await facade.getExternalPicGoConfig()
    expect(cfg.useBundledPicgo).toBe(true)
    expect(cfg.picListApiUrl).toBe("")
    expect(cfg.picListApiKey).toBe("")
  })

  it("user switches to PicList → saves URL + API key → reads back", async () => {
    const facade = await createFacade()

    // User configures remote PicList
    await facade.updateExternalPicGoConfig((draft) => {
      draft.useBundledPicgo = false
      draft.picgoType = "PicList" as any
      draft.picListApiUrl = "https://piclist.lan/upload"
      draft.picListApiKey = "pk_secret"
    })
    await facade.flush(["externalPicList"])

    const cfg = await facade.getExternalPicGoConfig()
    expect(cfg.useBundledPicgo).toBe(false)
    expect(cfg.picListApiUrl).toBe("https://piclist.lan/upload")
    // Real value for API calls
    expect(cfg.picListApiKey).toBe("pk_secret")
  })

  it("sensitive PicList API key masked in diagnostic/settings summary", async () => {
    const facade = await createFacade()

    await facade.updateExternalPicGoConfig((draft) => {
      draft.picListApiKey = "pk_secret"
    })
    await facade.flush(["externalPicList"])

    // Settings UI shows masked summary
    const snap = facade.getSnapshot()
    const masked = facade.maskSnapshot(snap)
    expect(masked.externalPicgo.picListApiKey).toBe(MASK_VALUE)
    // Real value available for API dispatch
    expect(snap.externalPicgo.picListApiKey).toBe("pk_secret")
  })

  it("async external backend read failure resolves gracefully with defaults instead of crashing", async () => {
    // Simulate async backend (Kernel adapter mode="async")
    // that initially has no data (remote not loaded yet)
    let remoteData: Record<string, any> | null = null  // null = not loaded
    const asyncAdpt = {
      mode: "async" as const,
      read: async () => {
        if (remoteData === null) throw new Error("remote not loaded yet")
        return remoteData
      },
      write: async (d: Record<string, any>) => { remoteData = d },
    }

    const facade = await createUnifiedPicGoConfigFacade({
      siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "" },
      paths: { configPath: "test-picgo.cfg.json" },
      getLogger: silentLogger,
      storageAdapterFactory: (path: string) => {
        if (path.includes("external-picgo-cfg")) return asyncAdpt
        return memAdapter()
      },
    })
    
    // Facade resolves successfully — no ConfigReadError thrown
    expect(facade).toBeDefined()
    // The adapter was never written to because the read failed
    expect(remoteData).toBeNull()
  })

  it("existing external user config NOT overwritten by defaults (ensureReady regression)", async () => {
    // Simulate: external-picgo-cfg.json already has user data
    const extAdpt = memAdapter({
      useBundledPicgo: false,
      picgoType: "PicList",
      picListApiUrl: "https://production-piclist.example.com",
      picListApiKey: "prod-key",
    })
    const facade = await createFacade({ external: extAdpt })

    const cfg = await facade.getExternalPicGoConfig()
    // User data MUST be preserved
    expect(cfg.useBundledPicgo).toBe(false)
    expect(cfg.picListApiUrl).toBe("https://production-piclist.example.com")
    expect(cfg.picListApiKey).toBe("prod-key")
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 4.2: Headless API pattern
// ═══════════════════════════════════════════════════════════════════════
describe("4.2 Headless API — config read/save/setUploader pattern", () => {
  afterEach(() => window.localStorage.clear())

  it("headless consumer reads current config", async () => {
    const picgoAdpt = memAdapter({
      picBed: { uploader: "qiniu", current: "qiniu" },
    })
    const facade = await createFacade({ picgo: picgoAdpt })

    // Equivalent to: manager.getConfig()
    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed.uploader).toBe("qiniu")
  })

  it("headless consumer sets current uploader", async () => {
    const facade = await createFacade()

    // Equivalent to: manager.setCurrentUploader("github")
    await facade.updatePicGoConfig((draft) => {
      draft.picBed = {
        ...draft.picBed,
        current: "github",
        uploader: "github",
        github: { repo: "u/r", token: "ghp_x", branch: "main", path: "", customUrl: "" },
      } as any
    })
    await facade.flush(["picgoMain"])

    const cfg = await facade.getPicGoConfig()
    expect(cfg.picBed.current).toBe("github")
    expect(cfg.picBed.uploader).toBe("github")
  })

  it("headless consumer saves uploader config without touching plugins or other uploaders", async () => {
    const picgoAdpt = memAdapter({
      picBed: { uploader: "smms", current: "smms", smms: { token: "old" } },
      picgoPlugins: { "plugin-x": true },
    })
    const facade = await createFacade({ picgo: picgoAdpt })

    // Save only github uploader config
    await facade.updatePicGoConfig((draft) => {
      draft.picBed = {
        ...draft.picBed,
        current: "github",
        uploader: "github",
        github: { repo: "u/r", token: "ghp_x", branch: "main", path: "", customUrl: "" },
      } as any
    })
    await facade.flush(["uploaderConfig"])

    const cfg = await facade.getPicGoConfig()
    // smms config preserved (unchanged uploader)
    expect((cfg.picBed as any).smms?.token).toBe("old")
    // github config added
    expect((cfg.picBed as any).github?.repo).toBe("u/r")
    // plugins untouched
    expect(cfg.picgoPlugins?.["plugin-x"]).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 4.5: SiYuan connection settings with mask
// ═══════════════════════════════════════════════════════════════════════
describe("4.5 SiYuan connection config — facade-backed with mask", () => {
  afterEach(() => window.localStorage.clear())

  it("reads siyuan connection config from siyuan-cfg owner file", async () => {
    const siyuanAdpt = memAdapter({
      apiUrl: "https://remote:6806",
      password: "secret123",
      home: "/home/siyuan",
    })
    const facade = await createFacade({ siyuan: siyuanAdpt })

    const cfg = await facade.getSiyuanConnectionConfig()
    expect(cfg.apiUrl).toBe("https://remote:6806")
    expect(cfg.password).toBe("secret123")
    expect(cfg.home).toBe("/home/siyuan")
  })

  it("user updates connection → saves to siyuan-cfg owner file", async () => {
    const facade = await createFacade()

    await facade.updateSiyuanConnectionConfig((draft) => {
      draft.apiUrl = "https://new-host:6806"
      draft.password = "new-pass"
    })
    await facade.flush(["siyuanConnection"])

    const cfg = await facade.getSiyuanConnectionConfig()
    expect(cfg.apiUrl).toBe("https://new-host:6806")
    expect(cfg.password).toBe("new-pass")
  })

  it("password and cookie masked in snapshot (safe for diagnostics)", async () => {
    const facade = await createFacade()

    await facade.updateSiyuanConnectionConfig((draft) => {
      draft.password = "secret-pass"
      draft.cookie = "session=xyz123"
    })
    await facade.flush(["siyuanConnection"])

    const snap = facade.getSnapshot()
    const masked = facade.maskSnapshot(snap)

    // Masked in diagnostic output
    expect(masked.siyuanConnection.password).toBe(MASK_VALUE)
    expect(masked.siyuanConnection.cookie).toBe(MASK_VALUE)
    // Non-sensitive fields unchanged
    expect(masked.siyuanConnection.apiUrl).toBe(snap.siyuanConnection.apiUrl)
    // Original values preserved for API calls
    expect(snap.siyuanConnection.password).toBe("secret-pass")
  })

  it("masked values NEVER written back to owner file", async () => {
    const siyuanAdpt = memAdapter()
    const facade = await createFacade({ siyuan: siyuanAdpt })

    await facade.updateSiyuanConnectionConfig((draft) => {
      draft.password = "real-password"
    })
    await facade.flush(["siyuanConnection"])

    // Check what was actually written to the adapter
    const written = siyuanAdpt._getData()
    expect(written.password).toBe("real-password") // Real value persisted
    expect(written.password).not.toBe(MASK_VALUE)   // Never mask in persistence
  })
})
