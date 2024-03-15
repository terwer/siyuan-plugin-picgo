<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { UniversalPicGo } from "universal-picgo"
import { createAppLogger } from "@/utils/appLogger.ts"
import { ElMessage } from "element-plus"

const logger = createAppLogger("picgo-index")

const handleTest = () => {
  try {
    const picgo = new UniversalPicGo()
    logger.debug("picgo =>", picgo)

    picgo.upload()
    ElMessage.success("success")
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
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
