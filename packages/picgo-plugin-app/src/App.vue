<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2023-2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<template>
  <app-layout>
    <router-view></router-view>
  </app-layout>
</template>

<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue"

// element-plus style
import "element-plus/dist/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"

// global style
import "~/src/assets/style.css"
import "~/src/assets/style.dark.css"
</script>
