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
import PicbedSetting from "$components/setting/picgo/bundled/PicbedSetting.vue"
import PicgoConfigSetting from "$components/setting/picgo/bundled/PicgoConfigSetting.vue"
import PicgoPluginSetting from "$components/setting/picgo/bundled/PicgoPluginSetting.vue"
import { useSiyuanDevice } from "$composables/useSiyuanDevice.ts"
import { isSiyuanProxyAvailable } from "zhi-siyuan-picgo"

const { t } = useVueI18n()
const { isInSiyuanOrSiyuanNewWin } = useSiyuanDevice()

type SettingType = "picbed" | "picgo-config" | "picgo-plugin"

const props = defineProps({
  ctx: {
    type: Object,
    default: null,
  },
  cfg: {
    type: Object,
    default: null,
  },
})

const formData = reactive({
  cfg: props.cfg,

  settingType: "picbed" as SettingType,
})
</script>

<template>
  <div>
    <el-form-item v-if="!isSiyuanProxyAvailable(formData.cfg.siyuan.proxy)" :label="t('setting.cors.title')">
      <el-input v-model="formData.cfg.picBed.proxy" :placeholder="t('setting.cors.title.tip')" />
      <div>
        <a href="https://siyuan.wiki/s/20240312140915-rvxrqp2" target="_blank">
          {{ t("setting.picgo.refer.to.here") }}
        </a>
      </div>
    </el-form-item>

    <!-- 图床设置 -->
    <el-radio-group :key="formData.settingType" v-model="formData.settingType" class="bundled-setting-group">
      <el-radio-button key="picbed" value="picbed">图床设置</el-radio-button>
      <el-radio-button key="picgo-config" value="picgo-config">PicGo设置</el-radio-button>
      <el-radio-button v-if="isInSiyuanOrSiyuanNewWin()" key="picgo-plugin" value="picgo-plugin"
        >插件商店</el-radio-button
      >
    </el-radio-group>
    <picbed-setting v-if="formData.settingType === 'picbed'" :ctx="props.ctx" :cfg="formData.cfg" />
    <picgo-config-setting v-if="formData.settingType === 'picgo-config'" :ctx="props.ctx" :cfg="formData.cfg" />
    <picgo-plugin-setting
      v-if="isInSiyuanOrSiyuanNewWin() && formData.settingType === 'picgo-plugin'"
      :ctx="props.ctx"
      :cfg="formData.cfg"
    />
  </div>
</template>

<style scoped lang="stylus">
.bundled-setting-group
  margin-bottom 6px
</style>
