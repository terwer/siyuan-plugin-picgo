import { afterEach, describe, expect, it, vi } from "vitest"
import * as picgo from "universal-picgo"
import {
  getWorkspacePicGoExternalConfigPath,
  getWorkspacePicGoConfigPath,
  getWorkspaceSiyuanConnectionConfigPath,
  hasV3MigrationMarker,
  isDefaultInitializedConfig,
  migrateV2WorkspacePicGoConfig,
  resolveSiyuanPicGoOwnerFilePath,
  resolveSiyuanPicGoPaths,
  SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
  SIYUAN_PICGO_MAIN_CONFIG_KEY,
  SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
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
      externalConfigPath: "/workspace/data/storage/syp/picgo/external-picgo-cfg.json",
      siyuanConnectionConfigPath: "/workspace/data/storage/syp/siyuan-cfg.json",
      workspaceDir: "/workspace",
      baseDir: "/home/tester/.universal-picgo",
      pluginBaseDir: "/home/tester/.universal-picgo",
      zhiNpmPath: undefined,
    })
    expect(toUniversalPicGoOptions(paths, true)).toMatchObject({
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      externalConfigPath: "/workspace/data/storage/syp/picgo/external-picgo-cfg.json",
      siyuanConnectionConfigPath: "/workspace/data/storage/syp/siyuan-cfg.json",
      workspaceDir: "/workspace",
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
      externalConfigPath: "/debug/external-picgo-cfg.json",
      siyuanConnectionConfigPath: "/debug/siyuan-cfg.json",
      workspaceDir: "/debug/workspace",
      runtimeDir: "/debug/runtime",
      pluginBaseDir: "/debug/plugins",
      zhiNpmPath: "/debug/zhi",
    })

    expect(paths).toEqual({
      configPath: "/debug/picgo.cfg.json",
      externalConfigPath: "/debug/external-picgo-cfg.json",
      siyuanConnectionConfigPath: "/debug/siyuan-cfg.json",
      workspaceDir: "/debug/workspace",
      baseDir: "/debug/runtime",
      pluginBaseDir: "/debug/plugins",
      zhiNpmPath: "/debug/zhi",
    })
  })

  it("builds the v2 workspace config path", () => {
    vi.spyOn(picgo, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(picgo, "win", "get").mockReturnValue(fakeWin as any)

    expect(getWorkspacePicGoConfigPath("/workspace")).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
    expect(getWorkspacePicGoExternalConfigPath("/workspace")).toBe("/workspace/data/storage/syp/picgo/external-picgo-cfg.json")
    expect(getWorkspaceSiyuanConnectionConfigPath("/workspace")).toBe("/workspace/data/storage/syp/siyuan-cfg.json")
  })

  it("maps all three v3 owner logical keys to SiYuan workspace physical files under Node", () => {
    const paths = {
      configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
      externalConfigPath: "/workspace/data/storage/syp/picgo/external-picgo-cfg.json",
      siyuanConnectionConfigPath: "/workspace/data/storage/syp/siyuan-cfg.json",
      baseDir: "/home/tester/.universal-picgo",
    }

    expect(resolveSiyuanPicGoOwnerFilePath(SIYUAN_PICGO_MAIN_CONFIG_KEY, paths)).toBe("/workspace/data/storage/syp/picgo/picgo.cfg.json")
    expect(resolveSiyuanPicGoOwnerFilePath(SIYUAN_PICGO_EXTERNAL_CONFIG_KEY, paths)).toBe("/workspace/data/storage/syp/picgo/external-picgo-cfg.json")
    expect(resolveSiyuanPicGoOwnerFilePath(SIYUAN_PICGO_SIYUAN_CONNECTION_KEY, paths)).toBe("/workspace/data/storage/syp/siyuan-cfg.json")
    expect(resolveSiyuanPicGoOwnerFilePath("runtime-cache.json", paths)).toBe("runtime-cache.json")
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
      readFileSync: vi.fn((target: string) => files.get(target) ?? ""),
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

  it("replaces an auto-created default smms workspace config from legacy home config", () => {
    const defaultWorkspaceConfig = JSON.stringify({
      picBed: {
        uploader: "smms",
        current: "smms",
      },
      picgoPlugins: {},
      siyuan: {
        waitTimeout: 2,
        retryTimes: 5,
        autoUpload: true,
        replaceLink: true,
        txtImageSwitch: false,
      },
    })
    const legacyHomeConfig = JSON.stringify({
      picBed: {
        uploader: "awss3",
        current: "awss3",
        awss3: {
          _id: "rustfs",
          _configName: "rustfs",
          endpoint: "http://127.0.0.1:9000",
        },
      },
      uploader: {
        awss3: {
          defaultId: "rustfs",
          configList: [
            {
              _id: "rustfs",
              _configName: "rustfs",
              endpoint: "http://127.0.0.1:9000",
            },
          ],
        },
      },
    })
    const files = new Map<string, string>([
      ["/home/tester/.universal-picgo/picgo.cfg.json", legacyHomeConfig],
      ["/workspace/data/storage/syp/picgo/picgo.cfg.json", defaultWorkspaceConfig],
    ])
    const fs = {
      existsSync: vi.fn((target: string) => files.has(target)),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((target: string) => files.get(target) ?? ""),
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

    expect(isDefaultInitializedConfig(defaultWorkspaceConfig)).toBe(true)
    expect(
      migrateV2WorkspacePicGoConfig({
        configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
        baseDir: "/home/tester/.universal-picgo",
      })
    ).toBe(true)
    expect(files.get("/workspace/data/storage/syp/picgo/picgo.cfg.json")).toBe(legacyHomeConfig)
  })

  it("does not replace generated defaults when workspace config already has v3 marker", () => {
    const v3WorkspaceConfig = JSON.stringify({
      picBed: {
        uploader: "smms",
        current: "smms",
      },
      picgoPlugins: {},
      siyuan: {
        waitTimeout: 2,
        retryTimes: 5,
        autoUpload: true,
        replaceLink: true,
        txtImageSwitch: false,
        picgoMigration: {
          version: "v3.0-unified-async-config-source",
          status: "done",
          attempts: 1,
          domains: {},
        },
      },
    })
    const legacyHomeConfig = JSON.stringify({
      picBed: {
        uploader: "awss3",
        current: "awss3",
      },
    })
    const files = new Map<string, string>([
      ["/home/tester/.universal-picgo/picgo.cfg.json", legacyHomeConfig],
      ["/workspace/data/storage/syp/picgo/picgo.cfg.json", v3WorkspaceConfig],
    ])
    const fs = {
      existsSync: vi.fn((target: string) => files.has(target)),
      mkdirSync: vi.fn(),
      readFileSync: vi.fn((target: string) => files.get(target) ?? ""),
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

    expect(hasV3MigrationMarker(v3WorkspaceConfig)).toBe(true)
    expect(isDefaultInitializedConfig(v3WorkspaceConfig)).toBe(false)
    expect(
      migrateV2WorkspacePicGoConfig({
        configPath: "/workspace/data/storage/syp/picgo/picgo.cfg.json",
        baseDir: "/home/tester/.universal-picgo",
      })
    ).toBe(false)
    expect(fs.copyFileSync).not.toHaveBeenCalled()
    expect(files.get("/workspace/data/storage/syp/picgo/picgo.cfg.json")).toBe(v3WorkspaceConfig)
  })
})
