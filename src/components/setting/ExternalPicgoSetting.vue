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
import { onMounted, reactive } from "vue"
import { ExternalPicgoConfig } from "~/external-picgo.config.ts"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { createAppLogger } from "~/common/appLogger.ts"
import { useExternalPicgoSettingStore } from "~/src/stores/useExternalPicgoSettingStore.ts"
import { ElMessage } from "element-plus"

const logger = createAppLogger("external-picgo-setting")
const { t } = useVueI18n()
const { getExternalPicgoSetting, updateExternalPicgoSetting } = useExternalPicgoSettingStore()

const formData = reactive({
  extPicgoCfg: {} as typeof ExternalPicgoConfig,
})

const handleSaveExternalPicgoConfig = async () => {
  await updateExternalPicgoSetting(formData.extPicgoCfg)
  ElMessage.success(t("main.opt.success"))
}

onMounted(async () => {
  formData.extPicgoCfg = await getExternalPicgoSetting()
  logger.debug("extPicgoCfg =>", formData.extPicgoCfg)
})
</script>

<template>
  <back-page title="外部PicGO设置">
    <el-form label-width="125px" class="external-setting-form">
      <el-form-item :label="t('setting.picgo.external.setting.apiurl')">
        <el-input
          v-model="formData.extPicgoCfg.extPicgoApiUrl"
          :placeholder="t('setting.picgo.external.setting.apiurl.tip')"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSaveExternalPicgoConfig">{{ t("main.opt.save") }} </el-button>
      </el-form-item>
    </el-form>
  </back-page>
</template>

<style lang="stylus" scoped>
.external-setting-form
  margin-top 20px
</style>
