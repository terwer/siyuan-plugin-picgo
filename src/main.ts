import App from "./App.vue"
import { createApp } from "vue"
import { useVueRouter } from "./composables/useVueRouter.ts"
import { createAppLogger } from "./utils/appLogger.ts"
import { InjectKeys } from "./utils/injectKeys.ts"
import AppInstance from "./appInstance.ts"
import i18n from "./locales"

/**
 * Vue 入口
 *
 * @author terwer
 * @version 0.9.0
 * @since 0.0.1
 */
const createVueApp = async () => {
  const logger = createAppLogger("vue-main-entry")

  // https://stackoverflow.com/a/62383325/4037224
  const app = createApp(App)

  // 国际化
  app.use(i18n)

  // router
  const router = useVueRouter()
  app.use(router)

  // appInstance
  const appInstance = new AppInstance()
  await appInstance.init()
  app.provide(InjectKeys.APP_INSTANCE, appInstance)
  logger.info("appInstance provided=>", appInstance)

  // 挂载 vue app
  app.mount("#app")

  // 暴露 Vue 实例
  app.provide(InjectKeys.VUE_INSTANCE, app)
  logger.info("vue app created")
}

;(async () => {
  await createVueApp()
})()
