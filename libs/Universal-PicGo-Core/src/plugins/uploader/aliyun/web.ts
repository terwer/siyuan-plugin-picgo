/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IAliyunConfig, IPicGo } from "../../../types"
import { IBuildInEvent } from "../../../utils/enums"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { AxiosRequestConfig } from "axios"
import { base64ToBuffer, safeParse } from "../../../utils/common"
import { lookupMimeType } from "../../../utils/mimeLookup"
import { digestHmacSha1 } from "../../../utils/cryptoUtil"

// generate OSS signature
const generateSignature = (options: IAliyunConfig, fileName: string, date: string): string => {
  const mimeType = lookupMimeType(fileName)
  if (!mimeType) throw Error(`No mime type found for file ${fileName}`)

  const signString = `PUT\n\n${mimeType}\n${date}\n/${options.bucket}/${options.path}${fileName}`

  const signature = digestHmacSha1(options.accessKeySecret, signString, "base64")
  return `OSS ${options.accessKeyId}:${signature}`
}

const postOptions = (
  options: IAliyunConfig,
  fileName: string,
  signature: string,
  image: Buffer,
  date: string
): AxiosRequestConfig => {
  const host = `${options.bucket}.${options.area}.aliyuncs.com`

  const requestOptions: any = {
    method: "PUT",
    url: `https://${host}/${encodeURI(options.path)}${encodeURI(fileName)}`,
    headers: {
      Authorization: signature,
      "Content-Type": lookupMimeType(fileName),
      Date: date,
      "x-cors-headers": JSON.stringify({
        Host: host,
        Date: date,
      }),
    },
    data: image,
    proxy: true,
    resolveWithFullResponse: true,
  }

  return requestOptions as AxiosRequestConfig
}

const handleWeb = async (ctx: IPicGo): Promise<IPicGo> => {
  const aliYunOptions = ctx.getConfig<IAliyunConfig>("picBed.aliyun")
  if (!aliYunOptions) {
    throw new Error("Can't find aliYun OSS config")
  }

  const imgList = ctx.output
  const customUrl = aliYunOptions.customUrl || ""
  const path = aliYunOptions.path || ""
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
        const date = new Date().toUTCString()
        const signature = generateSignature(aliYunOptions, img.fileName, date)
        const options = postOptions(aliYunOptions, img.fileName, signature, image, date)
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
          throw body
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

export { handleWeb, generateSignature, postOptions }
