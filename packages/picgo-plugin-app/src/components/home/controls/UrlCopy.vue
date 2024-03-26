<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { ImageItem } from "zhi-siyuan-picgo/src/lib/models/ImageItem.ts"
import { BrowserUtil } from "zhi-device"
import { copyToClipboardInBrowser } from "zhi-siyuan-picgo/src"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { reactive } from "vue"

enum UrlTypeEnum {
  URL = "url",
  MD = "md",
  HTML = "html",
  BB = "bb",
}

const props = defineProps({
  imgInfo: {
    type: Object,
    default: {} as ImageItem,
  },
})

// uses
const { t } = useVueI18n()
const formData = reactive({
  urlType: UrlTypeEnum.MD,
})

const doCopy = (str: string) => {
  if (BrowserUtil.isInBrowser) {
    copyToClipboardInBrowser(str)
  }
}

const onImageUrlCopy = (imageInfo: ImageItem, type: UrlTypeEnum) => {
  let copyContent: string
  switch (type) {
    case UrlTypeEnum.URL:
      copyContent = imageInfo.url
      formData.urlType = UrlTypeEnum.URL
      break
    case UrlTypeEnum.MD:
      copyContent = `![${imageInfo.alt ?? imageInfo.name}](${imageInfo.url})`
      formData.urlType = UrlTypeEnum.MD
      break
    case UrlTypeEnum.HTML:
      copyContent = `<img alt="${imageInfo.alt ?? imageInfo.name}" src="${imageInfo.url}"/>`
      formData.urlType = UrlTypeEnum.HTML
      break
    case UrlTypeEnum.BB:
      copyContent = `[${imageInfo.alt ?? imageInfo.name}][${imageInfo.url}]`
      formData.urlType = UrlTypeEnum.BB
      break
    default:
      copyContent = `![${imageInfo.alt ?? imageInfo.name}](${imageInfo.url})`
      formData.urlType = UrlTypeEnum.MD
      break
  }

  doCopy(copyContent)
}
</script>

<template>
  <el-button-group class="url-copy-group">
    <el-button
      :key="UrlTypeEnum.URL"
      :type="formData.urlType === UrlTypeEnum.URL ? 'primary' : 'default'"
      class="copy-action-item"
      @click="onImageUrlCopy(props.imgInfo as ImageItem, UrlTypeEnum.URL)"
    >
      URL
    </el-button>
    <el-button
      :key="UrlTypeEnum.MD"
      :type="formData.urlType === UrlTypeEnum.MD ? 'primary' : 'default'"
      class="copy-action-item"
      @click="onImageUrlCopy(props.imgInfo as ImageItem, UrlTypeEnum.MD)"
    >
      MD
    </el-button>
    <el-button
      :key="UrlTypeEnum.HTML"
      :type="formData.urlType === UrlTypeEnum.HTML ? 'primary' : 'default'"
      class="copy-action-item"
      @click="onImageUrlCopy(props.imgInfo as ImageItem, UrlTypeEnum.HTML)"
    >
      HTML
    </el-button>
    <el-button
      :key="UrlTypeEnum.BB"
      :type="formData.urlType === UrlTypeEnum.BB ? 'primary' : 'default'"
      class="copy-action-item"
      @click="onImageUrlCopy(props.imgInfo as ImageItem, UrlTypeEnum.BB)"
    >
      BB
    </el-button>
  </el-button-group>
</template>

<style scoped lang="stylus">
.url-copy-group
  width 100%
  margin-right 2px
  .copy-action-item
    width 25%
</style>
