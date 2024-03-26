/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IAliyunConfig, IPicGo } from "../../../types"
import crypto from "crypto"
import mime from "mime-types"
import { IBuildInEvent } from "../../../utils/enums"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { AxiosRequestConfig } from "axios"
import { base64ToBuffer, safeParse } from "../../../utils/common"

// generate OSS signature
const generateSignature = (options: IAliyunConfig, fileName: string): string => {
  const date = new Date().toUTCString()
  const mimeType = mime.lookup(fileName)
  if (!mimeType) throw Error(`No mime type found for file ${fileName}`)

  const signString = `PUT\n\n${mimeType}\n${date}\n/${options.bucket}/${options.path}${fileName}`

  const signature = crypto.createHmac("sha1", options.accessKeySecret).update(signString).digest("base64")
  return `OSS ${options.accessKeyId}:${signature}`
}

const postOptions = (
  options: IAliyunConfig,
  fileName: string,
  signature: string,
  image: Buffer
): AxiosRequestConfig => {
  const xCorsHeaders = {
    Host: `${options.bucket}.${options.area}.aliyuncs.com`,
    Date: new Date().toUTCString(),
  }

  return {
    method: "PUT",
    url: `https://${options.bucket}.${options.area}.aliyuncs.com/${encodeURI(options.path)}${encodeURI(fileName)}`,
    headers: {
      Authorization: signature,
      "Content-Type": mime.lookup(fileName),
      "x-cors-headers": JSON.stringify(xCorsHeaders),
    },
    data: image,
    resolveWithFullResponse: true,
  } as AxiosRequestConfig
}

const handleWeb = async (ctx: IPicGo): Promise<IPicGo> => {
  const aliYunOptions = ctx.getConfig<IAliyunConfig>("picBed.aliyun")
  if (!aliYunOptions) {
    throw new Error("Can't find aliYun OSS config")
  }

  const imgList = ctx.output
  const customUrl = aliYunOptions.customUrl
  const path = aliYunOptions.path
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
        const signature = generateSignature(aliYunOptions, img.fileName)
        const options = postOptions(aliYunOptions, img.fileName, signature, image)
        const res: any = await ctx.request(options)
        const body = safeParse<any>(res)
        if (body.statusCode === 200) {
          delete img.base64Image
          delete img.buffer
          const optionUrl = aliYunOptions.options || ""
          if (customUrl) {
            img.imgUrl = `${customUrl}/${path}${img.fileName}${optionUrl}`
          } else {
            img.imgUrl = `https://${aliYunOptions.bucket}.${aliYunOptions.area}.aliyuncs.com/${path}${img.fileName}${optionUrl}`
          }
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

export { handleWeb }
