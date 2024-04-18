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
import { useBundledPicGoSetting } from "@/stores/useBundledPicGoSetting.ts"
import { useExternalPicGoSetting } from "@/stores/useExternalPicGoSetting.ts"
import { SiyuanPicGoClient } from "@/utils/SiyuanPicGoClient.ts"
import { onBeforeMount, reactive } from "vue"
import { PicgoTypeEnum } from "zhi-siyuan-picgo"

const { t } = useVueI18n()
const { getBundledPicGoSetting } = useBundledPicGoSetting()
const { getExternalPicGoSetting } = useExternalPicGoSetting()

const siyuanPicgo = await SiyuanPicGoClient.getInstance()
const ctx = siyuanPicgo.ctx()
const bundledPicGoSettingForm = getBundledPicGoSetting(ctx)
const externalPicGoSettingForm = getExternalPicGoSetting(ctx)

const formData = reactive({
  picgoTypeList: [
    {
      value: PicgoTypeEnum.Bundled,
      label: t("upload.adaptor.bundled"),
    },
    {
      value: PicgoTypeEnum.App,
      label: t("upload.adaptor.app"),
    },
    // {
    //   value: PicgoTypeEnum.Core,
    //   label: t("upload.adaptor.core"),
    // },
  ],
})

const handlePicgoTypeChange = (val: any) => {
  const isBundled = val === PicgoTypeEnum.Bundled
  externalPicGoSettingForm.value.useBundledPicgo = isBundled
}

onBeforeMount(() => {
  // init siyuan related picgo config
  bundledPicGoSettingForm.value.siyuan = bundledPicGoSettingForm.value.siyuan || {}
  bundledPicGoSettingForm.value.siyuan.waitTimeout = bundledPicGoSettingForm.value.siyuan.waitTimeout ?? 2
  bundledPicGoSettingForm.value.siyuan.retryTimes = bundledPicGoSettingForm.value.siyuan.retryTimes ?? 5
  bundledPicGoSettingForm.value.siyuan.autoUpload = bundledPicGoSettingForm.value.siyuan.autoUpload ?? true
  bundledPicGoSettingForm.value.siyuan.replaceLink = bundledPicGoSettingForm.value.siyuan.replaceLink ?? true
  bundledPicGoSettingForm.value.siyuan.txtImageSwitch = bundledPicGoSettingForm.value.siyuan.txtImageSwitch ?? false
})
</script>

<template>
  <back-page :title="t('setting.picgo.picgo')">
    <el-form label-width="100px" class="picgo-setting-form">
      <el-form-item label-width="110px" :label="t('picgo.siyuan.wait.timeout')" required>
        <el-input
          v-model="bundledPicGoSettingForm.siyuan.waitTimeout"
          :placeholder="t('picgo.siyuan.wait.timeout.tip')"
        />
      </el-form-item>
      <el-form-item label-width="87px" :label="t('picgo.siyuan.wait.retryTimes')" required>
        <el-input
          v-model="bundledPicGoSettingForm.siyuan.retryTimes"
          :placeholder="t('picgo.siyuan.wait.retryTimes.tips')"
        />
      </el-form-item>
      <el-form-item label-width="130px" :label="t('picgo.siyuan.clipboard.auto')">
        <el-switch v-model="bundledPicGoSettingForm.siyuan.autoUpload" inline-prompt size="small"></el-switch>
      </el-form-item>
      <el-form-item label-width="115px" :label="t('picgo.siyuan.replace.link')">
        <el-switch v-model="bundledPicGoSettingForm.siyuan.replaceLink" inline-prompt size="small"></el-switch>
      </el-form-item>
      <el-form-item label-width="428px" :label="t('picgo.siyuan.txt.with.img.upload')">
        <el-switch v-model="bundledPicGoSettingForm.siyuan.txtImageSwitch" inline-prompt size="small"></el-switch>
      </el-form-item>
      <el-form-item label-width="106px" :label="t('upload.default.adaptor')" required>
        <el-select
          v-model="externalPicGoSettingForm.picgoType"
          :placeholder="t('common.select')"
          @change="handlePicgoTypeChange"
        >
          <el-option v-for="item in formData.picgoTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <div v-if="externalPicGoSettingForm.picgoType === PicgoTypeEnum.Bundled">
        <bundled-picgo-setting :ctx="ctx" :cfg="bundledPicGoSettingForm" />
      </div>
      <div v-else>
        <external-picgo-setting :cfg="externalPicGoSettingForm" />
      </div>
    </el-form>
  </back-page>
</template>

<style lang="stylus" scoped>
.picgo-setting-form
  margin-top 20px
</style>
