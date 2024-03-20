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
    <el-tabs tab-position="left">
      <el-tab-pane :label="t('setting.picgo.picbed')">
        <picgo-setting />
      </el-tab-pane>
      <el-tab-pane :label="t('siyuan.config.setting')">
        <siyuan-setting />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped></style>
