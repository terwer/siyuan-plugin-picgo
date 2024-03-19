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

const handleTest = async () => {
  try {
    const picgo = new UniversalPicGo("", isDev)
    logger.debug("picgo =>", picgo)

    const result = await picgo.upload()
    logger.info("upload success =>", result)
    ElMessage.success("upload success")
  } catch (e: any) {
    logger.error(e)
    ElMessage.error(e.toString())
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
