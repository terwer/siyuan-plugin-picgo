import { IImgInfo } from "../../../types"
import { lookupMimeType } from "../../../utils/mimeLookup"
import { digestHash } from "../../../utils/cryptoUtil"

class FileNameGenerator {
  date: Date
  info: IImgInfo

  static fields = [
    "year", // 当前日期 - 年
    "month", // 当前日期 - 月
    "day", // 当前日期 - 日
    "fullName", // 文件名, 包含扩展名
    "fileName", // 文件名, 不包含扩展名
    "extName", // 扩展名
    "md5", // md5
    "md5B64", // md5 base64
    "md5B64Short", // md5 base64 short
    "sha1", // sha1
    "sha256", // sha256
    "timestamp", // 当前时间戳, 秒
    "timestampMS", // 当前时间戳, 毫秒
  ]

  constructor(info: IImgInfo) {
    this.date = new Date()
    this.info = info
  }

  public year(): string {
    return `${this.date.getFullYear()}`
  }

  public month(): string {
    return (this.date.getMonth() + 1).toString().padStart(2, "0")
  }

  public day(): string {
    return this.date.getDate().toString().padStart(2, "0")
  }

  public fullName(): string | undefined {
    return this.info.fileName
  }

  public fileName(): string {
    return (this.info.fileName ?? "").replace(this.info.extname ?? "", "")
  }

  public extName(): string {
    return (this.info.extname ?? "").replace(".", "")
  }

  public md5(): string {
    return digestHash(this.imgBuffer()!, "md5", "hex")
  }

  public md5B64(): string {
    return digestHash(this.imgBuffer()!, "md5", "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  public md5B64Short(): string {
    return digestHash(this.imgBuffer()!, "md5", "base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .slice(0, 7)
  }

  public sha1(): string {
    return digestHash(this.imgBuffer()!, "sha1", "hex")
  }

  public sha256(): string {
    return digestHash(this.imgBuffer()!, "sha256", "hex")
  }

  public timestamp(): string {
    return Math.floor(Date.now() / 1000).toString()
  }

  public timestampMS(): string {
    return Date.now().toString()
  }

  private imgBuffer(): string | undefined {
    return this.info.base64Image ? this.info.base64Image : this.info.buffer?.toString()
  }
}

export function formatPath(info: IImgInfo, format?: string): string {
  if (!format) {
    return info.fileName!
  }

  const fileNameGenerator = new FileNameGenerator(info)

  let formatPath: string = format

  for (const key of FileNameGenerator.fields) {
    const re = new RegExp(`{${key}}`, "g")
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    formatPath = formatPath.replace(re, fileNameGenerator[key]())
  }

  return formatPath
}

export async function extractInfo(info: IImgInfo): Promise<{
  body?: Buffer
  contentType?: string
  contentEncoding?: string
}> {
  const result: {
    body?: Buffer
    contentType?: string
    contentEncoding?: string
  } = {}

  if (info.base64Image) {
    const commaIndex = info.base64Image.indexOf(",")
    const header = commaIndex >= 0 ? info.base64Image.slice(0, commaIndex) : ""
    const body = commaIndex >= 0 ? info.base64Image.slice(commaIndex + 1) : info.base64Image
    result.contentType = header.match(/^data:([\w/+.-]+);base64$/)?.[1]
    result.body = Buffer.from(body, "base64")
    result.contentEncoding = "base64"
  } else {
    if (info.extname) {
      result.contentType = lookupMimeType(info.extname)
    }
    result.body = info.buffer
  }

  // Browser-safe fallback without pulling file-type/strtok3 stream probes into bundles.
  if (!result.contentType && result.body) {
    result.contentType = sniffImageMime(result.body)
  }

  return result
}

function sniffImageMime(body: Buffer): string | undefined {
  if (body.length >= 8) {
    if (
      body[0] === 0x89 &&
      body[1] === 0x50 &&
      body[2] === 0x4e &&
      body[3] === 0x47 &&
      body[4] === 0x0d &&
      body[5] === 0x0a &&
      body[6] === 0x1a &&
      body[7] === 0x0a
    ) {
      return "image/png"
    }
    if (body.slice(0, 4).toString("ascii") === "RIFF" && body.slice(8, 12).toString("ascii") === "WEBP") {
      return "image/webp"
    }
  }

  if (body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
    return "image/jpeg"
  }
  if (body.length >= 6) {
    const gifHeader = body.slice(0, 6).toString("ascii")
    if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
      return "image/gif"
    }
  }
  if (body.length >= 2 && body[0] === 0x42 && body[1] === 0x4d) {
    return "image/bmp"
  }
  if (body.length >= 4) {
    if (body[0] === 0x00 && body[1] === 0x00 && body[2] === 0x01 && body[3] === 0x00) {
      return "image/x-icon"
    }
    if (
      (body[0] === 0x49 && body[1] === 0x49 && body[2] === 0x2a && body[3] === 0x00) ||
      (body[0] === 0x4d && body[1] === 0x4d && body[2] === 0x00 && body[3] === 0x2a)
    ) {
      return "image/tiff"
    }
  }

  const head = body.slice(0, Math.min(body.length, 512)).toString("utf8").trimStart().toLowerCase()
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return "image/svg+xml"
  }

  return undefined
}
