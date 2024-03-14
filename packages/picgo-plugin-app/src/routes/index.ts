/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import PicGoIndex from "$components/PicGoIndex.vue"
import PicgoSetting from "$components/PicgoSetting.vue"
import ExternalPicgoSetting from "$components/ExternalPicgoSetting.vue"
import SiyuanSetting from "$components/SiyuanSetting.vue"
import TransportSelect from "$components/TransportSelect.vue"
import { RouteRecordRaw } from "vue-router"

/**
 * 路由定义
 */
export const routes: RouteRecordRaw[] = [
  { path: "/", component: PicGoIndex },
  { path: "/setting", component: PicgoSetting },
  { path: "/setting/external", component: ExternalPicgoSetting },
  { path: "/setting/transport", component: TransportSelect },
  { path: "/setting/siyuan", component: SiyuanSetting },
]
