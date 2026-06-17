import { afterEach, describe, expect, it, vi } from "vitest"
import axios from "axios"
import { PicGoRequestWrapper } from "./PicGoRequest"
import * as store from "universal-picgo-store"

const createLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
})

describe("PicGoRequestWrapper", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses current siyuan runtime origin instead of stale saved siyuan proxy for forced proxy request", async () => {
    const currentOrigin = "http://127.0.0.1:54277"
    const staleSavedOrigin = "http://127.0.0.1:51545"
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue({
      location: { origin: currentOrigin },
      siyuan: { config: { system: {} } },
    } as any)

    const request = vi.fn().mockResolvedValue({
      status: 200,
      data: {
        code: 0,
        data: {
          status: 200,
          body: "",
          bodyEncoding: "text",
          contentType: "text/html",
          headers: {},
        },
      },
      config: {},
      request: {},
    })
    vi.spyOn(axios, "create").mockReturnValue({
      interceptors: {
        response: { use: vi.fn() },
        request: { use: vi.fn() },
      },
      request,
    } as any)

    const ctx = {
      getLogger: vi.fn(() => createLogger()),
      getConfig: vi.fn((name?: string) => (name === "siyuan.proxy" ? staleSavedOrigin : undefined)),
      i18n: { translate: vi.fn((key: string) => key) },
    } as any
    const wrapper = new PicGoRequestWrapper(ctx)

    await wrapper.PicGoRequest({
      method: "PUT",
      url: "https://example-bucket.oss-cn-beijing.aliyuncs.com/test/image.jpg",
      headers: {
        "Content-Type": "image/jpeg",
        Date: "Wed, 17 Jun 2026 03:27:42 GMT",
        "x-cors-headers": JSON.stringify({
          Host: "example-bucket.oss-cn-beijing.aliyuncs.com",
          Date: "Wed, 17 Jun 2026 03:27:42 GMT",
        }),
      },
      data: Buffer.from("image-content"),
      proxy: true,
      resolveWithFullResponse: true,
    } as any)

    expect(request).toHaveBeenCalledTimes(1)
    const forwarded = request.mock.calls[0][0]
    expect(forwarded.url).toBe(`${currentOrigin}/api/network/forwardProxy`)
    expect(forwarded.method).toBe("POST")
    expect(forwarded.data.url).toBe("https://example-bucket.oss-cn-beijing.aliyuncs.com/test/image.jpg")
    expect(forwarded.data.headers[0]).toMatchObject({
      Host: "example-bucket.oss-cn-beijing.aliyuncs.com",
      Date: "Wed, 17 Jun 2026 03:27:42 GMT",
    })
    expect(forwarded.data.headers[0]["x-cors-headers"]).toBeUndefined()
  })

  it("does not use siyuan proxy when siyuan runtime is unavailable", async () => {
    const currentOrigin = "http://127.0.0.1:54277"
    const staleSavedOrigin = "http://127.0.0.1:51545"
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue({
      location: { origin: currentOrigin },
    } as any)

    const request = vi.fn().mockResolvedValue({
      status: 200,
      data: "direct-ok",
      config: {},
      request: {},
    })
    vi.spyOn(axios, "create").mockReturnValue({
      interceptors: {
        response: { use: vi.fn() },
        request: { use: vi.fn() },
      },
      request,
    } as any)

    const ctx = {
      getLogger: vi.fn(() => createLogger()),
      getConfig: vi.fn((name?: string) => (name === "siyuan.proxy" ? staleSavedOrigin : undefined)),
      i18n: { translate: vi.fn((key: string) => key) },
    } as any
    const wrapper = new PicGoRequestWrapper(ctx)

    await wrapper.PicGoRequest({
      method: "PUT",
      url: "https://example-bucket.oss-cn-beijing.aliyuncs.com/test/image.jpg",
      headers: {
        "Content-Type": "image/jpeg",
      },
      data: Buffer.from("image-content"),
      proxy: true,
      resolveWithFullResponse: true,
    } as any)

    expect(request).toHaveBeenCalledTimes(1)
    const direct = request.mock.calls[0][0]
    expect(direct.url).toBe("https://example-bucket.oss-cn-beijing.aliyuncs.com/test/image.jpg")
    expect(direct.url).not.toContain("/api/network/forwardProxy")
  })
})
