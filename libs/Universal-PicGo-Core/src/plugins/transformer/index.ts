/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin } from "../../types"
import ImgFromPath from "./path"
import ImgFromBase64 from "./base64"

const buildInTransformers: IPicGoPlugin = () => {
  return {
    register(ctx: IPicGo) {
      ctx.helper.transformer.register("path", ImgFromPath)
      ctx.helper.transformer.register("base64", ImgFromBase64)
    },
  }
}

export default buildInTransformers
