import { Buffer } from "./nodePolyfill"
import md5 from "js-md5"
import hash from "hash.js"

type HashAlgorithm = "md5" | "sha1" | "sha256"
type DigestEncoding = "hex" | "base64" | undefined

function toHashInput(input: string | Buffer | Uint8Array): string | number[] {
  if (typeof input === "string") {
    return input
  }
  return Array.from(input)
}

function toBase64(bytes: number[] | Uint8Array): string {
  return Buffer.from(bytes).toString("base64")
}

export function digestHash(input: string | Buffer | Uint8Array, algorithm: HashAlgorithm, encoding: DigestEncoding): string {
  const data = toHashInput(input)

  if (algorithm === "md5") {
    const md5Api = md5 as any
    if (encoding === "base64") {
      return md5Api.base64(data)
    }
    return md5Api.hex(data)
  }

  const instance = algorithm === "sha1" ? hash.sha1() : hash.sha256()
  instance.update(data as any)
  if (encoding === "base64") {
    return toBase64(instance.digest())
  }
  return instance.digest("hex")
}

export function digestHmacSha1(
  key: string | Buffer | Uint8Array,
  value: string | Buffer | Uint8Array,
  encoding: DigestEncoding
): string | Buffer {
  const hashApi = hash as any
  const hmac = hashApi.hmac(hashApi.sha1, toHashInput(key))
  hmac.update(toHashInput(value) as any)
  if (encoding === "base64") {
    return toBase64(hmac.digest())
  }
  if (encoding === "hex") {
    return hmac.digest("hex")
  }
  return Buffer.from(hmac.digest())
}
