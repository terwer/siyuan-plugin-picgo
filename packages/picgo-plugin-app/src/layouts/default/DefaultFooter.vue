<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script lang="ts" setup>
import { useDark, useToggle } from "@vueuse/core"
import { ref } from "vue"
import { version } from "../../../package.json"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { DateUtil } from "zhi-common"
import { useRouter } from "vue-router"
import { isDev } from "@/utils/Constants.ts"

const { t } = useVueI18n()
const router = useRouter()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const v = ref(version)
const nowYear = DateUtil.nowYear()

const goHome = async () => {
  await router.push({
    path: "/",
  })
}

const goGithub = () => {
  window.open("https://github.com/terwer/siyuan-plugin-picgo")
}

const goAbout = () => {
  window.open("https://blog.terwer.space/about")
}

const handleTransportSetting = async () => {
  await router.push({
    path: "/setting/transport",
    query: { showBack: "true" },
  })
}

const handlePicgoSetting = async () => {
  await router.push({
    path: "/setting/picgo",
    query: { showBack: "true" },
  })
}

const handleSiyuanSetting = async () => {
  await router.push({
    path: "/setting/siyuan",
    query: { showBack: "true" },
  })
}

const handleComponentTest = async () => {
  await router.push({
    path: "/test",
    query: { showBack: "true" },
  })
}
</script>

<template>
  <div>
    <div class="footer">
      <div>
        <span class="text"> &copy;2011-{{ nowYear }} </span>
        <span class="text s-dark" @click="goGithub()">&nbsp;siyuan-plugin-picgo&nbsp;</span>

        <span class="text" @click="goHome">v{{ v }}&nbsp;</span>

        <span class="text s-dark" @click="goAbout()">{{ t("syp.about") }}</span>

        <span class="text">.</span>
        <span class="text s-dark" @click="toggleDark()">{{
          isDark ? t("theme.mode.light") : t("theme.mode.dark")
        }}</span>

        <span class="text">.</span>
        <span class="text s-dark" @click="handleTransportSetting">
          {{ t("setting.conf.transport") }}
        </span>

        <span class="text">.</span>
        <span class="text s-dark" @click="handlePicgoSetting">
          {{ t("setting.picgo.picbed") }}
        </span>

        <span class="text">.</span>
        <span class="text s-dark" @click="handleSiyuanSetting">
          {{ t("siyuan.config.setting") }}
        </span>

        <span v-if="isDev" class="text">.</span>
        <span v-if="isDev" class="text s-dark" @click="handleComponentTest">
          {{ t("component.test") }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.footer {
  font-size: 12px;
  color: #bbb;
  text-align: center;
  padding-bottom: 8px;
}

.footer .text {
  vertical-align: middle;
}

.s-dark {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
