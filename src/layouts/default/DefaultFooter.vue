<!--
  - Copyright (c) 2022-2023, Terwer . All rights reserved.
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

<template>
  <div>
    <div class="footer">
      <div>
        <span class="text"> &copy;2011-{{ nowYear }} </span>
        <span class="text s-dark" @click="goGithub()">&nbsp;siyuan-plugin-picgo&nbsp;</span>

        <span class="text">v{{ v }}&nbsp;</span>

        <span class="text s-dark" @click="goAbout()">{{ t("syp.about") }}</span>

        <span class="text">.</span>
        <span class="text s-dark" @click="toggleDark()">{{
          isDark ? t("theme.mode.light") : t("theme.mode.dark")
        }}</span>

        <span class="text">.</span>
        <span class="text s-dark" @click="openTransportSetting">
          {{ t("setting.conf.transport") }}
        </span>
      </div>

      <!--
       -----------------------------------------------------------------------------
       -->
      <!-- 思源地址设置弹窗 -->

      <!-- 导出导出弹窗 -->
      <el-dialog v-model="transportFormVisible" :title="$t('setting.conf.transport')">
        <transport-select />
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useDark, useToggle } from "@vueuse/core"
import { ref } from "vue"
import { version } from "../../../package.json"
import { createAppLogger } from "~/src/utils/appLogger.ts"
import { useVueI18n } from "~/src/composables/useVueI18n.ts"
import { DateUtil } from "zhi-common"
import TransportSelect from "~/src/components/transport/TransportSelect.vue"

const logger = createAppLogger("layouts/default/DefaultFooter")
const { t } = useVueI18n()

const isDark = useDark()
const toggleDark = useToggle(isDark)

const transportFormVisible = ref(false)

const v = ref(version)
const nowYear = DateUtil.nowYear()

const goGithub = () => {
  window.open("https://github.com/terwer/siyuan-plugin-picgo")
}

const goAbout = () => {
  window.open("https://blog.terwer.space/about")
}

const openTransportSetting = () => {
  transportFormVisible.value = true
}
</script>

<style scoped>
.footer {
  font-size: 12px;
  color: #bbb;
  text-align: center;
  padding-bottom: 8px;
}

.footer .text {
  vertical-align: middle;
}

.s-dark {
  color: var(--el-color-primary);
  cursor: pointer;
}

.middleware-tip {
  text-align: left;
}
</style>
