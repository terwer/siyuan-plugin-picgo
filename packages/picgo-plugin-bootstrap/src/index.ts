/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { App, IObject, Plugin } from "siyuan"
import { simpleLogger } from "zhi-lib-base"
import { isDev } from "./Constants"
import { initTopbar } from "./topbar"
import { showPage } from "./dialog"
import { PageRoute } from "./pageRoute"
import { ILogger } from "./appLogger"

export default class PicgoPlugin extends Plugin {
  private logger: ILogger

  constructor(options: { app: App; id: string; name: string; i18n: IObject }) {
    super(options)

    this.logger = simpleLogger("index", "picgo-plugin", isDev)
  }

  onload() {
    initTopbar(this)
    this.logger.info("PicGo Plugin loaded")
  }

  openSetting() {
    showPage(this, PageRoute.Page_Setting)
  }

  onunload() {
    this.logger.info("PicGo Plugin unloaded")
  }
}
