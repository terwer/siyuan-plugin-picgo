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
import { usePicgoInitPage } from "$composables/usePicgoInitPage.ts"
import { usePicgoManage } from "$composables/usePicgoManage.ts"
import Fa6SolidUpload from "~icons/fa6-solid/upload"
import MdiArrowRightTopBold from "~icons/mdi/arrow-right-top-bold"
import IcOutlineLink from "~icons/ic/outline-link"
import MaterialSymbolsSoundDetectionGlassBreakOutline from "~icons/material-symbols/sound-detection-glass-break-outline"

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

// uses
const { t } = useVueI18n()

const { picgoInitMethods } = usePicgoInitPage(props, { picgoCommonMethods: props.picgoCommonMethods })
const { picgoManageData, picgoManageMethods } = usePicgoManage(props, {
  picgoCommonMethods: props.picgoCommonMethods,
  picgoInitMethods,
})
</script>

<template>
  <div>
    <!-- 图片列表 -->
    <ul class="file-list">
      <li v-for="f in picgoCommonData.fileList.files" :key="f.name" class="file-list-item">
        <div><img :src="f.url" :alt="f.name" /></div>
        <div>
          <!-- 上传本地图片到图床 -->
          <el-button class="file-list-action" @click="picgoManageMethods.handleUploadCurrentImageToBed(f)">
            <el-icon v-if="f.isLocal">
              <Fa6SolidUpload />
            </el-icon>
            <el-icon v-else>
              <MdiArrowRightTopBold />
            </el-icon>
            &nbsp;{{ f.isLocal ? t("picgo.download.local.to.bed") : "重新上传" }}
          </el-button>

          <!-- 复制图片链接 -->
          <el-popover
            placement="bottom"
            :title="f.alt ? f.alt : t('setting.picgo.index.copy.link')"
            :width="picgoCommonData.popWidth"
            trigger="hover"
            :content="f.url"
          >
            <template #reference>
              <el-button class="file-list-action" @click="picgoManageMethods.onImageUrlCopy(f.url)">
                <el-icon>
                  <IcOutlineLink />
                </el-icon>
                &nbsp;{{ t("setting.picgo.index.copy.link") }}
              </el-button>
            </template>
          </el-popover>

          <!-- 图片预览 -->
          <el-button class="file-list-action" @click="picgoManageMethods.handlePictureCardPreview(f.url)">
            <el-icon>
              <MaterialSymbolsSoundDetectionGlassBreakOutline />
            </el-icon>
            &nbsp;{{ t("picgo.pic.preview") }}
          </el-button>
        </div>
      </li>
    </ul>

    <!-- 
    ================================================================================================================
    -->

    <!-- 图片放大 -->
    <el-dialog
      v-model="picgoManageData.dialogPreviewVisible"
      :title="t('picgo.pic.preview') + ' - ' + picgoManageData.dialogImageUrl"
    >
      <img :src="picgoManageData.dialogImageUrl" alt="Preview Image" class="img-big-preview" />
    </el-dialog>
  </div>
</template>

<style scoped lang="stylus">
.file-list
  list-style: none
  margin: 0
  padding: 0

.file-list li
  display: inline-block
  margin-right: 10px
  margin-bottom: 16px
  padding: 8px
  border: solid 1px var(--el-color-primary)
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base))
  width: calc(25% - 38px)

  &:last-child
    margin-right: 0

// 最后一个元素去除右侧间距

.file-list li img
  width: 100%
  height: 150px

.file-list li .file-list-action
  display: flex
  margin: 6px 0
  width: 100%
</style>
