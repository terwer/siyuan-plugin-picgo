import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createUnifiedPicGoConfigFacade } from "./UnifiedConfigFacade"
import { ConfigFlushError, ConfigReadError, MASK_VALUE } from "./UnifiedConfigTypes"
import type { ReadyUnifiedPicGoConfigFacade, UnifiedConfigMigrationState } from "./UnifiedConfigTypes"

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

function createDeferredAsyncAdapter(initialData?: Record<string, any>) {
  let data = initialData ? JSON.parse(JSON.stringify(initialData)) : {}
  const writes: Array<{
    payload: Record<string, any>
    resolve: () => void
    reject: (reason?: unknown) => void
    promise: Promise<void>
  }> = []

  return {
    mode: "async" as const,
    storageKind: "test-async",
    read: vi.fn(async () => JSON.parse(JSON.stringify(data))),
    write: vi.fn((newData: Record<string, any>) => {
      const payload = JSON.parse(JSON.stringify(newData))
      let resolve!: () => void
      let reject!: (reason?: unknown) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = () => {
          data = JSON.parse(JSON.stringify(payload))
          res()
        }
        reject = rej
      })
      writes.push({ payload, resolve, reject, promise })
      return promise
    }),
    _writes: writes,
    _getData: () => data,
  }
}

const defaultOptions = () => ({
  siyuanConfig: { apiUrl: "http://127.0.0.1:6806", password: "" },
  paths: { configPath: "test-picgo.cfg.json" },
  isDev: true,
  getLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
})

const makeMigrationState = (
  overrides: Partial<UnifiedConfigMigrationState> = {}
): UnifiedConfigMigrationState => ({
  version: "v3.0-unified-async-config-source",
  status: "failed",
  attempts: 1,
  ...overrides,
  domains: {
    picgoMain: { status: "imported", importedSources: ["v3-owner-file:picgo.cfg.json"] },
    picgoSettings: { status: "not-started", importedSources: [] },
    siyuanBehavior: { status: "not-started", importedSources: [] },
    siyuanConnection: { status: "not-started", importedSources: [] },
    externalPicList: { status: "not-started", importedSources: [] },
    pluginValues: { status: "not-started", importedSources: [] },
    uploaderConfig: { status: "not-started", importedSources: [] },
    lskyState: { status: "not-started", importedSources: [] },
    pasteBootstrap: { status: "not-started", importedSources: [] },
    ...(overrides.domains ?? {}),
  },
})

function createInitializedOwnerData() {
  return {
    main: {
      picBed: { uploader: "smms", current: "smms" },
      picgoPlugins: {},
      siyuan: {
        waitTimeout: 2,
        retryTimes: 5,
        autoUpload: true,
        replaceLink: true,
        txtImageSwitch: false,
        picgoMigration: makeMigrationState({ status: "done", attempts: 1 }),
      },
    },
    external: {
      useBundledPicgo: true,
      picgoType: "bundled",
      extPicgoApiUrl: "http://127.0.0.1:36677",
      picListApiUrl: "",
      picListApiKey: "",
    },
    siyuan: {
      apiUrl: "http://127.0.0.1:6806",
      password: "",
    },
  }
}

async function createDeferredFacade() {
  const initialized = createInitializedOwnerData()
  const mainAdapter = createDeferredAsyncAdapter(initialized.main)
  const externalAdapter = createDeferredAsyncAdapter(initialized.external)
  const siyuanAdapter = createDeferredAsyncAdapter(initialized.siyuan)
  const adapterMap: Record<string, ReturnType<typeof createDeferredAsyncAdapter>> = {
    "test-picgo.cfg.json": mainAdapter,
    "universal-picgo/external-picgo-cfg.json": externalAdapter,
    "siyuan-cfg": siyuanAdapter,
  }
  const facade = await createUnifiedPicGoConfigFacade({
    ...defaultOptions(),
    storageAdapterFactory: (path: string) => adapterMap[path] ?? createDeferredAsyncAdapter({}),
  })
  return { facade, mainAdapter, externalAdapter, siyuanAdapter }
}

async function waitMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

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

    it("handles async owner-file read failure gracefully with defaults instead of crashing", async () => {
      const failingAdapter = createFailingAdapter("kernel unavailable")

      const facade = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        storageAdapterFactory: () => failingAdapter,
      })

      // Facade resolves successfully — no ConfigReadError thrown
      expect(facade).toBeDefined()
      expect(facade.storageMode).toBe("async")
      expect(failingAdapter.read).toHaveBeenCalledTimes(3) // 3 owner files
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

    it("includes storage/workspace/owner identity without leaking sensitive values", async () => {
      const adapter = createMemoryAdapter()
      const secretPassword = "do-not-log-password"
      const secretCookie = "do-not-log-cookie"
      const f = await createUnifiedPicGoConfigFacade({
        ...defaultOptions(),
        siyuanConfig: {
          apiUrl: "http://host-a:6806",
          password: secretPassword,
          cookie: secretCookie,
        },
        paths: {
          configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
          externalConfigPath: "/workspace/data/storage/syp/picgo/external-picgo-cfg.json",
          siyuanConnectionConfigPath: "/workspace/data/storage/syp/siyuan-cfg.json",
          workspaceDir: "/workspace",
          homeDir: "/home/tester/.universal-picgo",
          baseDir: "/home/tester/.universal-picgo",
          pluginBaseDir: "/home/tester/.universal-picgo",
        },
        storageAdapterFactory: (_path: string) => adapter,
      })

      const key = JSON.parse(f.instanceKey)
      expect(key.storage.factory).toBe("custom")
      expect(key.workspace.workspaceDir).toBe("/workspace")
      expect(key.storage.owners["picgo.cfg.json"].logicalKey).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
      expect(key.storage.owners["external-picgo-cfg.json"].logicalKey).toBe("/workspace/data/storage/syp/picgo/external-picgo-cfg.json")
      expect(key.storage.owners["siyuan-cfg"].logicalKey).toBe("/workspace/data/storage/syp/siyuan-cfg.json")
      expect(f.instanceKey).not.toContain(secretPassword)
      expect(f.instanceKey).not.toContain(secretCookie)
      expect(f.instanceKey).not.toContain("picListApiKey")
    })
  })

  describe("merge defaults (ready-before-default)", () => {
    let testFacade: ReadyUnifiedPicGoConfigFacade

    it("does NOT overwrite existing user data with defaults", async () => {
      const userData = {
        picBed: { uploader: "github", current: "github", github: { token: "fake-tok-xxx" } },
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

    // V3 migration is no longer relevant — this test is kept for reference but skipped
    /*
    it("retries only the requested failed domain and leaves other failed domains untouched", async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "picgo-facade-retry-"))
      try {
        writeFileSync(
          join(tempRoot, "external-picgo-cfg.json"),
          JSON.stringify({
            useBundledPicgo: false,
            picgoType: "piclist",
            extPicgoApiUrl: "http://127.0.0.1:36677",
            picListApiUrl: "https://piclist.example.com/upload",
            picListApiKey: ***
          })
        )
        writeFileSync(
          join(tempRoot, "picgo.cfg.json"),
          JSON.stringify({
            settings: { npmProxy: "http://proxy.example.com" },
          })
        )

        const migration = makeMigrationState({
          domains: {
            picgoSettings: { status: "failed", importedSources: [], error: "settings failed" },
            externalPicList: { status: "failed", importedSources: [], error: "external failed" },
          } as any,
        })
        const main = createMemoryAdapter({
          picBed: { uploader: "smms", current: "smms" },
          picgoPlugins: {},
          siyuan: {
            waitTimeout: 2,
            retryTimes: 5,
            autoUpload: true,
            replaceLink: true,
            txtImageSwitch: false,
            picgoMigration: migration,
          },
        })
        const external = createMemoryAdapter({})
        const adapterMap: Record<string, ReturnType<typeof createMemoryAdapter>> = {
          "test-picgo.cfg.json": main,
          "universal-picgo/external-picgo-cfg.json": external,
          "siyuan-cfg": createMemoryAdapter({}),
        }

        const f = await createUnifiedPicGoConfigFacade({
          ...defaultOptions(),
          paths: {
            ...defaultOptions().paths,
            homeDir: tempRoot,
          },
          storageAdapterFactory: (path: string) => adapterMap[path] ?? createMemoryAdapter({}),
        })
        const retried = await f.retryMigration(["externalPicList"])

        expect(retried.status).toBe("failed")
        expect(retried.domains.externalPicList.status).toBe("imported")
        expect(retried.domains.externalPicList.importedSources).toEqual(["home:external-picgo-cfg.json"])
        expect(retried.domains.picgoSettings.status).toBe("failed")
        expect(retried.domains.picgoSettings.error).toBe("settings failed")
        expect((await f.getExternalPicGoConfig()).picListApiUrl).toBe("https://piclist.example.com/upload")
        const picgoConfig = await f.getPicGoConfig() as any
        expect(picgoConfig.settings).toBeUndefined()
      } finally {
        rmSync(tempRoot, { recursive: true, force: true })
      }
    })
    */
  })

  describe("flush drains scheduled async writes", () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it("immediate explicit flush cancels debounce and writes the owner once", async () => {
      vi.useFakeTimers()
      const { facade: testFacade, mainAdapter: adapter } = await createDeferredFacade()

      await testFacade.updatePicGoConfig((draft) => {
        ;(draft as any).flushMarker = "immediate"
      })

      const flushPromise = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(300)
      expect(adapter.write).toHaveBeenCalledTimes(1)

      adapter._writes[0].resolve()
      await flushPromise
      await vi.advanceTimersByTimeAsync(300)

      expect(adapter.write).toHaveBeenCalledTimes(1)
      expect(adapter._getData().flushMarker).toBe("immediate")
    })

    it("explicit flush joins an in-flight auto-flush without duplicating writes", async () => {
      vi.useFakeTimers()
      const { facade: testFacade, mainAdapter: adapter } = await createDeferredFacade()

      await testFacade.updatePicGoConfig((draft) => {
        ;(draft as any).flushMarker = "auto"
      })
      await vi.advanceTimersByTimeAsync(300)
      await waitMicrotasks()

      expect(adapter.write).toHaveBeenCalledTimes(1)

      const flushPromise = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(1)

      adapter._writes[0].resolve()
      await flushPromise
      expect(adapter.write).toHaveBeenCalledTimes(1)
      expect(adapter._getData().flushMarker).toBe("auto")
    })

    it("does not clear a newer dirty mutation when an older flush completes", async () => {
      vi.useFakeTimers()
      const { facade: testFacade, mainAdapter: adapter } = await createDeferredFacade()

      await testFacade.updatePicGoConfig((draft) => {
        ;(draft as any).flushMarker = "first"
      })
      const firstFlush = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(1)
      expect(adapter._writes[0].payload.flushMarker).toBe("first")

      await testFacade.updatePicGoConfig((draft) => {
        ;(draft as any).flushMarker = "second"
      })
      adapter._writes[0].resolve()
      await firstFlush

      expect(adapter.write).toHaveBeenCalledTimes(1)
      expect(adapter._getData().flushMarker).toBe("first")

      const secondFlush = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(2)
      expect(adapter._writes[1].payload.flushMarker).toBe("second")

      adapter._writes[1].resolve()
      await secondFlush
      await vi.advanceTimersByTimeAsync(300)

      expect(adapter.write).toHaveBeenCalledTimes(2)
      expect(adapter._getData().flushMarker).toBe("second")
    })

    it("keeps dirty state after write failure so the next flush can retry", async () => {
      vi.useFakeTimers()
      const { facade: testFacade, mainAdapter: adapter } = await createDeferredFacade()

      await testFacade.updatePicGoConfig((draft) => {
        ;(draft as any).flushMarker = "retry"
      })

      const failedFlush = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(1)

      const failedExpectation = expect(failedFlush).rejects.toBeInstanceOf(ConfigFlushError)
      adapter._writes[0].reject(new Error("kernel write boom"))
      await failedExpectation

      const retryFlush = testFacade.flush(["picgoMain"])
      await waitMicrotasks()
      expect(adapter.write).toHaveBeenCalledTimes(2)
      expect(adapter._writes[1].payload.flushMarker).toBe("retry")

      adapter._writes[1].resolve()
      await retryFlush

      expect(adapter._getData().flushMarker).toBe("retry")
    })
  })
})
