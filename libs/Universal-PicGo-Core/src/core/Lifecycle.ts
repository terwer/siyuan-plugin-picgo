/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { EventEmitter } from "../utils/nodePolyfill"
import { IPicGo } from "../types"
import { ILogger } from "zhi-lib-base"

export class Lifecycle extends EventEmitter {
  private readonly ctx: IPicGo
  private readonly logger: ILogger

  constructor(ctx: IPicGo) {
    super()
    this.ctx = ctx
    this.logger = this.ctx.getLogger("lifecycle")
    this.logger.debug("lifecycle is inited")
  }

  async start(input: any[]): Promise<IPicGo> {
    throw new Error("Lifecycle.start is not implemented")
  }
}
