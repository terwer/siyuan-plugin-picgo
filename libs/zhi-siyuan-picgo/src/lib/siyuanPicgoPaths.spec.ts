import { afterEach, describe, expect, it, vi } from "vitest"
import * as picgo from "universal-picgo"
import {
  getWorkspacePicGoConfigPath,
  migrateV2WorkspacePicGoConfig,
  resolveSiyuanPicGoPaths,
  toUniversalPicGoOptions,
} from "./siyuanPicgoPaths"

const fakeWin = {
  siyuan: {
    config: {
      system: {
        workspaceDir: "/workspace",
      },
    },
  },
  require: vi.fn((name: string) => {
    if (name === "path") {
      return {
        join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      }
    }
    if (name === "os") {
      return {
        homedir: () => "/home/tester",
      }
    }
    throw new Error(`unexpected require ${name}`)
  }),
}

describe("siyuan PicGo v2 path helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("resolves workspace main config and local runtime/plugin dirs", () => {
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue(fakeWin as any)

    const paths = resolveSiyuanPicGoPaths()

    expect(paths).toEqual({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      zhiNpmPath: undefined,
    })
    expect(toUniversalPicGoOptions(paths, true)).toMatchObject({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      isDev: true,
    })
  })

  it("lets explicit path overrides win for publisher debugging", () => {
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue(fakeWin as any)

    const paths = resolveSiyuanPicGoPaths({
      configPath: "/debug/picgo.cfg.json",
      runtimeDir: "/debug/runtime",
      pluginBaseDir: "/debug/plugins",
      zhiNpmPath: "/debug/zhi",
    })

    expect(paths).toEqual({
      configPath: "/debug/picgo.cfg.json",
      baseDir: "/debug/runtime",
      pluginBaseDir: "/debug/plugins",
      zhiNpmPath: "/debug/zhi",
    })
  })

  it("builds the v2 workspace config path", () => {
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue(fakeWin as any)

    expect(getWorkspacePicGoConfigPath("/workspace")).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
  })

  it("copies only home picgo.cfg.json when workspace config is missing", () => {
    const files = new Map<string, string>([["/home/tester/.universal-picgo/picgo.cfg.json", '{"ok":true}']])
    const dirs = new Set<string>()
    const fs = {
      existsSync: vi.fn((target: string) => files.has(target) || dirs.has(target)),
      mkdirSync: vi.fn((target: string) => dirs.add(target)),
      copyFileSync: vi.fn((from: string, to: string) => {
        files.set(to, files.get(from) ?? "")
      }),
    }
    const path = {
      join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      dirname: (file: string) => file.replace(/\/[^/]*$/, "") || "/",
      basename: (file: string) => file.split("/").pop() || file,
      resolve: (file: string) => file,
    }
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue({
      fs,
      require: vi.fn((name: string) => {
        if (name === "path") return path
        throw new Error(`unexpected require ${name}`)
      }),
    } as any)

    expect(
      migrateV2WorkspacePicGoConfig({
        configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
        baseDir: "/home/tester/.universal-picgo",
        pluginBaseDir: "/home/tester/.universal-picgo",
      })
    ).toBe(true)
    expect(files.get("/home/tester/.universal-picgo/picgo.cfg.json")).toBe('{"ok":true}')
    expect(files.get("/workspace/data/storage/syp/picgo/picgo.cfg.json")).toBe('{"ok":true}')
    expect(fs.copyFileSync).toHaveBeenCalledTimes(1)
  })

  it("does not overwrite existing workspace config during migration", () => {
    const files = new Map<string, string>([
      ["/home/tester/.universal-picgo/picgo.cfg.json", '{"home":true}'],
      ["/workspace/data/storage/syp/picgo/picgo.cfg.json", '{"workspace":true}'],
    ])
    const fs = {
      existsSync: vi.fn((target: string) => files.has(target)),
      mkdirSync: vi.fn(),
      copyFileSync: vi.fn(),
    }
    const path = {
      join: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      dirname: (file: string) => file.replace(/\/[^/]*$/, "") || "/",
      basename: (file: string) => file.split("/").pop() || file,
      resolve: (file: string) => file,
    }
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue({
      fs,
      require: vi.fn((name: string) => {
        if (name === "path") return path
        throw new Error(`unexpected require ${name}`)
      }),
    } as any)

    expect(
      migrateV2WorkspacePicGoConfig({
        configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
        baseDir: "/home/tester/.universal-picgo",
      })
    ).toBe(false)
    expect(fs.copyFileSync).not.toHaveBeenCalled()
    expect(files.get("/workspace/data/storage/syp/picgo/picgo.cfg.json")).toBe('{"workspace":true}')
  })
})
