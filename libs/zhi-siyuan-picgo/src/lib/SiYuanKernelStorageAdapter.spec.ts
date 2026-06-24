import { describe, expect, it, vi } from "vitest"
import type { SiyuanKernelApi } from "zhi-siyuan-api"
import type { ILogger } from "zhi-lib-base"
import { SiYuanKernelStorageAdapter } from "./SiYuanKernelStorageAdapter"

const SERVER_PATH = "/data/storage/syp/picgo/picgo.cfg.json"
const LEGACY_KEY = "universal-picgo/picgo.cfg.json"

const makeLogger = (): ILogger =>
  ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }) as unknown as ILogger

const makeAdapter = (api: Partial<SiyuanKernelApi>): SiYuanKernelStorageAdapter =>
  new SiYuanKernelStorageAdapter(api as SiyuanKernelApi, SERVER_PATH, LEGACY_KEY, makeLogger())

describe("SiYuanKernelStorageAdapter.write", () => {
  it("accepts saveTextData success when zhi-siyuan-api returns null data and verifies the owner file", async () => {
    const data = { picBed: { current: "s3" }, uploader: { s3: { bucket: "static-rs-terwer" } } }
    let savedText = ""
    const api = {
      saveTextData: vi.fn(async (_path: string, text: string) => {
        savedText = text
        return null
      }),
      getFile: vi.fn(async () => savedText),
    }
    const adapter = makeAdapter(api as unknown as Partial<SiyuanKernelApi>)

    await expect(adapter.write(data)).resolves.toBeUndefined()

    expect(api.saveTextData).toHaveBeenCalledWith(SERVER_PATH, JSON.stringify(data, null, 2))
    expect(api.getFile).toHaveBeenCalledWith(SERVER_PATH, "text")
  })

  it("accepts legacy wrapper success shape with code 0", async () => {
    const data = { picBed: { current: "github" } }
    let savedText = ""
    const api = {
      saveTextData: vi.fn(async (_path: string, text: string) => {
        savedText = text
        return { code: 0, msg: "", data: null }
      }),
      getFile: vi.fn(async () => savedText),
    }
    const adapter = makeAdapter(api as unknown as Partial<SiyuanKernelApi>)

    await expect(adapter.write(data)).resolves.toBeUndefined()
  })

  it("throws a structured kernel error when saveTextData returns an explicit failed SiyuanData shape", async () => {
    const api = {
      saveTextData: vi.fn(async () => ({ code: -1, msg: "boom", data: null })),
      getFile: vi.fn(async () => "{}"),
    }
    const adapter = makeAdapter(api as unknown as Partial<SiyuanKernelApi>)

    await expect(adapter.write({})).rejects.toMatchObject({
      storageKind: "siyuan-kernel",
      ownerFile: SERVER_PATH,
      operation: "write",
      causeReason: "saveTextData failed: boom",
    })
    expect(api.getFile).not.toHaveBeenCalled()
  })

  it("wraps saveTextData exceptions as structured kernel write errors", async () => {
    const api = {
      saveTextData: vi.fn(async () => {
        throw new Error("network down")
      }),
      getFile: vi.fn(async () => "{}"),
    }
    const adapter = makeAdapter(api as unknown as Partial<SiyuanKernelApi>)

    await expect(adapter.write({})).rejects.toMatchObject({
      storageKind: "siyuan-kernel",
      ownerFile: SERVER_PATH,
      operation: "write",
      causeReason: "saveTextData threw: network down",
    })
    expect(api.getFile).not.toHaveBeenCalled()
  })

  it("does not silently accept a null saveTextData result when read-back verification fails", async () => {
    const api = {
      saveTextData: vi.fn(async () => null),
      getFile: vi.fn(async () => JSON.stringify({ picBed: { current: "wrong" } })),
    }
    const adapter = makeAdapter(api as unknown as Partial<SiyuanKernelApi>)

    await expect(adapter.write({ picBed: { current: "s3" } })).rejects.toMatchObject({
      storageKind: "siyuan-kernel",
      ownerFile: SERVER_PATH,
      operation: "write",
      causeReason: "write verification failed: remote content mismatch after saveTextData",
    })
  })
})
