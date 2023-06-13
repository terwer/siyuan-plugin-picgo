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

import { SiyuanDevice } from "zhi-device"

/**
 * 获取当前可用图床
 *
 * @author terwer
 * @since 0.7.0
 */
const getPicBeds = () => {
  const syWin = SiyuanDevice.siyuanWindow()
  const picgo = syWin.SyPicgo.getPicgoObj()

  const picBedTypes = picgo.helper.uploader.getIdList()
  const picBedFromDB = picgo.getConfig("picBed.list") || []
  const picBeds = picBedTypes
    .map((item) => {
      const visible = picBedFromDB.find((i) => i.type === item) // object or undefined
      return {
        type: item,
        name: picgo.helper.uploader.get(item).name || item,
        visible: visible ? visible.visible : true,
      }
    })
    .sort((a) => {
      if (a.type === "github") {
        return -1
      }
      return 0
    })

  // console.warn("获取支持的图床类型：", picBeds)
  return picBeds
}

/**
 * 获取当前PicGO版本
 */
const getPicgoVersion = () => {
  const syWin = SiyuanDevice.siyuanWindow()
  const syPicgo = syWin?.SyPicgo
  const picgo = syPicgo?.getPicgoObj()

  if (!picgo) {
    return "1.5.0"
  }

  return picgo.VERSION
}

/**
 * PicGO相关操作统一访问入口
 */
const picgoUtil = {
  // config
  getPicgoConfig,
  savePicgoConfig,

  // form
  getPicBedConfig,

  // uploader
  getPicBeds,
  getUploaderConfigList,
  selectUploaderConfig,
  changeCurrentUploader,
  deleteUploaderConfig,
  updateUploaderConfig,

  // /Users/terwer/Library/Application Support/sy-picgo/
  getPicgoBasedir,
  // /Users/terwer/Library/Application Support/sy-picgo/picgo.cfg.json
  getPicgoCfgPath,
  // /Users/terwer/Library/Application Support/sy-picgo/[filename]
  getPicgoCfgFile,

  // Ipc
  ipcHandleEvent,
  ipcRegisterEvent,
  ipcRemoveEvent,

  getPicgoVersion,

  // 构建插件菜单
  buildPluginMenu,

  handleRestoreState,

  // 配置操作
  clearPicgoCfg,
  backupPicgoCfg,
  importPicgoCfg,
}
export default picgoUtil
