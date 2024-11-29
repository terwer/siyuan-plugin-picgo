/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import crypto from "crypto"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { IPicGo, IPluginConfig, IUpyunConfig } from "../../../types"
import { base64ToBuffer, calculateMD5 } from "../../../utils/common"
import { IBuildInEvent } from "../../../utils/enums"
import { Buffer } from "../../../utils/nodePolyfill"
import { AxiosRequestConfig } from "axios"

function hmacsha1(secret: string, value: string) {
  return crypto.createHmac("sha1", secret).update(value, "utf8").digest().toString("base64")
}

/**
 * @param signKey
 * @param method 当前请求的 API 使用的方法
 * @param uri 当前请求的资源路径
 * @param date
 * @param policy
 * @param  contentMD5 内容的 md5 值
 */
const getSignature = (
  signKey: string,
  method: string,
  uri: string,
  date: string,
  policy: string,
  contentMD5 = null
) => {
  // https://help.upyun.com/knowledge-base/audit_authorization/#e6b3a8e6848fe4ba8be9a1b9
  // https://docs.upyun.com/api/form_api/
  // https://docs.upyun.com/api/authorization/#http-header
  // 签名计算方法
  //
  // Authorization: UPYUN <Operator>:<Signature>
  // Password = MD5(password)
  //
  // Signature = Base64 (HMAC-SHA1 (<Password>,
  // <Method>&
  // <URI>&
  // <Date>&
  // <Policy>&
  // <Content-MD5>
  // ))
  // 计算当前 api 请求签名信息
  let stringToSign = `${method}&${uri}&${date}&${policy}`
  if (contentMD5) {
    stringToSign += `&${contentMD5}`
  }

  return hmacsha1(signKey, stringToSign)
}

const postOptions = (options: IUpyunConfig, fileName: string, saveKey: string, image: Buffer): AxiosRequestConfig => {
  // 计算当前时间的时间戳（单位：秒）
  const currentTimeStamp = Math.floor(Date.now() / 1000)
  // 设置过期时间为30分钟后
  const expirationTime = currentTimeStamp + 30 * 60

  const date = new Date().toUTCString()

  const uploadArgs: any = {
    bucket: options.bucket,
    "save-key": saveKey,
    expiration: expirationTime.toString(),
    date: date,
  }
  const policy = Buffer.from(JSON.stringify(uploadArgs)).toString("base64")
  const password = calculateMD5(options.password)
  const signature = getSignature(password, "POST", `/${options.bucket}`, date, policy)

  const formData = new FormData()
  formData.append("authorization", `UPYUN ${options.operator}:${signature}`)
  formData.append("file", new Blob([image], { type: "image/png" }), fileName)
  formData.append("policy", policy)

  return {
    method: "POST",
    url: `https://v0.api.upyun.com/${options.bucket}`,
    headers: {
      // multipart/form-data 是自动设置的，这里不需要
      // "Content-Type": "multipart/form-data",
    },
    data: formData,
    resolveWithFullResponse: true,
  } as AxiosRequestConfig
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const upyunOptions = ctx.getConfig<IUpyunConfig>("picBed.upyun")
  if (!upyunOptions) {
    throw new Error("Can't find upYun config")
  }

  const imgList = ctx.output
  for (const img of imgList) {
    if (img.fileName) {
      let image = img.buffer
      if (!image && img.base64Image) {
        image = base64ToBuffer(img.base64Image)
      }
      if (!image) {
        ctx.log.error("Can not find image buffer")
        throw new Error("Can not find image buffer")
      }
      try {
        const path = upyunOptions.path || ""
        const saveKey = `${path}${img.fileName}${upyunOptions.options}`

        const options = postOptions(upyunOptions, img.fileName, saveKey, image)
        const res: any = await ctx.request(options)
        console.log("Using upyun SDK for upload, res=>", res)

        if (res) {
          delete img.base64Image
          delete img.buffer
          img.imgUrl = `${upyunOptions.url}/${saveKey}`
        } else {
          throw new Error("Upload failed")
        }
      } catch (e: any) {
        let errMsg: any
        if (e?.statusCode) {
          errMsg = e.response?.body?.message ?? e.stack ?? "unknown error"
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
  return ctx
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<IUpyunConfig>("picBed.upyun") || {}
  const config: IPluginConfig[] = [
    {
      name: "bucket",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_BUCKET")
      },
      default: userConfig.bucket || "",
      required: true,
    },
    {
      name: "operator",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_OPERATOR")
      },
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_OPERATOR")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_OPERATOR")
      },
      default: userConfig.operator || "",
      required: true,
    },
    {
      name: "password",
      type: "password",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_PASSWORD")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_PASSWORD")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_PASSWORD")
      },
      default: userConfig.password || "",
      required: true,
    },
    {
      name: "url",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_URL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_URL")
      },
      default: userConfig.url || "",
      required: true,
    },
    {
      name: "options",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_OPTIONS")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_OPTIONS")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_OPTIONS")
      },
      default: userConfig.options || "",
      required: false,
    },
    {
      name: "path",
      type: "input",
      get prefix() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_PATH")
      },
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_PATH")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN_MESSAGE_PATH")
      },
      default: userConfig.path || "",
      required: false,
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("upyun", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_UPYUN")
    },
    handle,
    config,
  })
}
