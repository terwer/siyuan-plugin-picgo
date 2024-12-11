import {
  S3Client,
  S3ClientConfig,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandOutput,
  ObjectCannedACL,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { HttpRequest, HttpResponse } from "@smithy/protocol-http"
import { HttpHandlerOptions } from "@smithy/types"
import { buildQueryString } from "@smithy/querystring-builder"
import { FetchHttpHandler, FetchHttpHandlerOptions } from "@smithy/fetch-http-handler"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import url from "url"
import https from "https"
import { IAwsS3Config, IImgInfo, IPicGo } from "../../../types"
import { extractInfo } from "./utils"

////////////////////////////////////////////////////////////////////////////////
// special handler using ctx.request
////////////////////////////////////////////////////////////////////////////////

/**
 * This is close to origin implementation of FetchHttpHandler, but this uses ctx.request instead.
 * https://github.com/aws/aws-sdk-js-v3/tree/main/packages/xhr-http-handler
 */
class PicGoHttpHandler extends FetchHttpHandler {
  requestTimeoutInMs: number | undefined
  rejectUnauthorized: boolean
  corsProxy: boolean
  ctx: IPicGo

  constructor(ctx: IPicGo, options?: FetchHttpHandlerOptions, rejectUnauthorized?: boolean, corsProxy?: boolean) {
    super(options)
    this.ctx = ctx
    this.rejectUnauthorized = rejectUnauthorized ?? false
    this.corsProxy = corsProxy ?? false
    this.requestTimeoutInMs = options === undefined ? undefined : options.requestTimeout
  }

  async handle(request: HttpRequest, { abortSignal }: HttpHandlerOptions = {}): Promise<{ response: HttpResponse }> {
    if (abortSignal?.aborted) {
      const abortError = new Error("Request aborted")
      abortError.name = "AbortError"
      return Promise.reject(abortError)
    }

    let path = request.path
    if (request.query) {
      const queryString = buildQueryString(request.query)
      if (queryString) {
        path += `?${queryString}`
      }
    }

    const { port, method } = request
    const url = `${request.protocol}//${request.hostname}${port ? `:${port}` : ""}${path}`
    const body = method === "GET" || method === "HEAD" ? undefined : request.body

    const transformedHeaders: Record<string, string> = {}
    for (const key of Object.keys(request.headers)) {
      const keyLower = key.toLowerCase()
      if (keyLower === "host" || keyLower === "content-length") {
        continue
      }
      transformedHeaders[key.toLowerCase()] = request.headers[key]
    }

    let transformedBody: any = body
    if (ArrayBuffer.isView(body)) {
      transformedBody = bufferToArrayBuffer(body)
    }

    const param: AxiosRequestConfig = {
      method: method,
      url: url,
      headers: transformedHeaders,
      data: transformedBody,
      timeout: this.requestTimeoutInMs,
      httpsAgent: new https.Agent({
        rejectUnauthorized: this.rejectUnauthorized,
      }),
      resolveWithFullResponse: true,
    } as AxiosRequestConfig
    if (!this.corsProxy) {
      param.proxy = false
    }

    const raceOfPromises = [
      this.ctx.request(param).then((rsp: any) => {
        const resp = rsp as AxiosResponse
        const headers = resp.headers
        const headersLower: Record<string, string> = {}
        for (const key of Object.keys(headers)) {
          headersLower[key.toLowerCase()] = headers[key]
        }

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(resp.data))
            controller.close()
          },
        })

        return {
          response: new HttpResponse({
            statusCode: resp.status,
            reason: resp.statusText,
            headers: headersLower,
            body: stream,
          }),
        }
      }),
    ]

    if (abortSignal) {
      raceOfPromises.push(
        new Promise<never>((resolve, reject) => {
          abortSignal.onabort = () => {
            const abortError = new Error("Request aborted")
            abortError.name = "AbortError"
            reject(abortError)
          }
        })
      )
    }

    return Promise.race(raceOfPromises)
  }
}

const bufferToArrayBuffer = (b: Buffer | Uint8Array | ArrayBufferView) => {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
}

export interface IUploadResult {
  index: number
  key: string
  url: string
  imgURL: string
  versionId?: string
  eTag?: string
}

function createS3Client(ctx: IPicGo, opts: IAwsS3Config): S3Client {
  let sslEnabled = true
  try {
    const u = new url.URL(opts.endpoint!)
    sslEnabled = u.protocol === "https:"
  } catch {
    // eslint-disable-next-line no-empty
  }

  const clientOptions: S3ClientConfig = {
    region: opts.region || "auto",
    endpoint: opts.endpoint || undefined,
    credentials: {
      accessKeyId: opts.accessKeyID,
      secretAccessKey: opts.secretAccessKey,
    },
    tls: sslEnabled,
    forcePathStyle: opts.pathStyleAccess,

    // By default, it's NodeHttpHandler from "@smithy/node-http-handler"
    requestHandler: new PicGoHttpHandler(ctx, { keepAlive: false }, opts.rejectUnauthorized, opts.corsProxy),
  }

  const client = new S3Client(clientOptions)
  return client
}

interface createUploadTaskOpts {
  client: S3Client
  bucketName: string
  path: string
  item: IImgInfo
  index: number
  acl: ObjectCannedACL | undefined
  customUrl?: string
  corsProxy?: boolean
}

async function createUploadTask(opts: createUploadTaskOpts): Promise<IUploadResult> {
  if (!opts.item.buffer && !opts.item.base64Image) {
    return Promise.reject(new Error("undefined image"))
  }

  let body: Buffer | undefined
  let contentType: string | undefined
  let contentEncoding: string | undefined

  try {
    ;({ body, contentType, contentEncoding } = await extractInfo(opts.item))
  } catch (err) {
    return Promise.reject(err)
  }

  const command = new PutObjectCommand({
    Bucket: opts.bucketName,
    Key: opts.path,
    ACL: opts.acl,
    Body: body,
    ContentType: contentType,
    ContentEncoding: contentEncoding,
  })

  let output: PutObjectCommandOutput
  try {
    output = await opts.client.send(command)
  } catch (err) {
    return Promise.reject(err)
  }

  let url: string
  if (!opts.customUrl) {
    try {
      url = await getFileURL(opts, output.ETag!, output.VersionId!)
    } catch (err) {
      return Promise.reject(err)
    }
  } else {
    url = opts.customUrl.replace(/{bucketName}/g, opts.bucketName).replace(/{uploadPath}/g, opts.path)
  }

  return {
    index: opts.index,
    key: opts.path,
    url: url,
    imgURL: url,
    versionId: output.VersionId,
    eTag: output.ETag,
  }
}

async function getFileURL(opts: createUploadTaskOpts, eTag: string, versionId: string): Promise<string> {
  try {
    const signedUrl = await getSignedUrl(
      opts.client,
      new GetObjectCommand({
        Bucket: opts.bucketName,
        Key: opts.path,
        IfMatch: eTag,
        VersionId: versionId,
      }),
      { expiresIn: 3600 }
    )
    const urlObject = new url.URL(signedUrl)
    urlObject.search = ""
    return urlObject.href
  } catch (err) {
    return Promise.reject(err)
  }
}

export default {
  createS3Client,
  createUploadTask,
  getFileURL,
}
