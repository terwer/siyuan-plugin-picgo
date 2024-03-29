/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import crypto from "crypto"
import { ILocalesKey } from "../../i18n/zh-CN"
import { IPicGo, IPluginConfig, ITcyunConfig } from "../../types"
import mime from "mime-types"
import { Buffer } from "../../utils/nodePolyfill"
import { AxiosRequestConfig } from "axios"
import { base64ToBuffer, safeParse } from "../../utils/common"
import { IBuildInEvent } from "../../utils/enums"

// generate COS signature string

export interface ISignature {
  signature: string
  appId: string
  bucket: string
  signTime: string
}

const generateSignature = (options: ITcyunConfig, fileName: string): ISignature => {
  const secretId = options.secretId
  const secretKey = options.secretKey
  const appId = options.appId
  const bucket = options.bucket
  let signature
  let signTime = ""
  if (!options.version || options.version === "v4") {
    const random = Math.floor(Math.random() * 10000000000)
    const current = Math.floor(new Date().getTime() / 1000) - 1
    const expired = current + 3600

    const multiSignature = `a=${appId}&b=${bucket}&k=${secretId}&e=${expired}&t=${current}&r=${random}&f=`

    const signHexKey = crypto.createHmac("sha1", secretKey).update(multiSignature).digest()
    const tempString = Buffer.concat([signHexKey, Buffer.from(multiSignature)])
    signature = Buffer.from(tempString).toString("base64")
  } else {
    // https://cloud.tencent.com/document/product/436/7778#signature
    const today = Math.floor(new Date().getTime() / 1000)
    const tomorrow = today + 86400
    signTime = `${today};${tomorrow}`
    const signKey = crypto.createHmac("sha1", secretKey).update(signTime).digest("hex")
    const httpString = `put\n/${options.path}${fileName}\n\nhost=${options.bucket}.cos.${options.area}.myqcloud.com\n`
    const sha1edHttpString = crypto.createHash("sha1").update(httpString).digest("hex")
    const stringToSign = `sha1\n${signTime}\n${sha1edHttpString}\n`
    signature = crypto.createHmac("sha1", signKey).update(stringToSign).digest("hex")
  }
  return {
    signature,
    appId,
    bucket,
    signTime,
  }
}

const postOptions = (
  options: ITcyunConfig,
  fileName: string,
  signature: ISignature,
  image: Buffer,
  version: string
): AxiosRequestConfig => {
  const area = options.area
  const path = options.path
  if (!options.version || options.version === "v4") {
    return {
      method: "POST",
      url: `http://${area}.file.myqcloud.com/files/v2/${signature.appId}/${signature.bucket}/${encodeURI(
        path
      )}${fileName}`,
      headers: {
        // Host: `${area}.file.myqcloud.com`,
        Authorization: signature.signature,
        // multipart/form-data 是自动设置的，这里不需要
        // contentType: "multipart/form-data",
        userAgent: `PicGo;${version};null;null`,
      },
      data: {
        op: "upload",
        filecontent: image,
      },
      resolveWithFullResponse: true,
    } as AxiosRequestConfig
  } else {
    return {
      method: "PUT",
      url: `http://${options.bucket}.cos.${options.area}.myqcloud.com/${encodeURIComponent(path)}${encodeURIComponent(
        fileName
      )}`,
      headers: {
        // Host: `${options.bucket}.cos.${options.area}.myqcloud.com`,
        Authorization: `q-sign-algorithm=sha1&q-ak=${options.secretId}&q-sign-time=${signature.signTime}&q-key-time=${signature.signTime}&q-header-list=host&q-url-param-list=&q-signature=${signature.signature}`,
        contentType: mime.lookup(fileName),
        userAgent: `PicGo;${version};null;null`,
      },
      data: image,
      resolveWithFullResponse: true,
    } as AxiosRequestConfig
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo | boolean> => {
  const tcYunOptions = ctx.getConfig<ITcyunConfig>("picBed.tcyun")
  if (!tcYunOptions) {
    throw new Error("Can't find tencent COS config")
  }

  const imgList = ctx.output
  const customUrl = tcYunOptions.customUrl
  const path = tcYunOptions.path
  const useV4 = !tcYunOptions.version || tcYunOptions.version === "v4"

  for (const img of imgList) {
    if (img.fileName) {
      const signature = generateSignature(tcYunOptions, img.fileName)
      if (!signature) {
        return false
      }

      let image = img.buffer
      if (!image && img.base64Image) {
        image = base64ToBuffer(img.base64Image)
      }
      if (!image) {
        ctx.log.error("Can not find image buffer")
        throw new Error("Can not find image buffer")
      }

      const options = postOptions(tcYunOptions, img.fileName, signature, image, ctx.VERSION)
      try {
        const res: any = await ctx.request(options)

        let body
        if (useV4 && typeof res === "string") {
          body = safeParse<any>(res)
        } else {
          body = res
        }
        if (body.statusCode === 400) {
          if (body?.body?.err) {
            throw body.body.err
          } else {
            throw new Error(body?.body?.msg || body?.body?.message)
          }
        }
        const optionUrl = tcYunOptions.options || ""
        if (useV4 && body.message === "SUCCESS") {
          delete img.base64Image
          delete img.buffer
          if (customUrl) {
            img.imgUrl = `${customUrl}/${path}${img.fileName}`
          } else {
            img.imgUrl = `${body.data.source_url as string}${optionUrl}`
          }
        } else if (!useV4 && body && body.statusCode === 200) {
          delete img.base64Image
          delete img.buffer
          if (customUrl) {
            img.imgUrl = `${customUrl}/${encodeURI(path)}${encodeURI(img.fileName)}${optionUrl}`
          } else {
            img.imgUrl = `https://${tcYunOptions.bucket}.cos.${tcYunOptions.area}.myqcloud.com/${encodeURI(
              path
            )}${encodeURI(img.fileName)}${optionUrl}`
          }
        } else {
          throw new Error(res.body.msg)
        }
      } catch (e: any) {
        if (!tcYunOptions.version || tcYunOptions.version === "v4") {
          const errObj = safeParse<any>(e.error)
          ctx.emit(IBuildInEvent.NOTIFICATION, {
            title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
            body: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED_REASON", {
              code: errObj.code as string,
            }),
            text: "https://cloud.tencent.com/document/product/436/8432",
          })
        } else {
          let errMsg: any
          if (e?.statusCode) {
            errMsg = e.response?.body ?? e.stack ?? "unknown error"
          } else {
            errMsg = e.toString()
          }
          ctx.log.error(errMsg)
          ctx.emit(IBuildInEvent.NOTIFICATION, {
            title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
            body: ctx.i18n.translate<ILocalesKey>("CHECK_SETTINGS"),
          })
          throw errMsg
        }
      }
    }
  }
  return ctx
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<ITcyunConfig>("picBed.tcyun") || {}
  const config: IPluginConfig[] = [
    {
      name: "version",
      type: "list",
      alias: ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_VERSION"),
      choices: ["v4", "v5"],
      default: "v5",
      required: false,
    },
    {
      name: "secretId",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_SECRETID")
      },
      default: userConfig.secretId || "",
      required: true,
    },
    {
      name: "secretKey",
      type: "password",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_SECRETKEY")
      },
      default: userConfig.secretKey || "",
      required: true,
    },
    {
      name: "bucket",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_BUCKET")
      },
      default: userConfig.bucket || "",
      required: true,
    },
    {
      name: "appId",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_APPID")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_APPID")
      },
      default: userConfig.appId || "",
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_MESSAGE_APPID")
      },
      required: true,
    },
    {
      name: "area",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_AREA")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_AREA")
      },
      default: userConfig.area || "",
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_MESSAGE_AREA")
      },
      required: true,
    },
    {
      name: "path",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_PATH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_PATH")
      },
      default: userConfig.path || "",
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_MESSAGE_PATH")
      },
      required: false,
    },
    {
      name: "customUrl",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_CUSTOMURL")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_CUSTOMURL")
      },
      default: userConfig.customUrl || "",
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_MESSAGE_CUSTOMURL")
      },
      required: false,
    },
    {
      name: "options",
      type: "input",
      default: userConfig.options || "",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_OPTIONS")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_OPTIONS")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD_MESSAGE_OPTIONS")
      },
      required: false,
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("tcyun", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_TENCENTCLOUD")
    },
    handle,
    config,
  })
}
