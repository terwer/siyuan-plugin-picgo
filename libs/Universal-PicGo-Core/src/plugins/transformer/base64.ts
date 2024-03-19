/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo } from "../../types"

const handle = async (ctx: IPicGo): Promise<IPicGo> => {
  ctx.output.push(...ctx.input)
  return ctx
}

export default {
  handle,
}
