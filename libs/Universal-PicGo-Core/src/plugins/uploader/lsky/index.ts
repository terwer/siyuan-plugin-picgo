/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { ILskyConfig, IPicGo, IPluginConfig } from "../../../types"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { base64ToBuffer } from "../../../utils/common"
import { IBuildInEvent } from "../../../utils/enums"
import { AxiosRequestConfig } from "axios"
import { browserPathJoin } from "../../../utils/browserUtils"

const SIYUAN_PICGO_PLUGIN_LSKY_TOKEN_KEY = "siyuan_picgo_plugin_lsky_token"

const getToken = async (ctx: IPicGo, lskyOptions: ILskyConfig): Promise<string> => {
  // 先查询配置，存在直接返回
  let token = window.localStorage.getItem(SIYUAN_PICGO_PLUGIN_LSKY_TOKEN_KEY) ?? ""
  // token 不存在，则调用接口生成 token 并存储
  if (token.trim().length == 0) {
    const formData = new FormData()
    formData.append("email", lskyOptions.email)
    formData.append("password", lskyOptions.password)
    const res = (await ctx.request({
      method: "POST",
      url: browserPathJoin(lskyOptions.server, "/api/v1/tokens"),
      data: formData,
    })) as any

    if (!res.status) {
      throw new Error("lsky token get error")
    }
    token = res.data.token
    window.localStorage.setItem(SIYUAN_PICGO_PLUGIN_LSKY_TOKEN_KEY, token)
  }

  return token
}

const postOptions = (lskyOptions: ILskyConfig, fileName: string, token: string, image: Buffer): AxiosRequestConfig => {
  const formData = new FormData()
  formData.append("file", new Blob([image], { type: "image/png" }), fileName)

  // 策略可选
  const strategyId = lskyOptions.strategyId ?? ""
  if (strategyId.trim().length > 0) {
    formData.append("strategy_id", strategyId)
  }

  return {
    method: "POST",
    url: browserPathJoin(lskyOptions.server, "/api/v1/upload"),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // multipart/form-data 是自动设置的，这里不需要
      // "content-type": "multipart/form-data",
    },
    data: formData,
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const lskyOptions = ctx.getConfig<ILskyConfig>("picBed.lsky")
  if (!lskyOptions) {
    throw new Error("Can't find lsky config")
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
        const token = await getToken(ctx, lskyOptions)
        const options = postOptions(lskyOptions, img.fileName, token, image)
        const res: any = await ctx.request(options)

        if (res.status) {
          delete img.base64Image
          delete img.buffer
          img.imgUrl = res.data.links.url
        } else {
          throw new Error("Server error, please try again =>" + res.message)
        }
      } catch (e: any) {
        console.log("lsky error")
        console.log(e)

        let errMsg: any
        if (e?.statusCode) {
          errMsg = e.response?.body?.message ?? e.response?.body ?? e.stack ?? "unknown error"
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
  const userConfig = ctx.getConfig<ILskyConfig>("picBed.lsky") || {}
  const config: IPluginConfig[] = [
    {
      name: "server",
      type: "input",
      default: userConfig.server || "",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_SERVER")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_MESSAGE_SERVER")
      },
      required: true,
    },
    {
      name: "email",
      type: "input",
      default: userConfig.email || "",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_EMAIL")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_MESSAGE_EMAIL")
      },
      required: true,
    },
    {
      name: "password",
      type: "password",
      default: userConfig.password || "",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_PASSWORD")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_MESSAGE_PASSWORD")
      },
      required: true,
    },
    {
      name: "strategyId",
      type: "input",
      default: userConfig.strategyId || "",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_STRATEGYID")
      },
      get message() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_ISKY_MESSAGE_STRATEGYID")
      },
      required: false,
    },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("lsky", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_LSKY")
    },
    handle,
    config,
  })
}
