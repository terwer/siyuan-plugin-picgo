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
import { reactive } from "vue"

const { t } = useVueI18n()

const props = defineProps({
  cfg: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: "local",
  },
})

const formData = reactive({
  cfg: props.cfg,
})
</script>

<template>
  <div>
    <!-- 本地 PicGo App 模式 -->
    <template v-if="mode === 'local'">
      <el-form-item :label="t('setting.picgo.external.setting.apiurl')" label-width="170px">
        <el-input v-model="formData.cfg.extPicgoApiUrl" :placeholder="t('setting.picgo.external.setting.apiurl.tip')" />
      </el-form-item>
    </template>

    <!-- 远程 PicList 模式 -->
    <template v-else>
      <el-form-item :label="t('setting.picgo.piclist.apiurl')" label-width="170px" required>
        <el-input v-model="formData.cfg.picListApiUrl" :placeholder="t('setting.picgo.piclist.apiurl.tip')" />
      </el-form-item>
      <el-form-item :label="t('setting.picgo.piclist.apikey')" label-width="170px" required>
        <el-input
          v-model="formData.cfg.picListApiKey"
          type="password"
          show-password
          :placeholder="t('setting.picgo.piclist.apikey.tip')"
        />
      </el-form-item>
      <el-divider border-style="dashed" />
      <el-alert :closable="false" type="info" show-icon>
        <template #title>{{ t("setting.picgo.piclist.notice.title") }}</template>
        {{ t("setting.picgo.piclist.notice.desc") }}
      </el-alert>
    </template>
  </div>
</template>

<style scoped></style>
