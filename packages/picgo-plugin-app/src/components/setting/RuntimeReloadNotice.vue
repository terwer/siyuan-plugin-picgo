<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { useRuntimeReloadNotice } from "$composables/useRuntimeReloadNotice.ts"
import { useVueI18n } from "$composables/useVueI18n.ts"

const { t } = useVueI18n()
const { reloadNoticeState, clearRuntimeReloadRequired } = useRuntimeReloadNotice()
</script>

<template>
  <el-alert
    v-if="reloadNoticeState.required"
    class="runtime-reload-notice"
    type="warning"
    :closable="false"
    show-icon
  >
    <template #title>{{ t("setting.runtime.reload.required.title") }}</template>
    <div class="runtime-reload-notice__body">
      <p>{{ t("setting.runtime.reload.required.desc") }}</p>
      <p v-if="reloadNoticeState.reason">
        {{ t("setting.runtime.reload.required.reason") }}{{ reloadNoticeState.reason }}
      </p>
      <ol>
        <li>{{ t("setting.runtime.reload.required.step1") }}</li>
        <li>{{ t("setting.runtime.reload.required.step2") }}</li>
      </ol>
      <el-button size="small" type="warning" plain @click="clearRuntimeReloadRequired">
        {{ t("setting.runtime.reload.required.clear") }}
      </el-button>
    </div>
  </el-alert>
</template>

<style scoped lang="stylus">
.runtime-reload-notice
  margin 0 0 12px

  :deep(.el-alert__content)
    width 100%

  &__body
    line-height 1.6

    p
      margin 4px 0

    ol
      margin 4px 0 8px 20px
      padding 0
</style>
