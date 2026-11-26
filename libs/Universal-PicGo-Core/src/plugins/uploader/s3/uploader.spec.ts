import { describe, expect, it } from "vitest"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import type { IAwsS3Config, IPicGo } from "../../../types"
import uploader from "./uploader"

function createCtx(response: unknown): IPicGo {
  return {
    request: async () => response,
    log: { error: () => undefined },
    i18n: { translate: (key: string) => key },
    getConfig: () => undefined,
  } as unknown as IPicGo
}

const awss3Config = {
  accessKeyID: "access-key",
  secretAccessKey: "secret-key",
  bucketName: "bucket",
  uploadPath: "{year}/{month}/{md5}.{extName}",
  region: "auto",
  endpoint: "https://s3.example.com",
} as IAwsS3Config

describe("S3 uploader HTTP handler", () => {
  it("deserializes a response whose headers are string arrays from the SiYuan proxy", async () => {
    // The SiYuan kernel forward proxy returns Go's http.Header shape: every header value is an array.
    const ctx = createCtx({
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": ["application/xml"],
        ETag: ['"fba9dede5f27731c9771645a39863328"'],
      },
      data: "",
    })
    const client = uploader.createS3Client(ctx, awss3Config)

    const output = await client.send(
      new PutObjectCommand({
        Bucket: "bucket",
        Key: "2026/11/image.png",
        Body: Buffer.from("image"),
      })
    )

    expect(output.ETag).toBe('"fba9dede5f27731c9771645a39863328"')
    expect(output.$metadata.httpStatusCode).toBe(200)
  })
})
