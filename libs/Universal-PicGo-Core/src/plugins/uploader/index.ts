/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IPicGo, IPicGoPlugin } from "../../types"

const buildInUploaders: IPicGoPlugin = () => {
  return {
    register(ctx: IPicGo) {},
  }
}

export default buildInUploaders
