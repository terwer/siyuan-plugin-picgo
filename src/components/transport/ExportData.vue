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
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { isInSiyuanOrSiyuanNewWin } from "~/src/utils/utils.ts"
import picgoUtil from "~/src/service/picgoUtil.js"

const { t } = useVueI18n()
const isSiyuanOrSiyuanNewWin = isInSiyuanOrSiyuanNewWin()

const handleExportPicgo = () => {
  picgoUtil.backupPicgoCfg()
}
</script>

<template>
  <div>
    <el-card v-if="isSiyuanOrSiyuanNewWin" class="box-card">
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="handleExportPicgo">
            {{ t("setting.conf.export.picgo") }}
          </el-button>
        </div>
      </template>
      <el-alert :title="t('setting.conf.export.syp.tip')" type="success" :closable="false" />
    </el-card>
  </div>
</template>

<style scoped>
.box-card {
  margin-top: 16px;
}
</style>
