/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import PicGoIndex from "$pages/PicGoIndex.vue"
import ExternalPicgoSetting from "$components/setting/ExternalPicgoSetting.vue"
import SiyuanSetting from "$components/setting/SiyuanSetting.vue"
import { RouteRecordRaw } from "vue-router"
import SettingIndex from "$pages/SettingIndex.vue"
import PicgoSetting from "$components/setting/PicgoSetting.vue"
import TestIndex from "$pages/TestIndex.vue"
import BrowserTest from "$components/test/BrowserTest.vue"
import ElectronTest from "$components/test/ElectronTest.vue"

/**
 * 路由定义
 */
export const routes: RouteRecordRaw[] = [
  { path: "/", component: PicGoIndex },
  { path: "/setting", component: SettingIndex },
  { path: "/setting/picgo", component: PicgoSetting },
  { path: "/setting/siyuan", component: SiyuanSetting },
  { path: "/setting/external", component: ExternalPicgoSetting },
  { path: "/test", component: TestIndex },
  { path: "/test/browser", component: BrowserTest },
  { path: "/test/electron", component: ElectronTest },
]
