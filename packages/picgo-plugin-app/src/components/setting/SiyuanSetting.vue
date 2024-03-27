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
import { useSiyuanSetting } from "@/stores/useSiyuanSetting.ts"

const { t } = useVueI18n()
const { getSiyuanSetting } = useSiyuanSetting()

const siyuanSettingForm = getSiyuanSetting()
</script>

<template>
  <back-page :title="t('siyuan.setting.title')">
    <el-form label-width="100px" class="siyuan-setting-form">
      <el-form-item :label="t('setting.blog.siyuan.apiurl')" prop="apiUrl">
        <el-input
          v-model="siyuanSettingForm.apiUrl"
          autocomplete="off"
          :placeholder="t('setting.blog.siyuan.apiurl.tip')"
        />
      </el-form-item>
      <el-form-item :label="t('setting.blog.siyuan.password')" prop="pwd">
        <el-input
          v-model="siyuanSettingForm.password"
          type="password"
          autocomplete="off"
          :placeholder="t('setting.blog.siyuan.password.tip')"
          show-password
        />
      </el-form-item>
    </el-form>
  </back-page>
</template>

<style lang="stylus" scoped>
.siyuan-setting-form
  margin-top 20px
</style>
