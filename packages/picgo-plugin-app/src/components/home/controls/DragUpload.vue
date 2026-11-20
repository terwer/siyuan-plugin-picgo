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
import { onBeforeMount, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import { ElMessage, UploadRequestOptions } from "element-plus"
import { generateUniqueName, ImageItem, retrieveImageFromClipboardAsBlob } from "zhi-siyuan-picgo"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { usePicgoUpload } from "$composables/usePicgoUpload.ts"
import { DEFAULT_MAX_UPLOAD_COUNT, normalizeMaxUploadCount } from "@/utils/uploadLimit.ts"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"

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

const maxUploadCount = ref(DEFAULT_MAX_UPLOAD_COUNT)
const uploadRef = ref<{ clearFiles: () => void }>()

const loadMaxUploadCount = async () => {
  try {
    const siyuanPicgo = await SiyuanPicGoClient.getInstance()
    const ctx = siyuanPicgo?.ctx?.()
    maxUploadCount.value = normalizeMaxUploadCount(ctx?.getConfig?.("siyuan.maxUploadCount"))
  } catch {
    // 配置读取失败时沿用默认值，避免拖拽上传不可用
    maxUploadCount.value = DEFAULT_MAX_UPLOAD_COUNT
  }
}

onMounted(loadMaxUploadCount)

const handleDragAction = async (file: Blob) => {
  let res: any
  try {
    const imageItem = new ImageItem(generateUniqueName(), file as any, true, "", "")
    await picgoUploadMethods.doUploadImageToBed(imageItem)

    res = {
      success: true,
      message: "",
    }
  } catch (e: any) {
    const errMsg = t("main.opt.failure") + "=>" + e
    ElMessage.error(errMsg)
    res = {
      success: false,
      message: errMsg,
    }
  }

  return res
}

// 拖拽上传会一次触发多个请求。图片较多时并发请求容易触发图床限流或超时，
// 因此按队列逐张上传；上传期间保持 loading 状态，队列清空后再结束。
let pendingUploadCount = 0
let uploadChain: Promise<unknown> = Promise.resolve()

const enqueueDragUpload = (file: Blob): Promise<unknown> => {
  pendingUploadCount++
  formData.picgoCommonData.isUploadLoading = true

  const task = uploadChain.then(() => handleDragAction(file))
  uploadChain = task.catch(() => undefined)

  return task.finally(() => {
    pendingUploadCount = Math.max(0, pendingUploadCount - 1)
    if (pendingUploadCount === 0) {
      formData.picgoCommonData.isUploadLoading = false
      // el-upload 的 limit 会累计已选文件；每批处理完后清空，保证上限按“单次”生效。
      uploadRef.value?.clearFiles()
    }
  })
}

const customRequestHandler = (options: UploadRequestOptions): Promise<unknown> => {
  return enqueueDragUpload(options.file)
}

const handleExceed = () => {
  ElMessage.error(`${t("upload.select.exceed")} ${maxUploadCount.value}`)
}

// const handlePasteAction = (e: any) => {
//   e.preventDefault()
//
//   retrieveImageFromClipboardAsBlob(e, function (imageBlob: any) {
//     if (imageBlob && imageBlob instanceof Blob) {
//       const file = new File([imageBlob], "image.png", { type: "image/png" })
//       handleDragAction(file)
//     } else {
//       ElMessage.error("image not found in browser clipboard")
//     }
//   })
// }

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
      ref="uploadRef"
      class="drag-upload"
      drag
      :http-request="customRequestHandler"
      multiple
      :limit="maxUploadCount"
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
        <div class="el-upload__tip">{{ t("upload.select.limit") }} {{ maxUploadCount }}</div>
      </template>
    </el-upload>
  </div>
</template>

<style scoped lang="stylus">
.drag-upload
  margin-bottom 10px
</style>
