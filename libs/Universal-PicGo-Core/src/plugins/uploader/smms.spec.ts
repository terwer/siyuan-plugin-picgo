import { describe, expect, it, vi } from "vitest"
import { IPlugin, IPicGo, ISmmsConfig } from "../../types"
import { IBuildInEvent } from "../../utils/enums"
import register from "./smms"

const createUploader = (config: Partial<ISmmsConfig>, request: ReturnType<typeof vi.fn>) => {
  let registered: IPlugin | undefined
  const ctx = {
    output: [
      {
        fileName: "image.png",
        buffer: Buffer.from("image-content"),
      },
    ],
    getConfig: vi.fn((name?: string) => (name === "picBed.smms" ? config : undefined)),
    request,
    log: {
      error: vi.fn(),
    },
    emit: vi.fn(),
    i18n: {
      translate: vi.fn((key: string) => key),
    },
    helper: {
      uploader: {
        register: vi.fn((_id: string, plugin: IPlugin) => {
          registered = plugin
        }),
      },
    },
  } as unknown as IPicGo

  register(ctx)

  return { ctx, uploader: registered as IPlugin }
}

describe("smms uploader", () => {
  it("uploads to the S.EE endpoint by default", async () => {
    const request = vi.fn().mockResolvedValue({
      code: 200,
      message: "success",
      success: true,
      data: { url: "https://i.see.you/2026/02/11/dm3K/image.png" },
    })
    const { ctx, uploader } = createUploader({ token: "test-token" }, request)

    await uploader.handle(ctx)

    expect(request).toHaveBeenCalledTimes(1)
    const options = request.mock.calls[0][0]
    expect(options.method).toBe("POST")
    expect(options.url).toBe("https://s.ee/api/v1/file/upload")
    expect(options.headers.Authorization).toBe("test-token")
    expect(options.data).toBeInstanceOf(FormData)
    expect((options.data as FormData).has("smfile")).toBe(true)
    // S.EE 不接受旧的 SM.MS 专用 ssl 参数
    expect((options.data as FormData).has("ssl")).toBe(false)
    expect(ctx.output[0].imgUrl).toBe("https://i.see.you/2026/02/11/dm3K/image.png")
    expect(ctx.output[0].buffer).toBeUndefined()
  })

  it("keeps the legacy SM.MS endpoint for a configured backup domain", async () => {
    const request = vi.fn().mockResolvedValue({
      code: "success",
      message: "Upload success.",
      data: { url: "https://s2.loli.net/2026/02/11/image.png" },
    })
    const { ctx, uploader } = createUploader({ token: "test-token", backupDomain: "sm.ms" }, request)

    await uploader.handle(ctx)

    const options = request.mock.calls[0][0]
    expect(options.url).toBe("https://sm.ms/api/v2/upload")
    expect(ctx.output[0].imgUrl).toBe("https://s2.loli.net/2026/02/11/image.png")
  })

  it("accepts the S.EE response that only carries message: success", async () => {
    const request = vi.fn().mockResolvedValue({
      message: "success",
      data: { url: "https://i.see.you/2026/02/11/dm3K/image.png" },
    })
    const { ctx, uploader } = createUploader({ token: "test-token" }, request)

    await uploader.handle(ctx)

    expect(ctx.output[0].imgUrl).toBe("https://i.see.you/2026/02/11/dm3K/image.png")
  })

  it("keeps the legacy repeated image response working", async () => {
    const request = vi.fn().mockResolvedValue({
      code: "image_repeated",
      images: "https://s2.loli.net/2026/02/11/image.png",
    })
    const { ctx, uploader } = createUploader({ token: "test-token", backupDomain: "sm.ms" }, request)

    await uploader.handle(ctx)

    expect(ctx.output[0].imgUrl).toBe("https://s2.loli.net/2026/02/11/image.png")
  })

  it("reports the failure message when the upload is rejected", async () => {
    const request = vi.fn().mockResolvedValue({
      code: 401,
      message: "invalid token",
    })
    const { ctx, uploader } = createUploader({ token: "test-token" }, request)

    await expect(uploader.handle(ctx)).rejects.toBe("Error: invalid token")
    expect(ctx.emit).toHaveBeenCalledWith(IBuildInEvent.NOTIFICATION, {
      title: "UPLOAD_FAILED",
      body: "invalid token",
    })
    expect(ctx.output[0].imgUrl).toBeUndefined()
  })
})
