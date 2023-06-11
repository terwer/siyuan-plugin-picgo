<script setup lang="ts">
import { BrowserUtil } from "zhi-device"
import { createAppLogger } from "~/src/utils/appLogger.ts"

// global style
import "~/src/assets/style.css"
import "~/src/assets/style.dark.css"

const logger = createAppLogger("app-entry")

// 适配暗黑模式
const isDark = BrowserUtil.getQueryParam("isDark") === "true"
document.documentElement.classList.toggle("dark", isDark)
logger.info("app entry get isDark =>", String(isDark))
</script>

<template>
  <router-view></router-view>
</template>
