import { afterEach, describe, expect, it, vi } from "vitest"
import { JSONStore } from "./JSONStore"

describe("JSONStore browser/localStorage adapter", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("supports get/set/has/unset with dotted paths", () => {
    const store = new JSONStore("json-store-spec")

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

    const store = new JSONStore("json-store-invalid")

    expect(store.get()).toEqual({})
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

    const { JSONStore: NodeJSONStore } = await import("./JSONStore")
    const store = new NodeJSONStore(dbPath)

    expect(store.get("picBed.current")).toBe("github")
    store.set("picBed.current", "smms")
    expect(memfs.get("last-open")).toMatch(new RegExp(`^${dbPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`))
    expect(fs.writeSync).toHaveBeenCalledWith(1, JSON.stringify({ picBed: { current: "smms" } }, null, 2), 0, "utf8")
    expect(fs.renameSync.mock.calls[0][1]).toBe(dbPath)
  })
})
