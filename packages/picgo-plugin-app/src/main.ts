/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2023-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import App from "./App.vue"
import { createApp } from "vue"
import { createAppLogger } from "@/utils/appLogger.ts"
import i18n from "@/i18n"
import { useVueRouter } from "$composables/useVueRouter.ts"

const logger = createAppLogger("vue-main-entry")

/**
 * Vue 入口
 *
 * @author terwer
 * @version 0.9.0
 * @since 0.0.1
 */
const createVueApp = async () => {
  // 初始化 vue 实例
  // https://stackoverflow.com/a/62383325/4037224
  const app = createApp(App)

  // router
  const router = useVueRouter()
  app.use(router)

  // 国际化
  app.use(i18n)

  // 挂载 vue app
  app.mount("#app")
  logger.info("vue app created")
}

;(async () => {
  await createVueApp()
})()
