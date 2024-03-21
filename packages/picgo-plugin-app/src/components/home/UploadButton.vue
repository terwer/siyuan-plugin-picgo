<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { useVueI18n } from "$composables/useVueI18n.ts"
import { usePicgoUpload } from "$composables/usePicgoUpload.ts"
import { reactive, ref, watch } from "vue"
import LetsIconsImportLight from "~icons/lets-icons/import-light"
import MaterialSymbolsCloudDownloadRounded from "~icons/material-symbols/cloud-download-rounded"
import UiwCloudUpload from "~icons/uiw/cloud-upload"
import IcTwotoneContentPasteSearch from "~icons/ic/twotone-content-paste-search"

// props
const props = defineProps({
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
const refSelectedFiles = ref()
const formData = reactive({
  picgoCommonData: props.picgoCommonData,
  picgoCommonMethods: props.picgoCommonMethods,
})

// uses
const { t } = useVueI18n()
const { picgoUploadMethods } = usePicgoUpload(
  props,
  { picgoCommonMethods: formData.picgoCommonMethods },
  { refSelectedFiles }
)
</script>

<template>
  <!-- 操作按钮 -->
  <blockquote class="picgo-opt-btn">
    <!-- 选择文件上传 -->
    <input
      ref="refSelectedFiles"
      type="file"
      accept="image/png, image/gif, image/jpeg"
      multiple
      @change="picgoUploadMethods.doUploadPicSelected"
    />
    <el-button
      v-if="formData.picgoCommonData.isSiyuanOrSiyuanNewWin"
      type="warning"
      @click="picgoUploadMethods.bindFileControl"
    >
      <el-icon><LetsIconsImportLight /></el-icon>
      &nbsp;{{ t("picgo.upload.select.pic") }}
    </el-button>

    <!-- 剪贴板上传 -->
    <el-button type="primary" @click="picgoUploadMethods.doUploadPicFromClipboard">
      <el-icon><IcTwotoneContentPasteSearch /></el-icon>
      &nbsp;{{ t("picgo.upload.clipboard") }}
    </el-button>

    <!-- 上传所有图片到图床 -->
    <el-button
      v-if="formData.picgoCommonData.isSiyuanOrSiyuanNewWin"
      type="success"
      @click="picgoUploadMethods.doUploaddAllImagesToBed"
    >
      <el-icon><UiwCloudUpload /></el-icon>
      &nbsp;{{ t("picgo.upload.onclick") }}
    </el-button>

    <!-- 下载所有远程图片 -->
    <el-button
      type="primary"
      v-if="formData.picgoCommonData.isSiyuanOrSiyuanNewWin"
      @click="picgoUploadMethods.doDownloadAllImagesToLocal"
    >
      <el-icon><MaterialSymbolsCloudDownloadRounded /></el-icon>
      &nbsp;{{ t("picgo.download.onclick") }}
    </el-button>

    <!-- 调试模式-->
    <span class="box-item switch-item">
      <el-switch
        v-model="formData.picgoCommonData.showDebugMsg"
        inline-prompt
        size="large"
        :active-text="t('switch.active.text')"
        :inactive-text="t('switch.unactive.text')"
      ></el-switch>
    </span>
  </blockquote>
</template>

<style scoped lang="stylus">
.picgo-opt-btn
  display: block
  border: solid 1px green
  border-radius: 4px
  padding: 10px
  margin: 16px 0 16px

.upload-status
  margin-top: 10px

.upload-control
  display: inline-block
  margin: 10px 16px 10px 0

.log-msg
  margin: 10px 0

input[type="file"]
  // 隐藏原有的文件选择按钮
  display: none

// 创建自定义的文件选择按钮
.custom-file-input
  display: inline-block
  padding: 0.35em 0.5em
  border: 1px solid #ccc
  border-radius: 4px
  background-color: #fff
  color: #333
  cursor: pointer

  // 文件选择按钮的悬停样式
  &:hover
    background-color: #eee

.switch-item
  margin-left: 16px
</style>
