<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import PictureList from "$components/home/controls/PictureList.vue"
import { usePicgoCommon } from "$composables/usePicgoCommon.ts"
import { useVueI18n } from "$composables/useVueI18n.ts"
import UploadButton from "$components/home/controls/UploadButton.vue"
import { ref } from "vue"
import MaterialSymbolsImageSearchRounded from "~icons/material-symbols/image-search-rounded"
import MaterialSymbolsSettingsAccountBoxOutlineSharp from "~icons/material-symbols/settings-account-box-outline-sharp"
import { BrowserUtil } from "zhi-device"
import DragUpload from "$components/home/controls/DragUpload.vue"
import { useRouter } from "vue-router"

const { t } = useVueI18n()
const { picgoCommonData, picgoCommonMethods } = usePicgoCommon()
const router = useRouter()

const activeMenu = ref("upload")
const pageId = ref(BrowserUtil.getQueryParam("pageId"))

const handleTabClick = async (pane: any, ev: Event) => {
  if (pane.props.name === "setting") {
    await router.push({
      path: "/setting",
      query: { showBack: "true" },
    })
  }
}
</script>

<template>
  <div>
    <el-tabs :key="activeMenu" v-model="activeMenu" class="setting-tabs" @tab-click="handleTabClick">
      <el-tab-pane name="upload">
        <template #label>
          <span>
            <i class="el-icon"><MaterialSymbolsImageSearchRounded /></i> {{ t("upload.tab.upload") }}
          </span>
        </template>
        <!-- 上传状态 -->
        <div class="upload-status">
          <el-button v-loading.fullscreen.lock="picgoCommonData.isUploadLoading" text> </el-button>
        </div>
        <div class="drag-action">
          <drag-upload
            :page-id="pageId"
            :picgo-common-data="picgoCommonData"
            :picgo-common-methods="picgoCommonMethods"
          />
        </div>
        <div class="upload-action">
          <!-- 上传按钮 -->
          <upload-button
            :page-id="pageId"
            :picgo-common-data="picgoCommonData"
            :picgo-common-methods="picgoCommonMethods"
          />

          <!-- 图片列表 -->
          <picture-list
            :page-id="pageId"
            :picgo-common-data="picgoCommonData"
            :picgo-common-methods="picgoCommonMethods"
          />

          <!-- 日志显示 -->
          <div v-if="picgoCommonData.showDebugMsg" class="page-id">
            <el-input v-model="pageId" placeholder="页面ID" />
          </div>
          <!-- 日志显示 -->
          <div v-if="picgoCommonData.showDebugMsg" class="log-msg">
            <el-input
              v-model="picgoCommonData.loggerMsg"
              type="textarea"
              :autosize="{ minRows: 5, maxRows: 10 }"
              placeholder="日志信息"
            />
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane name="setting">
        <template #label>
          <span>
            <i class="el-icon"><MaterialSymbolsSettingsAccountBoxOutlineSharp /></i> {{ t("upload.tab.setting") }}
          </span>
        </template>
        loading...
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="stylus" scoped>
.page-id
  margin-bottom 16px

.log-msg
  margin: 10px 0
</style>
