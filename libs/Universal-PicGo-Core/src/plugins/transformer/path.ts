/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import dayjs from "dayjs"
import { IImgInfo, IImgSize, IPathTransformedImgInfo, IPicGo } from "../../types"
import { currentWin, parentWin, win } from "universal-picgo-store"
import { getBase64File, getFSFile, getImageSize, getURLFile, isBase64, isFileOrBlob, isUrl } from "../../utils/common"

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  const results: IImgInfo[] = ctx.output
  await Promise.all(
    ctx.input.map(async (item: string | typeof win.Buffer, index: number) => {
      let info: IPathTransformedImgInfo
      if (isFileOrBlob(item)) {
        throw new Error("Blob is not supported")
      } else if (win.Buffer.isBuffer(item)) {
        ctx.log.debug("using buffer in path transform")
        info = {
          success: true,
          buffer: item,
          fileName: "", // will use getImageSize result
          extname: "", // will use getImageSize result
        }
      } else if (isUrl(item)) {
        ctx.log.debug("using image url in path transform")
        info = await getURLFile(item, ctx)
      } else if (isBase64(item)) {
        ctx.log.debug("using image base64 in path transform")
        info = await getBase64File(item)
      } else {
        ctx.log.debug("using fs in path transform")
        info = await getFSFile(item)
      }
      if (info.success && info.buffer) {
        const imgSize = getImgSize(ctx, info.buffer, item)
        const extname = info.extname || imgSize.extname || ".png"
        results[index] = {
          buffer: info.buffer,
          fileName: info.fileName || `${dayjs().format("YYYYMMDDHHmmss")}${extname}}`,
          width: imgSize.width,
          height: imgSize.height,
          extname,
        }
      } else {
        ctx.log.error(info.reason)
        throw new Error(info.reason)
      }
    })
  )
  // remove empty item
  ctx.output = results.filter((item) => item)
  return ctx
}

const getImgSize = (ctx: IPicGo, file: typeof win.Buffer, path: string | typeof win.Buffer): IImgSize => {
  const imageSize = getImageSize(file)
  if (!imageSize.real) {
    if (typeof path === "string") {
      ctx.log.warn(`can't get ${path}'s image size`)
    } else {
      ctx.log.warn("can't get image size")
    }
    ctx.log.warn("fallback to 200 * 200")
  }
  return imageSize
}

export default {
  handle,
}
