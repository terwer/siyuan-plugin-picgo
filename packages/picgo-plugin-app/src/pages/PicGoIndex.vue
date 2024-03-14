<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import SyPicgo from "../../../../libs/Universal-PicGo-Core"
import { createAppLogger } from "@/utils/appLogger.ts"

const logger = createAppLogger("picgo-index")

const handleTest = () => {
  const api = new SyPicgo()
  logger.debug("api =>", api)
}
</script>

<template>
  <div class="picgo-body">
    <h1>PicGO index</h1>
    <el-button type="primary" @click="handleTest">测试</el-button>
  </div>
</template>

<style lang="stylus" scoped>
.picgo-body
  padding: 16px
</style>
