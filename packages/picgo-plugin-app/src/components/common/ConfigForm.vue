<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script lang="ts" setup>
import { ElMessage, FormInstance } from "element-plus"
import { reactive, ref, toRaw, watch } from "vue"
import { IPluginConfig } from "zhi-siyuan-picgo"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { createAppLogger } from "@/utils/appLogger.ts"
import _ from "lodash-es"
import { PicgoHelper } from "zhi-siyuan-picgo/src"

const logger = createAppLogger("picbed-config-form")
const { t } = useVueI18n()

const emit = defineEmits(["on-close", "drawer-title-change"])

const props = defineProps({
  ctx: {
    type: Object,
    default: null,
  },
  cfg: {
    type: Object,
    default: null,
  },

  // 配置类型：plugin、transfer还是uploader
  configType: String,
  config: Object,

  // 对于uploader来说是图床类型
  id: String,
  // 当前配置项的uuid
  configId: String,
  isNewForm: Boolean,
})

const formData = reactive({
  cfg: props.cfg,
})
// PicGo 持久化操作帮助类
const picgoHelper = new PicgoHelper(props.ctx, formData.cfg)
const $configForm = ref<FormInstance>()

const configList = ref<IPluginConfig[]>([])
const configRuleForm = reactive<IStringKeyMap>({})

// const getConfigType = () => {
//   switch (props.configType) {
//     case "plugin": {
//       return props.id
//     }
//     case "uploader": {
//       return `picBed.${props.id}`
//     }
//     case "transformer": {
//       return `transformer.${props.id}`
//     }
//     default:
//       return "unknown"
//   }
// }

const getCurConfigFormData = () => {
  // const type = getConfigType()
  const configId = props.configId
  let curConfig: any
  switch (props.configType) {
    case "plugin": {
      curConfig = picgoHelper.getPicgoConfig(`${props.configId}`, {
        _configName: props.configId,
      })
      break
    }
    case "uploader": {
      const curTypeConfigList = picgoHelper.getUploaderConfigList(props.id as string).configList
      curConfig = curTypeConfigList.find((i: any) => i._id === configId) || {}
      break
    }
    case "transformer": {
      curConfig = picgoHelper.getPicgoConfig(`transformer.${props.configId}`, {})
      break
    }
    default:
      curConfig = {}
      break
  }
  return curConfig
}

const handleConfigChange = (val: any) => {
  const config = (props.isNewForm ? {} : getCurConfigFormData()) as any
  const configId = props.isNewForm ? undefined : props.configId
  Object.assign(configRuleForm, config)

  // 追加form属性
  const rawVal = toRaw(val)

  if (rawVal.length > 0) {
    configList.value = _.cloneDeep(rawVal).map((item: any) => {
      if (!configId) return item
      let defaultValue = item.default !== undefined ? item.default : item.type === "checkbox" ? [] : null
      if (item.type === "checkbox") {
        const defaults =
          item.choices
            ?.filter((i: any) => {
              return i.checked
            })
            .map((i: any) => i.value) || []
        defaultValue = _.union(defaultValue, defaults)
      }
      if (config && config[item.name] !== undefined) {
        defaultValue = config[item.name]
      }
      configRuleForm[item.name] = defaultValue
      return item
    })
  }

  logger.debug("完整form属性=>", configRuleForm)
  logger.debug("动态配置configList=>", configList.value)
}

const doSubmit = (val: any) => {
  logger.debug("准备保存配置val", val)
  switch (props.configType) {
    case "plugin":
      picgoHelper.savePicgoConfig({
        [`${props.configId}`]: val,
      })
      break
    case "uploader":
      picgoHelper.updateUploaderConfig(props.id as string, val?._id, val)
      break
    case "transformer":
      picgoHelper.savePicgoConfig({
        [`transformer.${props.configId}`]: val,
      })
      break
  }
}

watch(
  props.config as any,
  (val: IPluginConfig[]) => {
    logger.debug("检测到配置文件变化，val=>", val)
    handleConfigChange(val)
  },
  {
    deep: true,
    immediate: true,
  }
)

watch(
  configRuleForm,
  (val: IStringKeyMap) => {
    logger.debug("save config change to db", val)
    doSubmit(val)
    emit("drawer-title-change", val._configName)
    emit("on-close")
  },
  {
    deep: true,
    immediate: true,
  }
)
</script>

<template>
  <div class="config-form-box">
    <div class="config-form">
      <el-form ref="$configForm" label-width="120px" :model="configRuleForm">
        <el-form-item :label="t('setting.picgo.config.name')" required prop="_configName">
          <el-input v-model="configRuleForm._configName" :placeholder="t('setting.picgo.config.name.placeholder')" />
        </el-form-item>

        <!-- dynamic config -->
        <el-form-item
          v-for="(item, index) in configList"
          :key="item.name + index"
          :label="item.alias || item.name"
          :required="item.required"
          :prop="item.name"
        >
          <el-input
            v-if="item.type === 'input' || item.type === 'password'"
            v-model="configRuleForm[item.name]"
            :type="item.type === 'password' ? 'password' : 'input'"
            :placeholder="item.message || item.name"
          />
          <el-select
            v-else-if="item.type === 'list' && item.choices"
            v-model="configRuleForm[item.name]"
            :placeholder="item.message || item.name"
          >
            <el-option
              v-for="choice in item.choices"
              :key="choice.name || choice.value || choice"
              :label="choice.name || choice.value || choice"
              :value="choice.value || choice"
            />
          </el-select>
          <el-select
            v-else-if="item.type === 'checkbox' && item.choices"
            v-model="configRuleForm[item.name]"
            :placeholder="item.message || item.name"
            multiple
            collapse-tags
          >
            <el-option
              v-for="choice in item.choices"
              :key="choice.value || choice"
              :label="choice.name || choice.value || choice"
              :value="choice.value || choice"
            />
          </el-select>
          <el-switch
            v-else-if="item.type === 'confirm'"
            v-model="configRuleForm[item.name]"
            active-text="yes"
            inactive-text="no"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
