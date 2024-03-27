// noinspection ExceptionCaughtLocallyJS,SuspiciousTypeOfGuard

/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IImgurConfig, IPicGo, IPluginConfig } from "../../types"
import { IBuildInEvent } from "../../utils/enums"
import { ILocalesKey } from "../../i18n/zh-CN"
import { AxiosRequestConfig } from "axios"
import { bufferToBase64 } from "../../utils/common"

const postOptions = (options: IImgurConfig, fileName: string, imgBase64: string): AxiosRequestConfig => {
  const clientId = options.clientId

  const formData = new FormData()
  formData.append("image", imgBase64)
  formData.append("type", "base64")

  return {
    method: "POST",
    url: "https://api.imgur.com/3/image",
    headers: {
      Authorization: `Client-ID ${clientId}`,
      "content-type": "multipart/form-data",
      // Host: "api.imgur.com",
      // "User-Agent": "PicGo",
    },
    data: formData,
  }
}

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const imgurOptions = ctx.getConfig<IImgurConfig>("picBed.imgur")
  if (!imgurOptions) {
    throw new Error("Can't find imgur config")
  }

  const imgList = ctx.output
  for (const img of imgList) {
    if (img.fileName) {
      let base64Image = img.base64Image
      if (!base64Image && img.buffer) {
        base64Image = bufferToBase64(img.buffer)
      }
      if (!base64Image) {
        ctx.log.error("Can not find image base64")
        throw new Error("Can not find image base64")
      }
      const options = postOptions(imgurOptions, img.fileName, base64Image)
      try {
        const res: string = await ctx.request(options)
        const body = typeof res === "string" ? JSON.parse(res) : res
        if (body.success) {
          delete img.base64Image
          delete img.buffer
          img.imgUrl = body.data.link
        } else {
          throw new Error("Server error, please try again")
        }
      } catch (e: any) {
        let errMsg: any
        ctx.emit(IBuildInEvent.NOTIFICATION, {
          title: ctx.i18n.translate<ILocalesKey>("UPLOAD_FAILED"),
          body: ctx.i18n.translate<ILocalesKey>("CHECK_SETTINGS_AND_NETWORK"),
          text: "http://docs.imgur.com/api/errno/",
        })
        if (e?.statusCode) {
          errMsg = e.response?.body?.data.error ?? e.response?.body?.data ?? e.stack ?? "unknown error"
        } else {
          errMsg = e.toString()
        }
        ctx.log.error(errMsg)
        throw errMsg
      }
    }
  }
  return ctx
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  const userConfig = ctx.getConfig<IImgurConfig>("picBed.imgur") || {}
  const config: IPluginConfig[] = [
    {
      name: "clientId",
      type: "input",
      get alias() {
        return ctx.i18n.translate<ILocalesKey>("PICBED_IMGUR_CLIENTID")
      },
      default: userConfig.clientId || "",
      required: true,
    },
    // use universal proxy instead
    // {
    //   name: "proxy",
    //   type: "input",
    //   get prefix() {
    //     return ctx.i18n.translate<ILocalesKey>("PICBED_IMGUR_PROXY")
    //   },
    //   get alias() {
    //     return ctx.i18n.translate<ILocalesKey>("PICBED_IMGUR_PROXY")
    //   },
    //   get message() {
    //     return ctx.i18n.translate<ILocalesKey>("PICBED_IMGUR_MESSAGE_PROXY")
    //   },
    //   default: userConfig.proxy || "",
    //   required: false,
    // },
  ]
  return config
}

export default function register(ctx: IPicGo): void {
  ctx.helper.uploader.register("imgur", {
    get name() {
      return ctx.i18n.translate<ILocalesKey>("PICBED_IMGUR")
    },
    handle,
    config,
  })
}
