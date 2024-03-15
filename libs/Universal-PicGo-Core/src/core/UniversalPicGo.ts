/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { simpleLogger } from "zhi-lib-base"
import { EventEmitter } from "../utils/nodePolyfill"
import { IPicGo } from "../types"

/*
 * 通用 PicGO 对象定义
 *
 * @version 1.6.0
 * @since 1.4.5
 */
class UniversalPicGo extends EventEmitter implements IPicGo {
  private logger = simpleLogger("universal-picgo-api", "universal-picgo", false)
  configPath: string
  baseDir!: string

  constructor(configPath = "") {
    super()
    this.configPath = configPath
    this.logger.info("UniversalPicGo inited")

    this.on("testEvent", () => {
      this.logger.info("testEvent triggered")
    })
  }

  public test() {
    this.emit("testEvent")
  }
}

export { UniversalPicGo }
