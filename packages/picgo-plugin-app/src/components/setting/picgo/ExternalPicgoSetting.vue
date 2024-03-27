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
})

const formData = reactive({
  cfg: props.cfg,
})
</script>

<template>
  <div>
    <el-form-item :label="t('setting.picgo.external.setting.apiurl')" label-width="170px">
      <el-input v-model="formData.cfg.extPicgoApiUrl" :placeholder="t('setting.picgo.external.setting.apiurl.tip')" />
    </el-form-item>
  </div>
</template>

<style scoped></style>
