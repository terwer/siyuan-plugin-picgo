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

export class Lifecycle extends EventEmitter {
  async start(input: any[]): Promise<IPicGo> {
    throw new Error("Lifecycle.start is not implemented")
  }
}
