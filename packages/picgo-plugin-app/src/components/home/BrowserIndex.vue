<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { createAppLogger } from "@/utils/appLogger.ts"
import { isDev } from "@/utils/Constants.ts"
import { ElMessage, UploadRequestOptions } from "element-plus"
import { SiyuanPicGoUploadApi } from "universal-picgo"
import { UploadFilled } from "@element-plus/icons-vue"
import { onBeforeMount, onBeforeUnmount, ref } from "vue"
import { retrieveImageFromClipboardAsBlob } from "@/utils/browserClipboard.ts"
import { useVueI18n } from "$composables/useVueI18n.ts"
import MaterialSymbolsImageSearchRounded from "~icons/material-symbols/image-search-rounded"
import MaterialSymbolsSettingsAccountBoxOutlineSharp from "~icons/material-symbols/settings-account-box-outline-sharp"
import SettingIndex from "$pages/SettingIndex.vue"

const logger = createAppLogger("picgo-browser-index")
const { t } = useVueI18n()

const limit = ref(5)
const activeMenu = ref("upload")

const handleDragAction = async (file: Blob) => {
  let res: any
  try {
    const picgo = new SiyuanPicGoUploadApi(isDev)
    logger.debug("picgo =>", picgo)

    const result = await picgo.upload([file])
    if (result instanceof Array) {
      if (result.length === 0) {
        ElMessage.error("upload error => " + "no result")
        res = {
          success: false,
          message: "upload error => " + "no result",
        }
      } else {
        logger.info("upload success =>", result)
        ElMessage.success("upload success")
        const imageInfo = result[0] as any
        res = {
          success: true,
          message: "upload success",
          url: imageInfo.imgUrl,
        }
      }
    } else {
      logger.error("upload error =>", result.toString())
      ElMessage.error("upload error => " + result.toString())
      res = {
        success: false,
        message: "upload error => " + result.toString(),
      }
    }
  } catch (e: any) {
    logger.error(e)
    ElMessage.error(e.toString())
    res = {
      success: false,
      message: "upload error => " + e.toString(),
    }
  }

  return res
}

const customRequestHandler = (options: UploadRequestOptions): Promise<unknown> => {
  return handleDragAction(options.file)
}

const handleExceed = (_e: any) => {
  ElMessage.error("selected files exceed to upload limit  " + limit.value)
}

const handlePasteAction = (e: any) => {
  e.preventDefault()

  retrieveImageFromClipboardAsBlob(e, function (imageBlob: any) {
    if (imageBlob && imageBlob instanceof Blob) {
      const file = new File([imageBlob], "image.png", { type: "image/png" })
      handleDragAction(file)
    } else {
      ElMessage.error("image not found in browser clipboard")
    }
  })
}

onBeforeMount(() => {
  window.addEventListener("paste", handlePasteAction)
})

onBeforeUnmount(() => {
  window.removeEventListener("paste", handlePasteAction)
})
</script>

<template>
  <div>
    <el-tabs :key="activeMenu" v-model="activeMenu" class="setting-tabs">
      <el-tab-pane name="upload">
        <template #label>
          <span>
            <i class="el-icon"><MaterialSymbolsImageSearchRounded /></i> {{ t("upload.tab.upload") }}
          </span>
        </template>
        <el-upload
          class="upload-demo"
          drag
          :http-request="customRequestHandler"
          multiple
          :limit="limit"
          accept="image/png,image/jpg,image/jpeg,image/gif,image/webp,image/svg"
          :on-exceed="handleExceed"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">
            {{ t("upload.select.tip1") }} <em>{{ t("upload.select.tip2") }}</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">{{ t("upload.select.limit") }} 5</div>
          </template>
        </el-upload>
      </el-tab-pane>
      <el-tab-pane name="setting">
        <template #label>
          <span>
            <i class="el-icon"><MaterialSymbolsSettingsAccountBoxOutlineSharp /></i> {{ t("upload.tab.setting") }}
          </span>
        </template>
        <setting-index />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="stylus" scoped>
.action-item
  margin 10px
</style>
