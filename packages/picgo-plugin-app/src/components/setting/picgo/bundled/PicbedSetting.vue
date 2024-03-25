<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { computed, onBeforeMount, reactive } from "vue"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { PicgoHelper } from "zhi-siyuan-picgo/src/lib/picgoHelper.ts"
import { DateUtil } from "zhi-common"
import MaterialSymbolsEditSquareOutline from "~icons/material-symbols/edit-square-outline"
import MaterialSymbolsLightCancelRounded from "~icons/material-symbols-light/cancel-rounded"
import MaterialSymbolsAddBoxSharp from "~icons/material-symbols/add-box-sharp"
import { ElMessage, ElMessageBox } from "element-plus"

const { t } = useVueI18n()

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

  // 当前选择的图床类型
  selectedBedType: "",
  dbBedType: "",

  // 图床数据
  // 注意这里需要是用户启用的类型
  picBeds: [] as IPicBedType[],

  // 配置数据
  profileData: {
    // 当前图床配置列表
    curConfigList: [] as IUploaderConfigListItem[],
    // 当前配置
    curConfig: {} as IUploaderConfigListItem,
    // 当前配置项表单
    curFormPropertiesConfig: {} as IStringKeyMap,
    // 表单配置项ID
    curFormConfigId: "" as string | undefined,
  },

  // 表单展示
  isNewForm: false,
  showConfigForm: false,
  configFormTitle: "",
})
// PicGo 持久化操作帮助类
const picgoHelper = new PicgoHelper(props.ctx, formData.cfg)

// computed
const picbedTips = computed(() => {
  const selectedBedTypeName = findPicbedName(formData.selectedBedType)
  const dbBedTypeName = findPicbedName(formData.dbBedType)

  if (formData.selectedBedType === formData.dbBedType) {
    if (!formData.profileData.curConfig._configName) {
      return t("setting.picgo.picbed.unselected.tip")
    }
    return t("setting.picgo.picbed.current.tip") + dbBedTypeName + "_" + formData.profileData.curConfig._configName
  } else {
    return (
      t("setting.picgo.picbed.current.selected.tip") +
      selectedBedTypeName +
      "，" +
      t("setting.picgo.picbed.current.tip") +
      dbBedTypeName +
      t("setting.picgo.picbed.change.tip")
    )
  }
})

const selectedPicbedTipStyle = computed(() => {
  return formData.selectedBedType === formData.dbBedType && formData.profileData.curConfig._configName
    ? "success"
    : "error"
})

const selectedPicbedStyle = (type: string) => {
  return formData.selectedBedType === type ? "primary" : ""
}

const isProfileSelected = (id: string) => {
  return formData.selectedBedType === formData.dbBedType && id === formData.profileData.curConfig._id
}

// 从formData.picBeds中查找对应type的图片床类型名称
const findPicbedName = (type: string) => formData.picBeds.find((x) => x.type === type)?.name || type

const getProfileList = (bedType: string): IUploaderConfigItem => {
  const profileList = picgoHelper.getUploaderConfigList(bedType)
  return profileList
}

const handlePicBedTypeChange = (item: IPicBedType) => {
  formData.selectedBedType = item.type
  reloadProfile()
}

const handleDrawerClose = () => {
  reloadProfile()

  if (formData.isNewForm) {
    formData.showConfigForm = false
    ElMessage.success("新配置初始化成功，请手动点击编辑")
  }
}

const handleDrawerTitleChange = (val: string) => {
  if (!formData.isNewForm) {
    formData.configFormTitle = `编辑配置_${val}`
  }
}

/**
 * 选择默认配置
 * @param id 配置ID
 */
const selectItem = (id: string) => {
  // 选中当前配置
  formData.profileData.curConfig = findProfileConfig(id)
  picgoHelper.selectUploaderConfig(formData.selectedBedType, id)

  // 设置为默认
  picgoHelper.setDefaultPicBed(formData.selectedBedType)

  // 必须先刷新 formData.cfg
  initPage()

  ElMessage.success(t("main.opt.success"))
}

/**
 * 删除配置
 *
 * @param config 配置信息
 * */
function deleteConfig(config: IUploaderConfigListItem) {
  ElMessageBox.confirm(`确认删除配置 ${config._configName} 吗？`, t("main.opt.warning"), {
    confirmButtonText: t("main.opt.ok"),
    cancelButtonText: t("main.opt.cancel"),
    type: "warning",
  })
    .then(async () => {
      try {
        picgoHelper.deleteUploaderConfig(formData.selectedBedType, config._id)
        reloadProfile()
        ElMessage.success(t("main.opt.success"))
      } catch (e) {
        ElMessage({
          type: "error",
          message: t("main.opt.failure") + "=>" + e,
        })
      }
    })
    .catch(() => {})
}

/**
 * 编辑配置
 *
 * @param config 配置信息
 */
function editConfig(config: IUploaderConfigListItem) {
  const configObj = picgoHelper.getPicBedConfig(formData.selectedBedType)
  formData.profileData.curFormPropertiesConfig = configObj.config
  formData.profileData.curFormConfigId = config._id

  formData.isNewForm = false
  formData.showConfigForm = true
  formData.configFormTitle = `编辑配置_${config._configName}`
}

/**
 * 新增配置
 */
function addNewConfig() {
  const newConfigObj = picgoHelper.getPicBedConfig(formData.selectedBedType)
  formData.profileData.curFormPropertiesConfig = newConfigObj.config
  formData.profileData.curFormConfigId = undefined

  formData.isNewForm = true
  formData.showConfigForm = true
  formData.configFormTitle = "新增配置"
}

const findProfileConfig = (id: string) => {
  return formData.profileData.curConfigList.find((x) => x._id === id) ?? ({} as IUploaderConfigListItem)
}

const reloadProfile = () => {
  const profileList = getProfileList(formData.selectedBedType)
  formData.profileData.curConfigList = profileList.configList
  formData.profileData.curConfig = findProfileConfig(profileList.defaultId)
}

const initConfig = () => {
  // 获取图床列表
  const picBeds = picgoHelper.getVisiablePicBeds()
  formData.picBeds = picBeds
  formData.dbBedType = picgoHelper.getCurrentUploader()
  formData.selectedBedType = formData.dbBedType
}

const initPage = () => {
  initConfig()
  reloadProfile()
}

onBeforeMount(() => {
  initPage()
})
</script>

<template>
  <div class="picbed-setting">
    <el-alert :title="picbedTips" :type="selectedPicbedTipStyle" :closable="false" />

    <!-- 图床配置列表 -->
    <div class="bed-type-list">
      <el-button-group class="picbed-group">
        <el-button
          v-for="item in formData.picBeds"
          :key="item.type"
          :type="selectedPicbedStyle(item.type)"
          @click="handlePicBedTypeChange(item)"
          >{{ item.name }}
        </el-button>
      </el-button-group>
    </div>

    <div class="profile-box">
      <div class="profile-setting">
        <!-- 图床配置列表 -->
        <div class="profile-card-box">
          <div v-for="config in formData.profileData.curConfigList" :key="config._id" class="profile-card-item">
            <el-card>
              <div class="profile-card-line">
                <span>{{ config._configName }}</span>
                <span class="pull-right">
                  <el-tooltip
                    :content="t('main.opt.edit')"
                    class="box-item"
                    effect="dark"
                    placement="bottom"
                    popper-class="publish-menu-tooltip"
                  >
                    <div class="profile-action opt-action" @click.stop="editConfig(config)">
                      <el-icon><MaterialSymbolsEditSquareOutline /></el-icon>
                    </div>
                  </el-tooltip>
                  <el-tooltip
                    :content="t('main.opt.delete')"
                    class="box-item"
                    effect="dark"
                    placement="bottom"
                    popper-class="publish-menu-tooltip"
                  >
                    <div class="profile-action opt-action" @click.stop="deleteConfig(config)">
                      <el-icon><MaterialSymbolsLightCancelRounded /></el-icon>
                    </div>
                  </el-tooltip>
                </span>
              </div>
              <div class="profile-date">
                {{ DateUtil.formatTimestampToZh(config._updatedAt, true) }}
              </div>
              <div
                :class="{
                  selectItem: true,
                  selected: isProfileSelected(config._id),
                }"
                title="点击可选中"
                @click="() => selectItem(config._id)"
              >
                {{
                  isProfileSelected(config._id)
                    ? t("setting.picgo.picbed.selected.tip")
                    : t("setting.picgo.picbed.unselected.tip")
                }}
              </div>
            </el-card>
          </div>
          <div class="profile-card-item opt-action profile-add-btn" @click="addNewConfig">
            <el-tooltip
              :content="t('main.opt.add')"
              class="box-item"
              effect="dark"
              placement="bottom"
              popper-class="publish-menu-tooltip"
            >
              <el-icon>
                <MaterialSymbolsAddBoxSharp />
              </el-icon>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽屉占位 -->
    <el-drawer
      v-model="formData.showConfigForm"
      size="85%"
      :title="formData.configFormTitle"
      direction="rtl"
      :destroy-on-close="true"
    >
      <!-- 图床配置表单 -->
      <div class="profile-form">
        <config-form
          :id="formData.selectedBedType"
          :ctx="ctx"
          :cfg="formData.cfg"
          config-type="uploader"
          :config="formData.profileData.curFormPropertiesConfig"
          :config-id="formData.profileData.curFormConfigId"
          :is-new-form="formData.isNewForm"
          @on-close="handleDrawerClose"
          @drawer-title-change="handleDrawerTitleChange"
        />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="stylus">
.bed-type-list {
  margin-top: 10px;
}

.profile-card-item {
  display: inline-block;
  margin-right: 10px;
  width: 48%;
  margin-top: 10px;
  margin-bottom: 10px;
  cursor: text;
}

.profile-card-item .profile-date {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin: 10px 0;
}

.profile-card-item .selectItem {
  cursor: pointer;
  color: red;
  width: max-content;
}

.profile-card-item .selected {
  color: green;
}

.profile-action {
  display: inline-block;
  margin-left 8px;
  margin-right: 2px;
}

.profile-add-btn {
  width: 100px;
}

.profile-add-btn svg {
  height: 100px;
  width: 40px;
}

.opt-action {
  cursor: pointer;
}
</style>
