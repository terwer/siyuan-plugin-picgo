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
import { reactive } from "vue"
import { PicgoTypeEnum } from "zhi-siyuan-picgo"
import { useExternalPicGoSetting } from "@/stores/useExternalPicGoSetting.ts"
import { SiyuanPicGo } from "@/utils/siyuanPicgo.ts"
import { useBundledPicGoSetting } from "@/stores/useBundledPicGoSetting.ts"

const { getBundledPicGoSetting } = useBundledPicGoSetting()
const { getExternalPicGoSetting } = useExternalPicGoSetting()

const { t } = useVueI18n()

const siyuanPicgo = await SiyuanPicGo.getInstance()
const ctx = siyuanPicgo.ctx()
const bundledPicGoSettingForm = getBundledPicGoSetting(ctx)
const externalPicGoSettingForm = getExternalPicGoSetting(ctx)

const formData = reactive({
  picgoTypeList: [
    {
      value: PicgoTypeEnum.Bundled,
      label: t("upload.adaptor.bundled")
    },
    {
      value: PicgoTypeEnum.App,
      label: t("upload.adaptor.app")
    }
    // {
    //   value: PicgoTypeEnum.Core,
    //   label: t("upload.adaptor.core"),
    // },
  ]
})

const handlePicgoTypeChange = (val: any) => {
  const isBundled = val === PicgoTypeEnum.Bundled
  externalPicGoSettingForm.value.useBundledPicgo = isBundled
}
</script>

<template>
  <back-page :title="t('setting.picgo.picbed')">
    <el-form label-width="100px" class="picgo-setting-form">
      <el-form-item :label="t('upload.default.adaptor')">
        <el-select
          v-model="externalPicGoSettingForm.picgoType"
          :placeholder="t('common.select')"
          @change="handlePicgoTypeChange"
        >
          <el-option v-for="item in formData.picgoTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <div v-if="externalPicGoSettingForm.picgoType === PicgoTypeEnum.Bundled">
        <bundled-picgo-setting :cfg="bundledPicGoSettingForm" />
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
