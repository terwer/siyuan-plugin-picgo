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
import { computed, onBeforeMount, reactive, ref, watch } from "vue"
import { PicgoTypeEnum, type SiyuanPicGoMigrationSnapshot } from "zhi-siyuan-picgo"
import { ElMessage } from "element-plus"
import { markRuntimeReloadRequired } from "$composables/useRuntimeReloadNotice.ts"
import RuntimeReloadNotice from "$components/setting/RuntimeReloadNotice.vue"

const { t } = useVueI18n()
const { getBundledPicGoSetting } = useBundledPicGoSetting()
const { getExternalPicGoSetting } = useExternalPicGoSetting()

const siyuanPicgo = await SiyuanPicGoClient.getInstance()
const ctx = siyuanPicgo.ctx()
const bundledPicGoSettingForm = getBundledPicGoSetting(ctx)
const externalPicGoSettingForm = getExternalPicGoSetting(ctx)
const migrationState = ref<SiyuanPicGoMigrationSnapshot>(siyuanPicgo.getConfigMigrationState())
const migrationRetrying = ref(false)
const failedMigrationDomains = computed(() =>
  Object.entries(migrationState.value.domains ?? {})
    .filter(([, state]) => state.status === "failed")
    .map(([domain, state]) => ({
      domain,
      error: state.error ?? "未知错误",
    }))
)
const runtimeRelevantSiyuanKeys = {
  autoUpload: "剪切板自动上传",
  replaceLink: "替换本地链接",
  txtImageSwitch: "粘贴图片和文字混合内容上传",
} as const
const isRuntimeRelevantWatchReady = ref(false)

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
  ],
  externalModeList: [
    {
      value: "local",
      label: t("setting.picgo.external.mode.local"),
    },
    {
      value: "remote",
      label: t("setting.picgo.external.mode.remote"),
    },
  ],
})

// 外部 PicGo 模式：local = 本地 PicGo App, remote = 远程 PicList 服务
const externalMode = ref("local")

const isRemotePicListConfigured = () => {
  const url = externalPicGoSettingForm.value.picListApiUrl
  const key = externalPicGoSettingForm.value.picListApiKey
  return url && url.trim() !== "" && key && key.trim() !== ""
}

// 初始化：根据已有的配置推断当前模式
if (isRemotePicListConfigured()) {
  externalMode.value = "remote"
}

const handlePicgoTypeChange = (val: any) => {
  const isBundled = val === PicgoTypeEnum.Bundled
  externalPicGoSettingForm.value.useBundledPicgo = isBundled
}

const handleExternalModeChange = (val: string) => {
  if (val === "local") {
    // 切换到本地模式时清除远程配置，确保走 ExternalPicgo 路径
    externalPicGoSettingForm.value.picListApiKey = ""
  }
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

const getRuntimeRelevantSiyuanConfig = () => ({
  autoUpload: bundledPicGoSettingForm.value.siyuan?.autoUpload ?? true,
  replaceLink: bundledPicGoSettingForm.value.siyuan?.replaceLink ?? true,
  txtImageSwitch: bundledPicGoSettingForm.value.siyuan?.txtImageSwitch ?? false,
})

const markSiyuanRuntimeReloadRequired = (changedKeys: string[]) => {
  const changedLabels = changedKeys
    .map((key) => runtimeRelevantSiyuanKeys[key as keyof typeof runtimeRelevantSiyuanKeys])
    .filter(Boolean)
  if (changedLabels.length === 0) {
    return
  }

  markRuntimeReloadRequired(`修改思源粘贴/剪切板运行时设置：${changedLabels.join("、")}`)
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
  isRuntimeRelevantWatchReady.value = true
})

watch(
  getRuntimeRelevantSiyuanConfig,
  (nextConfig, previousConfig) => {
    if (!isRuntimeRelevantWatchReady.value || !previousConfig) {
      return
    }

    const changedKeys = Object.keys(runtimeRelevantSiyuanKeys).filter((key) => {
      const typedKey = key as keyof typeof runtimeRelevantSiyuanKeys
      return nextConfig[typedKey] !== previousConfig[typedKey]
    })
    markSiyuanRuntimeReloadRequired(changedKeys)
  },
  {
    flush: "post",
  }
)
</script>

<template>
  <back-page :title="t('setting.picgo.picgo')">
    <runtime-reload-notice />
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
        <ul v-if="failedMigrationDomains.length > 0" class="picgo-migration-domains">
          <li v-for="item in failedMigrationDomains" :key="item.domain">
            {{ item.domain }}：{{ item.error }}
          </li>
        </ul>
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
        <el-form-item :label="t('setting.picgo.external.mode.label')" required>
          <el-radio-group v-model="externalMode" @change="handleExternalModeChange">
            <el-radio
              v-for="mode in formData.externalModeList"
              :key="mode.value"
              :value="mode.value"
            >
              {{ mode.label }}
            </el-radio>
          </el-radio-group>
          <div class="external-mode-desc">
            <template v-if="externalMode === 'local'">
              {{ t("setting.picgo.external.mode.local.desc") }}
            </template>
            <template v-else>
              {{ t("setting.picgo.external.mode.remote.desc") }}
            </template>
          </div>
        </el-form-item>

        <external-picgo-setting :cfg="externalPicGoSettingForm" :mode="externalMode" />
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

.picgo-migration-domains
  margin 8px 0
  padding-left 18px

.external-mode-desc
  margin-top 6px
  font-size 12px
  color var(--b3-theme-on-surface-light, #999)
  line-height 1.5
</style>
