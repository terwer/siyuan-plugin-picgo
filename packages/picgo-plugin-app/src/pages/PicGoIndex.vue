<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"

const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()
</script>

<template>
  <div class="picgo-body">
    <electron-index v-if="isInSiyuanOrSiyuanNewWin()" />
    <browser-index v-else />
  </div>
</template>

<style lang="stylus" scoped>
.picgo-body
  padding: 16px
</style>
