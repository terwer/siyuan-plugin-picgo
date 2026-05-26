import { afterEach, describe, expect, it, vi } from "vitest"
import { UniversalPicGo } from "./UniversalPicGo"
import * as store from "universal-picgo-store"
import { createContext } from "../utils/createContext"

const createFakeNodeHost = () => {
  const dirs = new Set<string>()
  const files = new Set<string>()
  const fileContents = new Map<string, string>()
  const fdToFile = new Map<number, string>()
  let nextFd = 1
  const fs = {
    constants: { F_OK: 0 },
    accessSync: vi.fn((file: string) => {
      if (!files.has(file) && !dirs.has(file)) {
        throw Object.assign(new Error("not found"), { code: "ENOENT" })
      }
    }),
    existsSync: vi.fn((file: string) => files.has(file) || dirs.has(file)),
    mkdirSync: vi.fn((dir: string) => {
      dirs.add(dir)
    }),
    writeFileSync: vi.fn((file: string, data = "") => {
      files.add(file)
      fileContents.set(file, String(data))
    }),
    readFileSync: vi.fn((file: string) => {
      if (!files.has(file)) {
        throw Object.assign(new Error("not found"), { code: "ENOENT" })
      }
      return fileContents.get(file) ?? "{}"
    }),
    readdirSync: vi.fn(() => []),
    realpathSync: vi.fn((file: string) => file),
    statSync: vi.fn(() => {
      throw Object.assign(new Error("not found"), { code: "ENOENT" })
    }),
    openSync: vi.fn((file: string) => {
      const fd = nextFd++
      files.add(file)
      fileContents.set(file, "")
      fdToFile.set(fd, file)
      return fd
    }),
    writeSync: vi.fn((fd: number, data: string) => {
      const file = fdToFile.get(fd)
      if (file) {
        fileContents.set(file, `${fileContents.get(file) ?? ""}${String(data)}`)
      }
    }),
    fsyncSync: vi.fn(),
    closeSync: vi.fn(),
    renameSync: vi.fn((from: string, to: string) => {
      files.delete(from)
      files.add(to)
      fileContents.set(to, fileContents.get(from) ?? "")
      fileContents.delete(from)
      for (const [fd, file] of fdToFile.entries()) {
        if (file === from) {
          fdToFile.delete(fd)
        }
      }
    }),
    unlinkSync: vi.fn((file: string) => {
      files.delete(file)
      fileContents.delete(file)
    }),
    rm: vi.fn(),
  }
  const path = {
    join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
    dirname: (file: string) => file.replace(/\/[^/]*$/, "") || "/",
    basename: (file: string) => file.split("/").pop() || file,
    extname: (file: string) => {
      const basename = file.split("/").pop() || ""
      const dotIndex = basename.lastIndexOf(".")
      return dotIndex >= 0 ? basename.slice(dotIndex) : ""
    },
  }
  const fakeWin = {
    fs,
    process: { pid: 1234 },
    __filename: "UniversalPicGo.spec.ts",
    ArrayBuffer,
    require: vi.fn((name: string) => {
      if (name === "path") return path
      if (name === "os") return { homedir: () => "/home/tester" }
      throw new Error(`unexpected require ${name}`)
    }),
  } as any

  return { fakeWin, dirs, files, fs, fileContents }
}

const suppressPicGoPathLogs = () => {
  vi.spyOn(console, "log").mockImplementation(() => undefined)
  vi.spyOn(console, "debug").mockImplementation(() => undefined)
  vi.spyOn(console, "info").mockImplementation(() => undefined)
}

describe("UniversalPicGo v2 path contract", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("keeps runtime baseDir local when options configPath points to workspace", () => {
    suppressPicGoPathLogs()
    const { fakeWin } = createFakeNodeHost()
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue(fakeWin)
    vi.spyOn(UniversalPicGo.prototype as any, "init").mockImplementation(function initStub(this: any) {
      this.i18n = {} as any
      this._pluginLoader = { load: vi.fn() } as any
      this.lifecycle = { start: vi.fn() } as any
    })

    const picgo = new UniversalPicGo({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      isDev: true,
    })

    expect(picgo.configPath).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
    expect(picgo.baseDir).toBe("/home/tester/.universal-picgo")
    expect(picgo.pluginBaseDir).toBe("/home/tester/.universal-picgo")
    expect(picgo.zhiNpmPath).toBe("/home/tester/.universal-picgo/libs")
  })

  it("preserves legacy string constructor behavior for custom configPath", () => {
    suppressPicGoPathLogs()
    const { fakeWin } = createFakeNodeHost()
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue(fakeWin)
    vi.spyOn(UniversalPicGo.prototype as any, "init").mockImplementation(function initStub(this: any) {
      this.i18n = {} as any
      this._pluginLoader = { load: vi.fn() } as any
      this.lifecycle = { start: vi.fn() } as any
    })

    const picgo = new UniversalPicGo("/workspace/data/storage/syp/picgo/picgo.cfg.json", "", "", true)

    expect(picgo.configPath).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
    expect(picgo.baseDir).toBe("/workspace/data/storage/syp/picgo")
    expect(picgo.pluginBaseDir).toBe("/home/tester/.universal-picgo")
  })

  it("does not load third-party plugin config outside Electron runtime", () => {
    suppressPicGoPathLogs()
    const { fakeWin } = createFakeNodeHost()
    fakeWin.process = {
      pid: 1234,
      versions: {
        node: "20.0.0",
      },
    }
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue(fakeWin)

    const picgo = new UniversalPicGo({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      isDev: true,
    })

    expect(picgo.pluginLoader.getFullList()).toEqual([])
    expect(picgo.pluginLoader.getList()).toEqual([])
  })

  it("keeps reloadConfig bound on upload child context", () => {
    suppressPicGoPathLogs()
    const { fakeWin } = createFakeNodeHost()
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue(fakeWin)
    vi.spyOn(UniversalPicGo.prototype as any, "init").mockImplementation(function initStub(this: any) {
      this.i18n = {} as any
      this._pluginLoader = { load: vi.fn() } as any
      this.lifecycle = { start: vi.fn() } as any
    })

    const picgo = new UniversalPicGo({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      isDev: true,
    })

    const childCtx = createContext(picgo)
    expect(childCtx.reloadConfig).toBeTypeOf("function")
    expect(() => childCtx.reloadConfig()).not.toThrow()
  })

  it("reloads config from configPath to avoid stale uploader runtime", () => {
    suppressPicGoPathLogs()
    const { fakeWin, files, fileContents } = createFakeNodeHost()
    const configPath = "/workspace/data/storage/syp/picgo/picgo.cfg.json"
    files.add(configPath)
    fileContents.set(
      configPath,
      JSON.stringify({
        picBed: {
          uploader: "smms",
          current: "smms",
        },
      })
    )
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue(fakeWin)
    vi.spyOn(UniversalPicGo.prototype as any, "init").mockImplementation(function initStub(this: any) {
      this.i18n = {} as any
      this._pluginLoader = { load: vi.fn() } as any
      this.lifecycle = { start: vi.fn() } as any
    })

    const picgo = new UniversalPicGo({
      configPath,
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      isDev: true,
    })
    expect(picgo.getConfig("picBed.uploader")).toBe("smms")

    const updatedConfigText = JSON.stringify({
      picBed: {
        uploader: "awss3",
        current: "awss3",
      },
    })
    fileContents.set(configPath, updatedConfigText)
    window.localStorage.setItem(configPath, updatedConfigText)

    picgo.reloadConfig()
    expect(picgo.getConfig("picBed.uploader")).toBe("awss3")
  })
})
