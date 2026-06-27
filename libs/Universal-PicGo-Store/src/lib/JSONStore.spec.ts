import { afterEach, describe, expect, it, vi } from "vitest"
import { JSONStore } from "./JSONStore"
import { LocalStorageAdapter } from "./adapters/LocalStorageAdapter"

describe("JSONStore browser/localStorage adapter", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("supports get/set/has/unset with dotted paths", () => {
    const store = new JSONStore("json-store-spec", new LocalStorageAdapter("json-store-spec"))

    store.set("picBed.current", "smms")
    store.set("uploader.smms.defaultId", "default")

    expect(store.get("picBed.current")).toBe("smms")
    expect(store.get("uploader.smms")).toEqual({ defaultId: "default" })
    expect(store.has("uploader.smms.defaultId")).toBe(true)
    expect(store.unset("uploader.smms", "defaultId")).toBe(true)
    expect(store.has("uploader.smms.defaultId")).toBe(false)
    expect(JSON.parse(window.localStorage.getItem("json-store-spec") || "{}")).toEqual({
      picBed: { current: "smms" },
      uploader: { smms: {} },
    })
  })

  it("returns empty object for invalid localStorage JSON", () => {
    window.localStorage.setItem("json-store-invalid", "{invalid")

    const store = new JSONStore("json-store-invalid", new LocalStorageAdapter("json-store-invalid"))

    expect(store.get()).toEqual({})
  })
})

describe("JSONStore async adapter", () => {
  it("waitReady loads remote data before safeSet", async () => {
    const mockAdapter = {
      mode: "async" as const,
      read: vi.fn().mockResolvedValue({ existing: "ok" }),
      write: vi.fn().mockResolvedValue(undefined),
    }

    const store = new JSONStore("test-key", mockAdapter)
    await store.waitReady()

    expect(mockAdapter.read).toHaveBeenCalled()
    expect(store.get("existing")).toBe("ok")
    expect(store.isAsync).toBe(true)
  })

  it("debounce write: multiple sets produce one write", async () => {
    const mockAdapter = {
      mode: "async" as const,
      read: vi.fn().mockResolvedValue({}),
      write: vi.fn().mockResolvedValue(undefined),
    }

    const store = new JSONStore("test-key", mockAdapter)
    await store.waitReady()

    store.set("a", 1)
    store.set("b", 2)
    store.set("c", 3)

    await store.flush()
    expect(mockAdapter.write).toHaveBeenCalledTimes(1)
    expect(mockAdapter.write).toHaveBeenCalledWith({ a: 1, b: 2, c: 3 })
  })

  it("write failure sets lastWriteError and flush throws", async () => {
    const mockAdapter = {
      mode: "async" as const,
      read: vi.fn().mockResolvedValue({}),
      write: vi.fn().mockRejectedValue(new Error("network down")),
    }

    const store = new JSONStore("test-key", mockAdapter)
    await store.waitReady()
    store.set("key", "value")

    await expect(store.flush()).rejects.toThrow("network down")
    expect(store.lastWriteError).toBeNull()
  })

  it("refreshAsync flushes pending writes before remote read", async () => {
    let callOrder = ""
    const mockAdapter = {
      mode: "async" as const,
      read: vi.fn().mockImplementation(async () => {
        callOrder += "R"
        return { remote: "data" }
      }),
      write: vi.fn().mockImplementation(async () => {
        callOrder += "W"
      }),
    }

    const store = new JSONStore("test-key", mockAdapter)
    await store.waitReady()
    callOrder = ""
    store.set("local", "pending")
    await store.refreshAsync()

    // flush (W) must happen before remote read (R)
    expect(callOrder).toBe("WR")
    expect(store.get("remote")).toBe("data")
  })

  it("refreshAsync skips overwrite if local set happens during remote read", async () => {
    let store: JSONStore
    let duringRefresh = false
    const mockAdapter = {
      mode: "async" as const,
      read: vi.fn().mockImplementation(async () => {
        // Simulate local write happening during read
        if (duringRefresh) {
          store.set("local", "fresh")
        }
        return { remote: "stale" }
      }),
      write: vi.fn().mockResolvedValue(undefined),
    }

    store = new JSONStore("test-key", mockAdapter)
    await store.waitReady()
    store.set("local", "initial")
    duringRefresh = true
    await store.refreshAsync()

    // Local write during read takes priority
    expect(store.get("local")).toBe("fresh")
  })
})

describe("JSONStore node JSON adapter", () => {
  const originalWindow = globalThis.window
  const memfs = new Map<string, string>()

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: originalWindow,
    })
    memfs.clear()
  })

  it("reads JSON with comments and writes standard JSON in node-like host", async () => {
    const utils = await import("./utils")
    const dbPath = "/tmp/picgo-store/spec.json"
    const fs = {
      readFileSync: vi.fn(() => `{
        // line comment
        "picBed": {
          /* block comment */
          "current": "github"
        }
      }`),
      realpathSync: vi.fn((file: string) => file),
      statSync: vi.fn(() => {
        throw Object.assign(new Error("not found"), { code: "ENOENT" })
      }),
      openSync: vi.fn((file: string, flags: string, mode?: number) => {
        void flags
        void mode
        memfs.set("last-open", file)
        return 1
      }),
      writeSync: vi.fn((fd: number, data: string, position?: number, encoding?: string) => {
        void fd
        void position
        void encoding
        memfs.set("last-write", data)
      }),
      fsyncSync: vi.fn(),
      closeSync: vi.fn(),
      renameSync: vi.fn((from: string, to: string) => {
        memfs.set(to, memfs.get("last-write") || "")
        memfs.delete(from)
      }),
      unlinkSync: vi.fn(),
      writeFileSync: vi.fn((file: string, data: string) => {
        memfs.set(file, data)
      }),
      rm: vi.fn(),
    }
    const fakeWindow = {
      fs,
      process: { pid: 1234 },
      __filename: "JSONStore.spec.ts",
      ArrayBuffer,
      require: vi.fn((name: string) => {
        if (name !== "path") throw new Error(`unexpected require ${name}`)
        return {
          dirname: () => "/tmp/picgo-store",
          basename: () => "spec.json",
          join: (...parts: string[]) => parts.join("/"),
        }
      }),
    } as any

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: fakeWindow,
    })
    vi.spyOn(utils, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(utils, "win", "get").mockReturnValue(fakeWindow)

    // Use JSONAdapter explicitly since adapter is now required
    const { JSONAdapter } = await import("./adapters/JSONAdapter")
    const { JSONStore: NodeJSONStore } = await import("./JSONStore")
    const store = new NodeJSONStore(dbPath, new JSONAdapter(dbPath))

    expect(store.get("picBed.current")).toBe("github")
    store.set("picBed.current", "smms")
    expect(memfs.get("last-open")).toMatch(new RegExp(`^${dbPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`))
    expect(fs.writeSync).toHaveBeenCalledWith(1, JSON.stringify({ picBed: { current: "smms" } }, null, 2), 0, "utf8")
    expect(fs.renameSync.mock.calls[0][1]).toBe(dbPath)
  })
})
