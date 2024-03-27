<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { useRouter } from "vue-router"
import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"

const router = useRouter()
const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()

const handleTestBrowser = async () => {
  await router.push({
    path: "/test/browser",
    query: { showBack: "true" },
  })
}

const handleTestElectron = async () => {
  await router.push({
    path: "/test/electron",
    query: { showBack: "true" },
  })
}
</script>

<template>
  <back-page title="组件测试">
    <div v-if="isInSiyuanOrSiyuanNewWin()" class="action-item">
      <el-button type="primary" @click="handleTestElectron">测试Electron</el-button>
    </div>
    <div v-else class="action-item">
      <el-button type="primary" @click="handleTestBrowser">测试浏览器</el-button>
    </div>
  </back-page>
</template>

<style lang="stylus" scoped>
.action-item
  margin 10px
</style>
