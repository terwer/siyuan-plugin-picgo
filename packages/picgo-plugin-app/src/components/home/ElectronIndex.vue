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

const logger = createAppLogger("picgo-electron-index")

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

const handleTest2 = async () => {
  try {
    const picgo = new UniversalPicGo("", isDev)
    logger.debug("picgo =>", picgo)

    const result = await picgo.upload(["https://s2.loli.net/2024/03/20/VDRXZnkBaKWFhpt.png"])
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
    <div class="action-item">
      <el-button type="primary" @click="handleTest">测试electron剪切板图片</el-button>
    </div>
    <div class="action-item">
      <el-button type="primary" @click="handleTest2">测试electron远程图片</el-button>
    </div>
    <div class="action-item">
      <el-button type="primary" @click="handleTest3">测试electron本地图片路径</el-button>
    </div>
    <div class="action-item">
      <el-button type="primary" @click="handleTest4">测试electron本地图片File</el-button>
    </div>
    <div class="action-item">
      <el-button type="primary" @click="handleTest4">测试electron本地图片Base64</el-button>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.action-item
  margin 10px
</style>
