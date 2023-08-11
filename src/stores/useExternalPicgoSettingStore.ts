import { defineStore } from "pinia"
import { ExternalPicgoConfig } from "~/external-picgo.config.ts"
import { createAppLogger } from "~/common/appLogger.ts"
import { useCommonStorageAsync } from "~/src/stores/common/useCommonStorageAsync.ts"
import { computed, ref } from "vue"

/**
 * 设置配置存储
 * https://pinia.vuejs.org/ssr/nuxt.html
 */
export const useExternalPicgoSettingStore = defineStore("external-picgo-config", () => {
  const logger = createAppLogger("use-external-picgo-setting-store")
  const storageKey = "/data/storage/syp/picgo/external-picgo-cfg.json"
  const initialValue = ExternalPicgoConfig
  const { commonStore } = useCommonStorageAsync<typeof ExternalPicgoConfig>(storageKey, initialValue)
  const settingRef = ref<typeof ExternalPicgoConfig | null>(null)

  const getSettingRef = computed(async () => {
    const setting = await commonStore.get()
    logger.debug("get data from setting=>", setting)
    settingRef.value = setting
    return setting
  })

  /**
   * 获取配置
   */
  const getExternalPicgoSetting = async (): Promise<typeof ExternalPicgoConfig> => {
    if (settingRef.value === null) {
      logger.info("Setting not initialized. Initializing now...")
      // 如果设置还没有被初始化，则调用 getSettingRef 函数
      const setting = getSettingRef.value
      logger.info(`Loaded setting from remote api`)
      return setting ?? {}
    }
    logger.info(`Loaded setting from cache.`)
    return settingRef.value ?? {}
  }

  /**
   * 修改配置
   *
   * @param setting - 需要修改的配置
   */
  const updateExternalPicgoSetting = async (setting: Partial<typeof ExternalPicgoConfig>) => {
    logger.debug("update setting=>", setting)
    await commonStore.set(setting)
    settingRef.value = { ...settingRef.value, ...setting }
  }

  return { getExternalPicgoSetting, updateExternalPicgoSetting }
})
