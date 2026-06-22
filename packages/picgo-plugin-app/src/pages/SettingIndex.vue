<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { useVueI18n } from "$composables/useVueI18n.ts"

const { t } = useVueI18n()
</script>

<template>
  <div>
    <el-tabs tab-position="left" class="setting-tab">
      <el-tab-pane :label="t('setting.picgo.picgo')">
        <Suspense>
          <picgo-setting />
          <template #fallback>
            <div style="padding: 40px; text-align: center; color: #999;">加载中...</div>
          </template>
        </Suspense>
      </el-tab-pane>
      <el-tab-pane :label="t('siyuan.config.setting')">
        <Suspense>
          <siyuan-setting />
          <template #fallback>
            <div style="padding: 40px; text-align: center; color: #999;">加载中...</div>
          </template>
        </Suspense>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="stylus" scoped>
:deep(.el-tabs__nav)
  height 600px
</style>
