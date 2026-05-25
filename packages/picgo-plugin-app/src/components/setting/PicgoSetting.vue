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
import { onBeforeMount, reactive, ref } from "vue"
import { PicgoTypeEnum, type SiyuanPicGoMigrationSnapshot } from "zhi-siyuan-picgo"
import { ElMessage } from "element-plus"

const { t } = useVueI18n()
const { getBundledPicGoSetting } = useBundledPicGoSetting()
const { getExternalPicGoSetting } = useExternalPicGoSetting()

const siyuanPicgo = await SiyuanPicGoClient.getInstance()
const ctx = siyuanPicgo.ctx()
const bundledPicGoSettingForm = getBundledPicGoSetting(ctx)
const externalPicGoSettingForm = getExternalPicGoSetting(ctx)
const migrationState = ref<SiyuanPicGoMigrationSnapshot>(siyuanPicgo.getConfigMigrationState())
const migrationRetrying = ref(false)

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

const retryConfigMigration = async () => {
  migrationRetrying.value = true
  try {
    migrationState.value = await siyuanPicgo.retryConfigMigration()
    if (migrationState.value.status === "done") {
      ElMessage.success("PicGo 初始化或迁移已完成")
    } else if (migrationState.value.status === "failed") {
      ElMessage.error(`PicGo 初始化或迁移仍失败：${migrationState.value.error ?? "未知错误"}`)
    }
  } finally {
    migrationRetrying.value = false
  }
}

onBeforeMount(() => {
  // init siyuan related picgo config
  bundledPicGoSettingForm.value.siyuan = bundledPicGoSettingForm.value.siyuan || {}
  // Legacy keys are kept for config compatibility only. The new paste
  // transaction no longer depends on polling/retry settings, so they must not
  // be shown in the settings UI.
  bundledPicGoSettingForm.value.siyuan.waitTimeout = bundledPicGoSettingForm.value.siyuan.waitTimeout ?? 2
  bundledPicGoSettingForm.value.siyuan.retryTimes = bundledPicGoSettingForm.value.siyuan.retryTimes ?? 5
  bundledPicGoSettingForm.value.siyuan.autoUpload = bundledPicGoSettingForm.value.siyuan.autoUpload ?? true
  bundledPicGoSettingForm.value.siyuan.replaceLink = bundledPicGoSettingForm.value.siyuan.replaceLink ?? true
  bundledPicGoSettingForm.value.siyuan.txtImageSwitch = bundledPicGoSettingForm.value.siyuan.txtImageSwitch ?? false
})
</script>

<template>
  <back-page :title="t('setting.picgo.picgo')">
    <el-alert
      v-if="migrationState.status === 'failed'"
      class="picgo-migration-alert"
      type="error"
      :closable="false"
      show-icon
    >
      <template #title>PicGo 初始化或配置迁移失败</template>
      <div>
        <div>失败后不会在每次打开主界面时自动重试，请检查日志后点击“重试初始化”。</div>
        <div v-if="migrationState.error">错误信息：{{ migrationState.error }}</div>
        <el-button size="small" type="primary" :loading="migrationRetrying" @click="retryConfigMigration">
          重试初始化
        </el-button>
      </div>
    </el-alert>
    <el-form label-width="100px" class="picgo-setting-form">
      <el-form-item :label="t('upload.default.adaptor')" required>
        <el-select
          v-model="externalPicGoSettingForm.picgoType"
          :placeholder="t('common.select')"
          @change="handlePicgoTypeChange"
        >
          <el-option v-for="item in formData.picgoTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-divider border-style="dashed" />

      <div v-if="externalPicGoSettingForm.picgoType === PicgoTypeEnum.Bundled">
        <bundled-picgo-setting :ctx="ctx" :cfg="bundledPicGoSettingForm" />
      </div>
      <div v-else>
        <external-picgo-setting :cfg="externalPicGoSettingForm" />
      </div>

      <el-divider border-style="dashed" />

      <div>
        <el-form-item label-width="130px" :label="t('picgo.siyuan.clipboard.auto')">
          <el-switch v-model="bundledPicGoSettingForm.siyuan.autoUpload" inline-prompt size="small"></el-switch>
        </el-form-item>
        <el-form-item label-width="115px" :label="t('picgo.siyuan.replace.link')">
          <el-switch v-model="bundledPicGoSettingForm.siyuan.replaceLink" inline-prompt size="small"></el-switch>
        </el-form-item>
        <el-form-item label-width="428px" :label="t('picgo.siyuan.txt.with.img.upload')">
          <el-switch v-model="bundledPicGoSettingForm.siyuan.txtImageSwitch" inline-prompt size="small"></el-switch>
        </el-form-item>
      </div>
    </el-form>
  </back-page>
</template>

<style lang="stylus" scoped>
.picgo-setting-form
  margin-top 20px

.picgo-migration-alert
  margin 8px 0 12px

  :deep(.el-alert__content)
    width 100%

  .el-button
    margin-top 8px
</style>
