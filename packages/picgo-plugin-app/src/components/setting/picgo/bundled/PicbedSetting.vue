<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
import { onBeforeMount, reactive } from "vue"
import { useVueI18n } from "$composables/useVueI18n.ts"
import { PicgoUtil } from "@/utils/picgoUtil.ts"
import { DateUtil } from "zhi-common"
import MaterialSymbolsEditSquareOutline from "~icons/material-symbols/edit-square-outline"
import MaterialSymbolsLightCancelRounded from "~icons/material-symbols-light/cancel-rounded"
import MaterialSymbolsAddBoxSharp from "~icons/material-symbols/add-box-sharp"

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
  bedType: "",
  defaultBedType: "",

  // 图床数据
  picBedData: {
    showPicBedList: [] as IPicBedType[],
  },

  // 配置数据
  profileData: {
    // 默认配置I项D
    defaultConfigId: "",

    // 当前图床配置列表
    curConfigList: [] as IUploaderConfigListItem[],
    // 当前配置
    curConfig: {} as IUploaderConfigListItem,
    // 当前配置项ID
    curConfigId: "",
  },
})

/**
 * 获取当前图床
 */
const getCurrentUploader = () => {
  return (
    PicgoUtil.getPicgoConfig(formData.cfg, "picBed.uploader") ||
    PicgoUtil.getPicgoConfig(formData.cfg, "picBed.current") ||
    "smms"
  )
}

const getProfileList = (bedType: string): IUploaderConfigItem => {
  const profileList = PicgoUtil.getUploaderConfigList(props.ctx, formData.cfg, bedType)
  return profileList
}

const handlePicBedTypeChange = (item: IPicBedType) => {}

/**
 * 选择默认配置
 * @param id 配置ID
 */
function selectItem(id: string) {}

/**
 * 删除配置
 * @param id 配置ID
 */
function deleteConfig(id: string) {}

/**
 * 编辑配置
 * @param id 配置ID
 */
function editConfig(id: string) {}

/**
 * 新增配置
 */
function addNewConfig() {}

const initConfig = (bedType: string | undefined = undefined) => {
  // 获取图床列表
  const { showPicBedList } = PicgoUtil.getPicBeds(formData.cfg)

  // 默认第一个图床
  if (!bedType) {
    bedType = showPicBedList.length > 0 ? showPicBedList[0].type : "smms"
  }
  formData.bedType = bedType

  formData.picBedData.showPicBedList = showPicBedList
  const profileList = getProfileList(bedType)
  formData.profileData.curConfigList = profileList.configList
  formData.profileData.defaultConfigId = profileList.defaultId

  formData.defaultBedType = getCurrentUploader()
}

onBeforeMount(() => {
  initConfig()
})
</script>

<template>
  <div class="picbed-setting">
    <el-alert
      :title="
        t('setting.picgo.picbed.current.selected.tip') +
        formData.bedType +
        '，' +
        t('setting.picgo.picbed.current.tip') +
        formData.defaultBedType
      "
      type="success"
      :closable="false"
    />

    <!-- 图床配置列表 -->
    <div class="bed-type-list">
      <el-button-group>
        <el-button
          v-for="item in formData.picBedData.showPicBedList"
          :key="item.name"
          :type="formData.bedType === item.type ? 'primary' : ''"
          @click="handlePicBedTypeChange(item)"
          >{{ item.name }}
        </el-button>
      </el-button-group>
    </div>

    <div class="profile-box">
      <div class="profile-setting">
        <!-- 图床配置列表 -->
        <div class="profile-card-box">
          <div
            v-for="config in formData.profileData.curConfigList"
            :key="config._id"
            class="profile-card-item"
            @click="() => selectItem(config._id)"
          >
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
                    <div class="profile-action" @click.stop="editConfig(config._id)">
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
                    <div class="profile-action" @click.stop="deleteConfig(config._id)">
                      <el-icon><MaterialSymbolsLightCancelRounded /></el-icon>
                    </div>
                  </el-tooltip>
                </span>
              </div>
              <div class="profile-date">
                {{ DateUtil.formatTimestampToZhDate(config._updatedAt) }}
              </div>
              <div
                :class="{
                  selected: config._id === formData.profileData.defaultConfigId,
                }"
              >
                {{
                  config._id === formData.profileData.defaultConfigId
                    ? t("setting.picgo.picbed.selected.tip")
                    : t("setting.picgo.picbed.unselected.tip")
                }}
              </div>
            </el-card>
          </div>
          <div class="profile-card-item prifile-add-btn" @click="addNewConfig">
            <el-tooltip
              :content="t('main.opt.add')"
              class="box-item"
              effect="dark"
              placement="bottom"
              popper-class="publish-menu-tooltip"
            >
            <el-icon><MaterialSymbolsAddBoxSharp /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <!-- 配置操作 -->
        <div class="profile-action">
          <el-button class="set-default-btn" type="primary">
            {{ t("setting.picgo.picbed.set.default") }}
          </el-button>
        </div>
      </div>
    </div>
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
  cursor: pointer;
}

.profile-card-item .profile-date {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin: 10px 0;
}

.profile-card-item .selected {
  color: green;
}

.profile-action{
  display: inline-block;
  margin-left 8px;
  margin-right: 2px;
}

.prifile-add-btn{
  width: 100px;
}

.prifile-add-btn svg{
  height: 100px;
  width: 40px;
}
</style>
