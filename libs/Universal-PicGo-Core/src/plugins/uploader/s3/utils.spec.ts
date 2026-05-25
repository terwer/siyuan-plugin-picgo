import { describe, expect, it } from "vitest"
import { extractInfo } from "./utils"

describe("S3 extractInfo", () => {
  it("extracts content type from data URL", async () => {
    const info = await extractInfo({
      base64Image: "data:image/png;base64,iVBORw0KGgo=",
    } as any)

    expect(info.contentType).toBe("image/png")
    expect(info.contentEncoding).toBe("base64")
    expect(info.body?.length).toBeGreaterThan(0)
  })

  it("sniffs common image MIME types without file-type", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00])
    const gif = Buffer.from("GIF89a", "ascii")
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', "utf8")

    await expect(extractInfo({ buffer: png } as any)).resolves.toMatchObject({ contentType: "image/png" })
    await expect(extractInfo({ buffer: jpeg } as any)).resolves.toMatchObject({ contentType: "image/jpeg" })
    await expect(extractInfo({ buffer: gif } as any)).resolves.toMatchObject({ contentType: "image/gif" })
    await expect(extractInfo({ buffer: svg } as any)).resolves.toMatchObject({ contentType: "image/svg+xml" })
  })
})
