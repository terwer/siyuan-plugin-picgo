/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

// noinspection ES6PreferShortImport

import { IAliyunConfig, IPicGo } from "../../../types"
import { IBuildInEvent } from "../../../utils/enums"
import { ILocalesKey } from "../../../i18n/zh-CN"
import { base64ToBuffer } from "../../../utils/common"
import OSS from "ali-oss"

const handleNode = async (ctx: IPicGo): Promise<IPicGo> => {
  const aliYunOptions = ctx.getConfig<IAliyunConfig>("picBed.aliyun")
  if (!aliYunOptions) {
    throw new Error("Can't find aliYun OSS config")
  }

  const store = new OSS({
    region: aliYunOptions.area,
    accessKeyId: aliYunOptions.accessKeyId,
    accessKeySecret: aliYunOptions.accessKeySecret,
    bucket: aliYunOptions.bucket,
  })

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
        const optionUrl = aliYunOptions.options || ""
        const remotePath = `${path}${img.fileName}${optionUrl}`

        const result = await store.put(remotePath, new Blob([image]))
        console.log("Using aliyun SDK for upload, result=>", result)

        if (result?.res?.status && result.res.status === 200) {
          delete img.base64Image
          delete img.buffer
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

export { handleNode }
