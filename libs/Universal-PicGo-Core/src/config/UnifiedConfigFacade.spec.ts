import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createUnifiedPicGoConfigFacade } from "./UnifiedConfigFacade"
import { ConfigReadError, MASK_VALUE } from "./UnifiedConfigTypes"
import type { ReadyUnifiedPicGoConfigFacade } from "./UnifiedConfigTypes"

// ── Test Helpers ──────────────────────────────────────────────────────

/** Create an in-memory adapter that behaves like LocalStorageAdapter. */
function createMemoryAdapter(initialData?: Record<string, any>) {
  let data = initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  return {
    mode: "sync" as const,
    read: vi.fn(() => data),
    write: vi.fn(async (newData: Record<string, any>) => {
      data = JSON.parse(JSON.stringify(newData))
    }),
    _getData: () => data,
  }
}

/** Create a failing adapter (simulates Kernel API unavailable). */
function createFailingAdapter(errorMsg = "kernel API unavailable") {
  return {
    mode: "async" as const,
    storageKind: "siyuan-kernel",
    read: vi.fn(async () => { throw new Error(errorMsg) }),
    write: vi.fn(async () => { throw new Error(errorMsg) }),
  }
}

/** Create an async in-memory adapter whose read side can fail on demand. */
function createAsyncMemoryAdapter(initialData?: Record<string, any>) {
  let data = initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  let failRead = false
  return {
    mode: "async" as const,
    storageKind: "siyuan-kernel",
    read: vi.fn(async () => {
      if (failRead) throw new Error("kernel read timeout")
      return data
    }),
    write: vi.fn(async (newData: Record<string, any>) => {
      data = JSON.parse(JSON.stringify(newData))
    }),
    failNextReads: () => { failRead = true },
    _getData: () => data,
  }
}

const defaultOptions = () => ({
  siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "" },
  paths: { configPath: "test-picgo.cfg.json" },
  isDev: true,
  getLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
})

// ── Tests ─────────────────────────────────────────────────────────────

describe("UnifiedConfigFacade", () => {
  let facade: ReadyUnifiedPicGoConfigFacade
  let mainAdapter: ReturnType<typeof createMemoryAdapter>
  let externalAdapter: ReturnType<typeof createMemoryAdapter>
  let siyuanAdapter: ReturnType<typeof createMemoryAdapter>

  describe("factory creation and ready barrier", () => {
    it("creates and resolves a ready facade", async () => {
      const adapter = createMemoryAdapter()
      const opts = {
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      }
      facade = await createUnifiedPicGoConfigFacade(opts)
      expect(facade).toBeDefined()
      expect(facade.storageMode).toBe("sync")
      expect(typeof facade.instanceKey).toBe("string")
    })

    it("getSnapshot returns all domains with defaults when no data exists", async () => {
      const adapter = createMemoryAdapter()
      const opts = {
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      }
      facade = await createUnifiedPicGoConfigFacade(opts)
      const snapshot = facade.getSnapshot()

      expect(snapshot.picgo).toBeDefined()
      expect(snapshot.externalPicgo).toBeDefined()
      expect(snapshot.siyuanConnection).toBeDefined()
      expect(snapshot.pasteTakeover).toBeDefined()
      expect(snapshot.migration).toBeDefined()
      expect(snapshot.pasteTakeover.autoUpload).toBe(true)
      expect(snapshot.pasteTakeover.allowPicAndText).toBe(false)
      expect(snapshot.pasteTakeover.replaceLink).toBe(true)
    })

    it("migration state is initialized with v3 marker", async () => {
      const adapter = createMemoryAdapter()
      facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      })
      const state = await facade.getMigrationState()
      expect(state.version).toBe("v3.0-unified-async-config-source")
      expect(state.status).toBe("done")
      expect(state.attempts).toBe(1)
    })

    it("fails async owner-file read with ConfigReadError without retrying or writing defaults", async () => {
      const failingAdapter = createFailingAdapter("kernel unavailable")

      await expect(createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: () => failingAdapter,
      })).rejects.toBeInstanceOf(ConfigReadError)

      expect(failingAdapter.read).toHaveBeenCalledTimes(1)
      expect(failingAdapter.write).not.toHaveBeenCalled()
    })

    it("reload fails async owner-file read with ConfigReadError", async () => {
      const asyncAdapter = createAsyncMemoryAdapter()
      const testFacade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: () => asyncAdapter,
      })
      asyncAdapter.read.mockClear()
      asyncAdapter.failNextReads()

      await expect(testFacade.reload()).rejects.toBeInstanceOf(ConfigReadError)
      expect(asyncAdapter.read).toHaveBeenCalledTimes(1)
    })
  })

  describe("per-domain routing (3 unique owner files)", () => {
    beforeEach(async () => {
      mainAdapter = createMemoryAdapter()
      externalAdapter = createMemoryAdapter()
      siyuanAdapter = createMemoryAdapter()

      const adapterMap: Record<string, ReturnType<typeof createMemoryAdapter>> = {
        "test-picgo.cfg.json": mainAdapter,
        "universal-picgo/external-picgo-cfg.json": externalAdapter,
        "siyuan-cfg": siyuanAdapter,
      }

      facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (path: string) => adapterMap[path] ?? createMemoryAdapter(),
      })
    })

    afterEach(() => {
      vi.clearAllMocks()
    })

    it("getPicGoConfig reads from picgo.cfg.json owner", async () => {
      const cfg = await facade.getPicGoConfig()
      expect(cfg).toBeDefined()
      expect(mainAdapter.read).toHaveBeenCalled()
    })

    it("getExternalPicGoConfig reads from external-picgo-cfg.json owner", async () => {
      const cfg = await facade.getExternalPicGoConfig()
      expect(cfg).toBeDefined()
      expect(externalAdapter.read).toHaveBeenCalled()
    })

    it("getSiyuanConnectionConfig reads from siyuan-cfg owner", async () => {
      const cfg = await facade.getSiyuanConnectionConfig()
      expect(cfg).toBeDefined()
      expect(siyuanAdapter.read).toHaveBeenCalled()
    })

    it("updatePicGoConfig writes to picgo.cfg.json owner after flush", async () => {
      await facade.updatePicGoConfig((draft) => {
        draft.picBed = { uploader: "github", current: "github" } as any
      })
      await facade.flush()
      expect(mainAdapter.write).toHaveBeenCalled()
      const writtenData = mainAdapter.write.mock.calls[0]?.[0]
      expect(writtenData?.picBed?.uploader).toBe("github")
    })

    it("updateExternalPicGoConfig writes to external-picgo-cfg.json owner after flush", async () => {
      await facade.updateExternalPicGoConfig((draft) => {
        draft.picListApiUrl = "https://piclist.example.com"
      })
      await facade.flush(["externalPicList"])
      expect(externalAdapter.write).toHaveBeenCalled()
      const writtenData = externalAdapter.write.mock.calls[0]?.[0]
      expect(writtenData?.picListApiUrl).toBe("https://piclist.example.com")
    })

    it("updateSiyuanConnectionConfig writes to siyuan-cfg owner after flush", async () => {
      await facade.updateSiyuanConnectionConfig((draft) => {
        draft.apiUrl = "https://remote:6806"
      })
      await facade.flush(["siyuanConnection"])
      expect(siyuanAdapter.write).toHaveBeenCalled()
      const writtenData = siyuanAdapter.write.mock.calls[0]?.[0]
      expect(writtenData?.apiUrl).toBe("https://remote:6806")
    })

    it("updating one domain does NOT dirty unrelated owners", async () => {
      await facade.updatePicGoConfig((draft) => {
        draft.debug = true
      })
      await facade.flush(["picgoMain"])
      expect(mainAdapter.write).toHaveBeenCalled()
      expect(externalAdapter.write).not.toHaveBeenCalled()
      expect(siyuanAdapter.write).not.toHaveBeenCalled()
    })
  })

  describe("snapshot reflects in-memory state", () => {
    beforeEach(async () => {
      mainAdapter = createMemoryAdapter()
      facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => mainAdapter,
      })
    })

    it("snapshot updates after updatePicGoConfig", async () => {
      await facade.updatePicGoConfig((draft) => {
        draft.debug = true
      })
      const snap = facade.getSnapshot()
      expect(snap.picgo.debug).toBe(true)
    })

    it("pasteTakeover snapshot derives from siyuan config", async () => {
      await facade.updatePicGoConfig((draft) => {
        draft.siyuan = { autoUpload: false, replaceLink: false, txtImageSwitch: true } as any
      })
      const snap = await facade.getPasteTakeoverSnapshot()
      expect(snap.autoUpload).toBe(false)
      expect(snap.replaceLink).toBe(false)
      expect(snap.allowPicAndText).toBe(true)
    })
  })

  describe("maskSnapshot", () => {
    it("masks sensitive fields in the snapshot", async () => {
      const picgoAdapter = createMemoryAdapter({
        picBed: { uploader: "lsky", lsky: { server: "https://lsky.example.com", password: "my-pass", token: "my-token" } },
        picgoPlugins: {},
        siyuan: { autoUpload: true },
      })
      const siyuanAdapter = createMemoryAdapter({
        apiUrl: "http://127.0.0.1:6806",
        password: "admin-pass",
        cookie: "session=abc",
      })

      facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "admin-pass" },
        storageAdapterFactory: (path: string) => {
          if (path.includes("siyuan-cfg") || path === "siyuan-cfg") return siyuanAdapter
          return picgoAdapter
        },
      })
      const snap = facade.getSnapshot()
      const masked = facade.maskSnapshot(snap)

      expect((masked.picgo.picBed as any).lsky.password).toBe(MASK_VALUE)
      expect((masked.picgo.picBed as any).lsky.token).toBe(MASK_VALUE)
      expect(masked.siyuanConnection.password).toBe(MASK_VALUE)
      expect(masked.siyuanConnection.cookie).toBe(MASK_VALUE)
      expect((masked.picgo.picBed as any).lsky.server).toBe("https://lsky.example.com")
      expect(masked.siyuanConnection.apiUrl).toBe("http://127.0.0.1:6806")
    })
  })

  describe("instanceKey uniqueness", () => {
    it("different apiUrl produces different instanceKey", async () => {
      const adapter = createMemoryAdapter()
      const f1 = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        siyuanConfig: { apiUrl: "http://host-a:6806" },
        storageAdapterFactory: (_path: string) => adapter,
      })
      const f2 = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        siyuanConfig: { apiUrl: "http://host-b:6806" },
        storageAdapterFactory: (_path: string) => adapter,
      })
      expect(f1.instanceKey).not.toBe(f2.instanceKey)
    })

    it("same config produces same instanceKey", async () => {
      const adapter = createMemoryAdapter()
      const opts = { ...defaultOptions(), storageAdapterFactory: (_path: string) => adapter }
      const f1 = await createUnifiedPicGoConfigFacade(opts)
      const f2 = await createUnifiedPicGoConfigFacade(opts)
      expect(f1.instanceKey).toBe(f2.instanceKey)
    })
  })

  describe("merge defaults (ready-before-default)", () => {
    let testFacade: ReadyUnifiedPicGoConfigFacade

    it("does NOT overwrite existing user data with defaults", async () => {
      const userData = {
        picBed: { uploader: "github", current: "github", github: { token: "ghp_xxx" } },
        picgoPlugins: {},
        siyuan: { autoUpload: false },
      }
      const adapter = createMemoryAdapter(userData)
      testFacade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      })
      const cfg = await testFacade.getPicGoConfig()
      expect(cfg.picBed.uploader).toBe("github")
      expect(cfg.siyuan?.autoUpload).toBe(false)
    })

    it("fills defaults when owner file is empty", async () => {
      const adapter = createMemoryAdapter({})
      testFacade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      })
      const cfg = await testFacade.getPicGoConfig()
      expect(cfg.picBed?.uploader).toBe("smms")
      expect(cfg.siyuan?.autoUpload).toBe(true)
    })

    it("normalizes legacy uppercase external picgoType generated default", async () => {
      const external = createMemoryAdapter({ useBundledPicgo: true, picgoType: "Bundled" })
      testFacade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (path: string) => path.includes("external-picgo-cfg") ? external : createMemoryAdapter(),
      })
      const cfg = await testFacade.getExternalPicGoConfig()
      expect(cfg.picgoType).toBe("bundled")
      expect(cfg.picListApiUrl).toBe("")
    })
  })

  describe("retryMigration", () => {
    it("returns current migration state", async () => {
      const adapter = createMemoryAdapter()
      facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: (_path: string) => adapter,
      })
      const state = await facade.retryMigration()
      expect(state.version).toBe("v3.0-unified-async-config-source")
    })
  })
})
