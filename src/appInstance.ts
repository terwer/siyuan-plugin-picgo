/*
 * Copyright (c) 2023, Terwer . All rights reserved.
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This code is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 only, as
 * published by the Free Software Foundation.  Terwer designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Terwer in the LICENSE file that accompanied this code.
 *
 * This code is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * version 2 for more details (a copy is included in the LICENSE file that
 * accompanied this code).
 *
 * You should have received a copy of the GNU General Public License version
 * 2 along with this work; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
 * or visit www.terwer.space if you need additional information or have any
 * questions.
 */

import { createAppLogger } from "./utils/appLogger"

class AppInstance {
  private static instance: AppInstance | undefined
  private static logger = createAppLogger("app-instance")
  private readonly win = parent.window as any
  private readonly workspaceDir = this.win.siyuan.config.system.workspaceDir
  private readonly libsBase = `${this.workspaceDir}/data/plugins/siyuan-plugin-picgo/libs`

  public picgo

  public static async getInstance(): Promise<AppInstance> {
    if (!AppInstance.instance) {
      this.logger.info("Unable to obtain appInstance, try to re-initialized")
      AppInstance.instance = new AppInstance()
      await AppInstance.instance.init()
    }
    return AppInstance.instance
  }

  private async init() {
    // sy-picgo-core
    const syPicgo = this.initSyPicgo()
    this.picgo = syPicgo.getPicgoObj()
  }

  // 其他方法
  private initSyPicgo() {
    const picgoExtension = this.win.require(`${this.libsBase}/sy-picgo-core/syPicgo.js`).default as any
    const cfgfolder = `${this.workspaceDir}/data/storage/syp/picgo`
    const picgo_cfg_070 = cfgfolder + "/picgo.cfg.json"

    const appFolder = picgoExtension.getCrossPlatformAppDataFolder()
    console.log("appFolder=>", appFolder)

    // 初始化
    return picgoExtension.initPicgo(picgo_cfg_070)
  }
}
export default AppInstance
