import { describe, expect, it } from "vitest"
import { digestHash } from "./cryptoUtil"

describe("digestHash", () => {
  it("hashes file names to the same md5 digests", () => {
    expect(digestHash("20240326111449.jpg", "md5", "hex")).toBe("5657a077c98978a6e0e1d3fca3448f88")
    expect(digestHash("图片-2024.png", "md5", "hex")).toBe("dcf85e78408501c6a5083fa287d040d1")
    expect(digestHash("", "md5", "hex")).toBe("d41d8cd98f00b204e9800998ecf8427e")
  })

  it("returns the same content digest for image bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 255, 254])
    expect(digestHash(bytes, "md5", "hex")).toBe("0c2d5a44c2fd824f95e50ac22b81f00c")
    expect(digestHash(bytes, "md5", "base64")).toBe("DC1aRML9gk+V5QrCK4HwDA==")
  })

  it("encodes unpaired UTF-16 surrogates as U+FFFD, matching Node crypto", () => {
    expect(digestHash("a\ud800b", "md5", "hex")).toBe("ff6405018d5ab2642e35fdba389b7c51")
  })
})
