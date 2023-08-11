<!--
  - Copyright (c) 2023, Terwer . All rights reserved.
  - DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
  -
  - This code is free software; you can redistribute it and/or modify it
  - under the terms of the GNU General Public License version 2 only, as
  - published by the Free Software Foundation.  Terwer designates this
  - particular file as subject to the "Classpath" exception as provided
  - by Terwer in the LICENSE file that accompanied this code.
  -
  - This code is distributed in the hope that it will be useful, but WITHOUT
  - ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
  - FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
  - version 2 for more details (a copy is included in the LICENSE file that
  - accompanied this code).
  -
  - You should have received a copy of the GNU General Public License version
  - 2 along with this work; if not, write to the Free Software Foundation,
  - Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
  -
  - Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
  - or visit www.terwer.space if you need additional information or have any
  - questions.
  -->

<script setup lang="ts">
import { createAppLogger } from "~/common/appLogger.ts"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { ref } from "vue"
import { usePicgoCommon } from "~/src/composables/picgo/usePicgoCommon.ts"
import { usePicgoInitPage } from "~/src/composables/picgo/usePicgoInitPage.ts"
import { usePicgoUpload } from "~/src/composables/picgo/usePicgoUpload.ts"
import { usePicgoManage } from "~/src/composables/picgo/usePicgoManage.ts"
import { BrowserUtil } from "zhi-device"

const logger = createAppLogger("picgo-index-page")

// props
const props = defineProps({
  pageId: {
    type: String,
    default: BrowserUtil.getQueryParam("pageId"),
  },
})

// refs
const refSelectedFiles = ref()

// uses
const { t } = useVueI18n()

const { picgoCommonData, picgoCommonMethods } = usePicgoCommon()
const { picgoInitMethods } = usePicgoInitPage(props, { picgoCommonMethods })
const { picgoUploadData, picgoUploadMethods } = usePicgoUpload(props, { picgoCommonMethods }, { refSelectedFiles })
const { picgoManageData, picgoManageMethods } = usePicgoManage(props, {
  picgoCommonMethods,
  picgoInitMethods,
})
logger.info("This is picgo index page")
</script>

<template>
  <div class="picgo-body">
    <!--
    <el-alert :title="t('setting.picgo.index.tip')" type="warning" :closable="false" />
    -->

    <!-- 上传状态 -->
    <div class="upload-status">
      <el-button text :loading="picgoCommonData.isUploadLoading">{{ t("picgo.upload.status") }} </el-button>
    </div>

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
      <!--
      <el-tooltip class="box-item" effect="dark" :content="t('picgo.upload.select.pic')" placement="top-start">
        <el-button type="warning" @click="picgoUploadMethods.bindFileControl">
          <font-awesome-icon icon="fa-solid fa-file-import" />
        </el-button>
      </el-tooltip>
      -->
      <el-button type="warning" @click="picgoUploadMethods.bindFileControl">
        <font-awesome-icon icon="fa-solid fa-file-import" />
        &nbsp;{{ t("picgo.upload.select.pic") }}
      </el-button>

      <!-- 剪贴板上传 -->
      <el-button type="primary" @click="picgoUploadMethods.doUploadPicFromClipboard">
        <font-awesome-icon icon="fa-solid fa-paste" />
        &nbsp;{{ t("picgo.upload.clipboard") }}
      </el-button>

      <!-- 上传所有图片到图床 -->
      <el-button type="success" @click="picgoManageMethods.handleUploadAllImagesToBed">
        <font-awesome-icon icon="fa-solid fa-upload" />
        &nbsp;{{ t("picgo.upload.onclick") }}
      </el-button>

      <!-- 下载所有远程图片 -->
      <el-tooltip
        v-if="false && picgoCommonData.isSiyuanOrSiyuanNewWin"
        class="box-item"
        effect="dark"
        :content="t('picgo.download.onclick')"
        placement="top-start"
      >
        <el-button type="primary">
          <font-awesome-icon icon="fa-solid fa-download" />
        </el-button>
      </el-tooltip>

      <!-- 图床设置 -->
      <el-button type="info" @click="picgoUploadMethods.handlePicgoSetting">
        <font-awesome-icon icon="fa-solid fa-gear" />
        &nbsp;{{ t("picgo.pic.setting") }}
      </el-button>

      <!-- 调试模式 -->
      <span class="box-item switch-item">
        <el-switch
          v-model="picgoCommonData.showDebugMsg"
          inline-prompt
          size="large"
          :active-text="t('switch.active.text')"
          :inactive-text="t('switch.unactive.text')"
        ></el-switch>
      </span>
    </blockquote>

    <!-- 图片列表 -->
    <ul class="file-list">
      <li v-for="f in picgoCommonData.fileList.files" :key="f.name" class="file-list-item">
        <div><img :src="f.url" :alt="f.name" /></div>
        <div>
          <!-- 上传本地图片到图床 -->
          <el-button class="file-list-action" @click="picgoManageMethods.handleUploadCurrentImageToBed(f)">
            <font-awesome-icon :icon="f.isLocal ? 'fa-solid fa-upload' : 'fa-solid fa-arrow-rotate-right'" />
            &nbsp;{{ f.isLocal ? t("picgo.download.local.to.bed") : "重新上传" }}
          </el-button>

          <!-- 下载远程图片到本地 -->
          <el-tooltip
            v-if="false && picgoCommonData.isSiyuanOrSiyuanNewWin && !f.isLocal"
            :content="t('picgo.download.bed.to.local')"
            class="box-item"
            effect="dark"
            placement="bottom"
            popper-class="publish-menu-tooltip"
          >
            <el-button>
              <font-awesome-icon icon="fa-solid fa-download" />
            </el-button>
          </el-tooltip>

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
                <font-awesome-icon icon="fa-solid fa-file-lines" />
                &nbsp;{{ t("setting.picgo.index.copy.link") }}
              </el-button>
            </template>
          </el-popover>

          <!-- 图片预览 -->
          <el-button class="file-list-action" @click="picgoManageMethods.handlePictureCardPreview(f.url)">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            &nbsp;{{ t("picgo.pic.preview") }}
          </el-button>
        </div>
      </li>
    </ul>

    <!-- 图片放大 -->
    <el-dialog
      v-model="picgoManageData.dialogPreviewVisible"
      :title="t('picgo.pic.preview') + ' - ' + picgoManageData.dialogImageUrl"
    >
      <img w-full :src="picgoManageData.dialogImageUrl" alt="Preview Image" class="img-big-preview" />
    </el-dialog>

    <!-- 日志显示 -->
    <div v-if="picgoCommonData.showDebugMsg" class="log-msg">
      <el-input v-model="picgoCommonData.loggerMsg" type="textarea" :autosize="{ minRows: 5, maxRows: 10 }" />
    </div>

    <div class="el-alert el-alert--warning is-light" role="alert">
      <div class="el-alert__content">
        <div class="el-alert__title">
          <div>使用须知：</div>
          <div>1、此处上传的图片不会自动插入文档中，请手动点击按钮复制链接，然后 Ctrl+V 粘贴到文档中。</div>
          <div>
            2、对于文档当中原本已经存在的本地图片，点击上传之后不会直接替换原始图片，只会存储本地图片与图床图片的映射信息，需要在发布文章时手动勾选【使用图床】才会进行临时链接替换，请知悉。
            这样做是为了不破坏其他地方对文档图片的处理。当然，您也可以手动复制图床链接，然后删除原图片，替换为图床图片。
          </div>
          <div>3、该图片列表仅展示此文档包含的图片。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.picgo-body {
  padding: 16px;
}

.picgo-body .picgo-opt-btn {
  display: block;
  border: solid 1px green;
  border-radius: 4px;
  padding: 10px;
  background: var(--custom-app-bg-color);
  margin: 16px 0 16px;
}

.upload-status {
  margin-top: 10px;
}

.upload-btn-list {
}

.upload-control {
  display: inline-block;
  margin: 10px 16px 10px 0;
}

.log-msg {
  margin: 10px 0;
}

input[type="file"] {
  /* 隐藏原有的文件选择按钮 */
  display: none;
}

/* 创建自定义的文件选择按钮 */
.custom-file-input {
  display: inline-block;
  padding: 0.35em 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
}

/* 文件选择按钮的悬停样式 */
.custom-file-input:hover {
  background-color: #eee;
}

.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.file-list li {
  display: inline-block;
  margin-right: 10px;
  margin-bottom: 16px;
  padding: 8px;
  border: solid 1px var(--el-color-primary);
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
  width: calc(25% - 38px);
}

.file-list li:last-child {
  margin-right: 0; /* 最后一个元素去除右侧间距 */
}

.file-list li img {
  width: 100%;
  height: 150px;
}

.file-list li .file-list-action {
  display: flex;
  margin: 6px 0;
  width: 100%;
}

.one-local-to-bed {
  margin-bottom: 12px;
}

.one-bed-to-local {
  margin-bottom: 16px;
}

.img-big-preview {
  max-width: 100%;
}

.switch-item {
  margin-left: 16px;
}
</style>
