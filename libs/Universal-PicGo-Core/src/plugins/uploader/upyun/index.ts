/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILocalesKey } from "../../../i18n/zh-CN"
import { IPicGo, IPluginConfig, IUpyunConfig } from "../../../types"
import upyun from "upyun"
import { base64ToBuffer } from "../../../utils/common"
import { IBuildInEvent } from "../../../utils/enums"
import crypto from "crypto"
import { Buffer } from "../../../utils/nodePolyfill"
import { win } from "universal-picgo-store/src"

/**
 * @param  service Service 实例
 * @param method 当前请求的 API 使用的方法
 * @param  path 当前请求的资源路径
 * @param  contentMD5 内容的 md5 值
 */
const getSignHeader = (
  service: {
    bucketName: string
    operatorName: string
    password: string
    serviceName: string
  },
  method: string,
  path: string,
  contentMD5: string | null = null
) => {
  // https://docs.upyun.com/api/form_api/
  // https://docs.upyun.com/api/authorization/#http-header
  // 签名计算方法
  //
  // Authorization: UPYUN <Operator>:<Signature>
  // Password = MD5(password)
  //
  // <Signature> = Base64 (HMAC-SHA1 (<Password>,
  // <Method>&
  // <URI>&
  // <Date>&
  // <Content-MD5>
  // ))
  // 计算当前 api 请求签名信息

  // service 的 password 已经是 md5 了
  const { operatorName, password } = service
  const date = new Date().toUTCString()

  let signString = `${method}&${path}&${date}`
  if (contentMD5) {
    signString += `&${contentMD5}`
  }

  const signBinary = crypto.createHmac("sha1", password).update(signString).digest("binary")
  debugger
  const signature = win.Buffer.from(signBinary).toString("base64")
  debugger

  return {
    "x-date": date,
    Authorization: `UPYUN ${operatorName}:${signature}`,
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const upyunOptions = ctx.getConfig<IUpyunConfig>("picBed.upyun")
  if (!upyunOptions) {
    throw new Error("Can't find upYun config")
  }

  const serviceName = upyunOptions.bucket
  const operatorName = upyunOptions.operator
  const operatorPassword = upyunOptions.password

  const service = new upyun.Service(serviceName, operatorName, operatorPassword)
  const client = new upyun.Client(service, getSignHeader)

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
        const remotePath = `${path}${img.fileName}${upyunOptions.options}`

        const res: any = await client.putFile(remotePath, new Blob([image]))
        console.log("Using upyun SDK for upload, res=>", res)

        if (res) {
          delete img.base64Image
          delete img.buffer
          img.imgUrl = `${upyunOptions.url}/${path}${img.fileName}${upyunOptions.options}`
        } else {
          throw new Error("Upload failed")
        }
      } catch (e: any) {
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
