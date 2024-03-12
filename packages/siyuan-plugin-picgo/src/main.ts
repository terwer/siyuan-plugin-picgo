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

import App from "./App.vue"
import { createApp } from "vue"
// import { useVueRouter } from "./composables/useVueRouter.ts"
// import { createAppLogger } from "../common/appLogger"
// import AppInstance from "./appInstance.ts"
// import i18n from "./locales"
// import FontAwesome from "~/src/composables/useFontAwesome.ts"
// import { createPinia } from "pinia"

// const logger = createAppLogger("vue-main-entry")

/**
 * Vue 入口
 *
 * @author terwer
 * @version 0.9.0
 * @since 0.0.1
 */
const createVueApp = async () => {
  // appInstance
  // const appInstance = await AppInstance.getInstance()
  // logger.info("appInstance inited =>", appInstance)

  // 初始化 vue 实例
  // https://stackoverflow.com/a/62383325/4037224
  const app = createApp(App)

  // // pinia
  // const pinia = createPinia()
  // app.use(pinia)

  // // 国际化
  // app.use(i18n)
  //
  // // font-awesome
  // app.use(FontAwesome)
  //
  // // router
  // const router = useVueRouter()
  // app.use(router)

  // 挂载 vue app
  app.mount("#app")
  // logger.info("vue app created")
}

;(async () => {
  await createVueApp()
})()
