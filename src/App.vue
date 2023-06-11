<!--
  - Copyright (c) 2023, Terwer . All rights reserved.
  - DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
  -
  - This code is free software; you can redistribute it and/or modify it
  - under the terms of the GNU General Public License version 2 only, as
  - published by the Free Software Foundation.  Terwer designates this
  - particular file as subject to the "Classpath" exception as provided
  - by Terwer in the LICENSE file that accompanied this code.
  -
  - This code is distributed in the hope that it will be useful, but WITHOUT
  - ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
  - FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
  - version 2 for more details (a copy is included in the LICENSE file that
  - accompanied this code).
  -
  - You should have received a copy of the GNU General Public License version
  - 2 along with this work; if not, write to the Free Software Foundation,
  - Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
  -
  - Please contact Terwer, Shenzhen, Guangdong, China, youweics@163.com
  - or visit www.terwer.space if you need additional information or have any
  - questions.
  -->

<script setup lang="ts">
import { BrowserUtil } from "zhi-device"
import { createAppLogger } from "~/src/utils/appLogger.ts"
import AppLayout from "~/src/layouts/AppLayout.vue"

// element-plus style
import "element-plus/dist/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"
// global style
import "~/src/assets/style.css"
import "~/src/assets/style.dark.css"

// const logger = createAppLogger("app-entry")

// 适配暗黑模式
// const isDark = BrowserUtil.getQueryParam("isDark") === "true"
// document.documentElement.classList.toggle("dark", isDark)
// logger.info("app entry get isDark =>", String(isDark))
</script>

<template>
  <app-layout>
    <router-view></router-view>
  </app-layout>
</template>
