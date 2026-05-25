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
import { nextTick, ref, watch } from "vue"

const { t } = useVueI18n()
const { reloadNoticeState, clearRuntimeReloadRequired } = useRuntimeReloadNotice()
const noticeRef = ref<HTMLElement>()

const isScrollable = (element: HTMLElement) => {
  const style = window.getComputedStyle(element)
  const overflowY = style.overflowY
  return /(auto|scroll|overlay)/.test(overflowY) && element.scrollHeight > element.clientHeight
}

const requestShellScrollTop = () => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "siyuan-plugin-picgo:shell-scroll-top" }, "*")
  }
}

const forceScrollToNotice = () => {
  requestShellScrollTop()
  const noticeElement = noticeRef.value
  const scrollOptions: ScrollToOptions = { top: 0, left: 0, behavior: "auto" }

  window.scrollTo(scrollOptions)
  document.scrollingElement?.scrollTo(scrollOptions)
  document.documentElement.scrollTo(scrollOptions)
  document.body.scrollTo(scrollOptions)

  const appRoot = document.getElementById("app")
  appRoot?.scrollTo(scrollOptions)

  let parent = noticeElement?.parentElement
  while (parent) {
    if (isScrollable(parent)) {
      parent.scrollTo(scrollOptions)
      parent.scrollTop = 0
    }
    parent = parent.parentElement
  }

  noticeElement?.scrollIntoView({ block: "start", behavior: "auto" })
}

watch(
  () => reloadNoticeState.value.createdAt,
  async (createdAt) => {
    if (!reloadNoticeState.value.required || !createdAt) {
      return
    }

    await nextTick()
    forceScrollToNotice()
    window.setTimeout(forceScrollToNotice, 0)
    window.setTimeout(forceScrollToNotice, 80)
  }
)
</script>

<template>
  <div v-if="reloadNoticeState.required" ref="noticeRef" class="runtime-reload-notice">
    <el-alert type="warning" :closable="false" show-icon>
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
  </div>
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
