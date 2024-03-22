<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { UploadFilled } from "@element-plus/icons-vue"
import { ref } from "vue"
import { SiyuanPicGo } from "@/utils/siyuanPicgo.ts"
import { ElMessage, UploadRequestOptions } from "element-plus"
import { retrieveImageFromClipboardAsBlob } from "zhi-siyuan-picgo"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { createAppLogger } from "@/utils/appLogger.ts"

const logger = createAppLogger("drag-upload")
const { t } = useVueI18n()

const limit = ref(5)

const handleDragAction = async (file: Blob) => {
  let res: any
  try {
    const picgo = await SiyuanPicGo.getInstance()
    logger.debug("picgo =>", picgo)

    const result = await picgo.upload([file])
    if (result instanceof Array) {
      if (result.length === 0) {
        ElMessage.error("upload error => " + "no result")
        res = {
          success: false,
          message: "upload error => " + "no result"
        }
      } else {
        logger.info("upload success =>", result)
        ElMessage.success("upload success")
        const imageInfo = result[0] as any
        res = {
          success: true,
          message: "upload success",
          url: imageInfo.imgUrl
        }
      }
    } else {
      logger.error("upload error =>", result.toString())
      ElMessage.error("upload error => " + result.toString())
      res = {
        success: false,
        message: "upload error => " + result.toString()
      }
    }
  } catch (e: any) {
    logger.error(e)
    ElMessage.error(e.toString())
    res = {
      success: false,
      message: "upload error => " + e.toString()
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

  retrieveImageFromClipboardAsBlob(e, function(imageBlob: any) {
    if (imageBlob && imageBlob instanceof Blob) {
      const file = new File([imageBlob], "image.png", { type: "image/png" })
      handleDragAction(file)
    } else {
      ElMessage.error("image not found in browser clipboard")
    }
  })
}

// onBeforeMount(() => {
//   window.addEventListener("paste", handlePasteAction)
// })
//
// onBeforeUnmount(() => {
//   window.removeEventListener("paste", handlePasteAction)
// })
</script>

<template>
  <div>
    <el-upload
      class="drag-upload"
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
  </div>
</template>

<style scoped lang="stylus">
.drag-upload
  margin-bottom 10px
</style>
