<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { createAppLogger } from "@/utils/appLogger.ts"
import { isDev } from "@/utils/Constants.ts"
import { ElMessage } from "element-plus"
import { UniversalPicGo } from "universal-picgo"

const logger = createAppLogger("picgo-browser-index")

const handleTest = () => {
  try {
    const picgo = new UniversalPicGo("", isDev)
    logger.debug("picgo =>", picgo)

    picgo.upload()
    ElMessage.success("success")
  } catch (e: any) {
    ElMessage.error(e.toString())
    logger.error(e)
  }
}
</script>

<template>
  <div>
    <h1>PicGO index</h1>
    <el-button type="primary" @click="handleTest">测试浏览器</el-button>
  </div>
</template>

<style scoped></style>
