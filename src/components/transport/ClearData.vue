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

<script lang="ts" setup>
import { ElMessageBox } from "element-plus"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { isInSiyuanOrSiyuanNewWin } from "~/src/utils/utils.ts"
import picgoUtil from "~/src/service/picgoUtil.js"
import { BrowserUtil } from "zhi-device"

const { t } = useVueI18n()
const isSiyuanOrSiyuanNewWin = isInSiyuanOrSiyuanNewWin()

const handleClearPicgo = () => {
  ElMessageBox.confirm(t("main.opt.warning.tip"), t("main.opt.warning"), {
    confirmButtonText: t("main.opt.ok"),
    cancelButtonText: t("main.opt.cancel"),
    type: "warning",
  })
    .then(async () => {
      picgoUtil.clearPicgoCfg()
      BrowserUtil.reloadPageWithMessageCallback(t("main.opt.success"), undefined)
    })
    .catch(() => {
      // ElMessage({
      //   type: 'error',
      //   message: t("main.opt.failure"),
      // })
    })
}
</script>

<template>
  <div>
    <el-card v-if="isSiyuanOrSiyuanNewWin" class="box-card">
      <template #header>
        <div class="card-header">
          <el-button type="danger" @click="handleClearPicgo">{{ t("setting.conf.clear.picgo") }} </el-button>
        </div>
      </template>
      <el-alert :title="t('setting.conf.clear.picgo.tip')" type="error" :closable="false" />
    </el-card>
  </div>
</template>
