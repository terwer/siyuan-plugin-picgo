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
import { onBeforeMount, onBeforeUnmount, reactive, ref } from "vue"
import { SiyuanPicGo } from "@/utils/siyuanPicgo.ts"
import { ElMessage, UploadRequestOptions } from "element-plus"
import { retrieveImageFromClipboardAsBlob } from "zhi-siyuan-picgo"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { createAppLogger } from "@/utils/appLogger.ts"
import { usePicgoUpload } from "$composables/usePicgoUpload.ts"
import { ImageItem } from "zhi-siyuan-picgo/src/lib/models/ImageItem.ts"

const logger = createAppLogger("drag-upload")

// props
const props = defineProps({
  pageId: {
    type: String,
    default: "",
  },

  picgoCommonData: {
    type: Object,
    default: null,
  },
  picgoCommonMethods: {
    type: Object,
    default: null,
  },
})

// refs
const formData = reactive({
  picgoCommonData: props.picgoCommonData,
  picgoCommonMethods: props.picgoCommonMethods,
})
// uses
const { t } = useVueI18n()
const { picgoUploadMethods } = usePicgoUpload(props, { picgoCommonMethods: formData.picgoCommonMethods }, {})

const limit = ref(5)

const handleDragAction = async (file: Blob) => {
  let res: any
  try {
    formData.picgoCommonData.isUploadLoading = true

    const imageItem = new ImageItem("", file as any, true, "", "")
    await picgoUploadMethods.doUploadImageToBed(imageItem)

    res = {
      success: true,
      message: "",
    }
  } catch (e: any) {
    const errMsg = t("main.opt.failure") + "=>" + e
    logger.error(errMsg)
    ElMessage.error(errMsg)
    res = {
      success: false,
      message: errMsg,
    }
  } finally {
    formData.picgoCommonData.isUploadLoading = false
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
