/**
 * Regression test: ExternalPicgoConfigDb defaults survive
 * JSONStore.loadFromRemote() overwriting this.data for async backends.
 *
 * This is the failing test for the "默认未选中内置picgo" bug.
 */
import { afterEach, describe, expect, it } from "vitest"
import ExternalPicgoConfigDb from "../db/externalPicGo"
import { PicgoTypeEnum } from "../utils/enums"

describe("ExternalPicgoConfigDb defaults survival (async backend)", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("defaults survive JSONStore.loadFromRemote() returning empty object", async () => {
    // Simulate async Kernel adapter whose read() initially returns {}
    // (file doesn't exist on server yet).
    // loadFromRemote() will replace this.data with {} — defaults must survive.
    const asyncAdpt = {
      mode: "async" as const,
      read: async () => ({} as Record<string, any>),
      write: async (_d: Record<string, any>) => {},
    }

    const ctx = {
      configPath: "test-external-defaults",
      pluginBaseDir: "test",
      log: { error: () => {} },
      storageAdapterFactory: () => asyncAdpt,
    } as any

    const db = new ExternalPicgoConfigDb(ctx)

    // Simulate: JSONStore.loadFromRemote() completes, overwriting this.data
    await (db as any).ensureReady()

    // After remote load (even if empty), defaults MUST still be present
    const data = db.read()
    expect(data.picgoType).toBe(PicgoTypeEnum.Bundled)
    expect(data.useBundledPicgo).toBe(true)
    expect(data.extPicgoApiUrl).toBe("http://127.0.0.1:36677")
    expect(data.picListApiUrl).toBe("")
    expect(data.picListApiKey).toBe("")
  })

  it("defaults survive JSONStore.loadFromRemote() with partial remote data", async () => {
    // Simulate remote has useBundledPicgo=false but missing picgoType
    let remoteData: Record<string, any> = { useBundledPicgo: false }
    const asyncAdpt = {
      mode: "async" as const,
      read: async () => remoteData,
      write: async (d: Record<string, any>) => { remoteData = d },
    }

    const ctx = {
      configPath: "test-partial-remote",
      pluginBaseDir: "test",
      log: { error: () => {} },
      storageAdapterFactory: () => asyncAdpt,
    } as any

    const db = new ExternalPicgoConfigDb(ctx)
    await (db as any).ensureReady()

    const data = db.read()
    // Remote value wins (user set it to false)
    expect(data.useBundledPicgo).toBe(false)
    // Missing in remote → default fills in
    expect(data.picgoType).toBe(PicgoTypeEnum.Bundled)
    expect(data.picListApiUrl).toBe("")
  })

  it("read() returns defaults immediately even before ensureReady()", () => {
    const asyncAdpt = {
      mode: "async" as const,
      read: async () => ({} as Record<string, any>),
      write: async (_d: Record<string, any>) => {},
    }

    const ctx = {
      configPath: "test-immediate-read",
      pluginBaseDir: "test",
      log: { error: () => {} },
      storageAdapterFactory: () => asyncAdpt,
    } as any

    const db = new ExternalPicgoConfigDb(ctx)

    // Before ensureReady() — defaults must be available for UI
    const data = db.read()
    expect(data.picgoType).toBe(PicgoTypeEnum.Bundled)
    expect(data.useBundledPicgo).toBe(true)
  })

  it("remote user data takes precedence over defaults after load", async () => {
    // Real remote data with explicit user choices
    const remoteData = {
      useBundledPicgo: false,
      picgoType: PicgoTypeEnum.App,
      extPicgoApiUrl: "http://192.168.1.100:36677",
      picListApiUrl: "https://piclist.lan",
      picListApiKey: "real-key",
    }
    const asyncAdpt = {
      mode: "async" as const,
      read: async () => ({ ...remoteData }),
      write: async (_d: Record<string, any>) => {},
    }

    const ctx = {
      configPath: "test-remote-wins",
      pluginBaseDir: "test",
      log: { error: () => {} },
      storageAdapterFactory: () => asyncAdpt,
    } as any

    const db = new ExternalPicgoConfigDb(ctx)
    await (db as any).ensureReady()

    const data = db.read()
    // Remote values preserved
    expect(data.useBundledPicgo).toBe(false)
    expect(data.picgoType).toBe(PicgoTypeEnum.App)
    expect(data.extPicgoApiUrl).toBe("http://192.168.1.100:36677")
    expect(data.picListApiUrl).toBe("https://piclist.lan")
    expect(data.picListApiKey).toBe("real-key")
  })
})
