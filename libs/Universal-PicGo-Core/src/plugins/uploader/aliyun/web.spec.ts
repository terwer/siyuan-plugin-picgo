import { createHmac } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import { handleWeb } from "./web"
import { IPicGo } from "../../../types"

const createCtx = (request = vi.fn().mockResolvedValue({ statusCode: 200 })) => {
  const config = {
    accessKeyId: "testAccessKeyId",
    accessKeySecret: "testAccessKeySecret",
    bucket: "example-bucket",
    area: "oss-cn-beijing",
    path: "test/",
  }

  return {
    output: [
      {
        fileName: "image.jpg",
        buffer: Buffer.from("image-content"),
      },
    ],
    getConfig: vi.fn((name?: string) => (name === "picBed.aliyun" ? config : undefined)),
    request,
    log: {
      error: vi.fn(),
    },
    emit: vi.fn(),
    i18n: {
      translate: vi.fn((key: string) => key),
    },
  } as unknown as IPicGo
}

describe("aliyun web uploader", () => {
  it("uses the same Date header for OSS V1 signature and request headers", async () => {
    const fixedDate = "Wed, 17 Jun 2026 03:27:42 GMT"
    vi.useFakeTimers()
    vi.setSystemTime(new Date(fixedDate))

    try {
      const request = vi.fn().mockResolvedValue({ statusCode: 200 })
      const ctx = createCtx(request)

      await handleWeb(ctx)

      expect(request).toHaveBeenCalledTimes(1)
      const options = request.mock.calls[0][0]
      expect(options.proxy).toBe(true)
      expect(options.headers.Date).toBe(fixedDate)
      expect(JSON.parse(options.headers["x-cors-headers"])).toMatchObject({
        Host: "example-bucket.oss-cn-beijing.aliyuncs.com",
        Date: fixedDate,
      })
      const signString = `PUT\n\nimage/jpeg\n${fixedDate}\n/example-bucket/test/image.jpg`
      const expectedSignature = createHmac("sha1", "testAccessKeySecret").update(signString).digest("base64")
      expect(options.headers.Authorization).toBe(`OSS testAccessKeyId:${expectedSignature}`)
    } finally {
      vi.useRealTimers()
    }
  })
})
