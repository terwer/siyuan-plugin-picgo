<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<!--suppress HtmlUnknownAttribute, TypeScriptUnresolvedReference -->
<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, watch } from "vue"
import { useVueI18n } from "$composables/useVueI18n.ts"
import MaterialSymbolsShoppingBagOutlineSharp from "~icons/material-symbols/shopping-bag-outline-sharp"
import MaterialSymbolsDownload from "~icons/material-symbols/download"
import { IPicGoPlugin, PicgoHelper, win, handleStreamlinePluginName } from "zhi-siyuan-picgo"
import _ from "lodash-es"
import { createAppLogger } from "@/utils/appLogger.ts"
import MaterialSymbolsSettings from "~icons/material-symbols/settings"
import PhBellSimpleSlashFill from "~icons/ph/bell-simple-slash-fill"
import IconoirXmark from "~icons/iconoir/xmark"
import { PicgoHelperEvents } from "zhi-siyuan-picgo/src"
import { ElMessage, ElMessageBox } from "element-plus"

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

const logger = createAppLogger("picgo-plugn-store")
const { t } = useVueI18n()

const defaultLogo = ref(`this.src="/plugins/siyuan-plugin-picgo/images/picgo-logo.png"`)
const formData = reactive({
  cfg: props.cfg,

  // plugin list
  loading: false,
  searchText: "",
  pluginList: [] as IPicGoPlugin[],
  pluginNameList: [] as string[],

  // plugin config form
  showConfigForm: false,
  configFormTitle: "",
  pluginConfigData: {
    currentType: "plugin",
    configName: "",
    config: {},
  },
})
const npmSearchText = computed(() => {
  return formData.searchText.match("picgo-plugin-")
    ? formData.searchText
    : formData.searchText !== ""
    ? `picgo-plugin-${formData.searchText}`
    : formData.searchText
})
let getSearchResult: any
// PicGo 持久化操作帮助类
const picgoHelper = new PicgoHelper(props.ctx, formData.cfg)

const goAwesomeList = () => {
  window.open("https://github.com/PicGo/Awesome-PicGo")
}

const openHomepage = (url: string) => {
  if (url) {
    window.open(url)
  }
}

const handleImportLocalPlugin = () => {}

const handleSearchResult = (item: INPMSearchResultObject) => {
  const name = handleStreamlinePluginName(item.package.name)
  let gui = false
  if (item.package.keywords && item.package.keywords.length > 0) {
    if (item.package.keywords.includes("picgo-gui-plugin")) {
      gui = true
    }
  }

  return {
    name,
    fullName: item.package.name,
    author: item.package.author.name,
    description: item.package.description,
    logo: `https://cdn.jsdelivr.net/npm/${item.package.name}/logo.png`,
    config: {},
    homepage: item.package.links ? item.package.links.homepage : "",
    hasInstall: formData.pluginNameList.some((plugin: string) => plugin === item.package.name),
    version: item.package.version,
    gui,
    ing: false, // installing or uninstalling
  }
}

const cleanSearch = () => {
  formData.searchText = ""
}

const _getSearchResult = (val: string) => {
  const fetchUrl = `https://registry.npmjs.com/-/v1/search?text=${val}`
  logger.info("npmjs请求fetchUrl=>", fetchUrl)
  formData.loading = true
  fetch(fetchUrl)
    .then(async (response) => {
      const json = await response.json() // 返回的json
      const list: INPMSearchResultObject[] = json?.objects ?? []
      logger.info("npmjs返回的package列表list=>", list)

      formData.pluginList = list
        .filter((item: INPMSearchResultObject) => {
          return item.package.name.includes("picgo-plugin-")
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
      formData.loading = false
    })
    .catch((err) => {
      console.log(err)
      formData.loading = false
    })
}

const installPlugin = (item: IPicGoPlugin) => {
  if (!item.gui) {
    ElMessageBox.confirm(t("setting.picgo.plugin.gui.not.implemented"), t("main.opt.tip"), {
      confirmButtonText: t("main.opt.ok"),
      cancelButtonText: t("main.opt.cancel"),
      type: "warning",
    })
      .then(async () => {
        item.ing = true
        try {
          await picgoHelper.installPlugin(item.fullName)
        } catch (e) {
          ElMessage({
            type: "error",
            message: t("main.opt.failure") + "=>" + e,
          })
          logger.error(t("main.opt.failure") + "=>" + e)
        }
      })
      .catch(() => {
        logger.warn("Install canceled")
      })
  } else {
    item.ing = true
    picgoHelper.installPlugin(item.fullName)
  }
}

const buildContextMenu = async (plugin: IPicGoPlugin) => {
  picgoHelper.buildPluginMenu(plugin)
}

const handlePicgoConfigPlugin = (args: { currentType: string; configName: string; config: any }) => {
  logger.debug("handlePicgoConfigPlugin args =>", args)

  // set form data
  formData.pluginConfigData.currentType = args.currentType
  formData.pluginConfigData.configName = args.configName
  formData.pluginConfigData.config = args.config

  // show form
  formData.showConfigForm = true
  formData.configFormTitle = `插件配置 - ${args.configName}`
}

const checkWork = (item: IPicGoPlugin) => {
  const WORKED_PLUGINS = ["watermark-elec", "s3", "minio"]
  return WORKED_PLUGINS.includes(item.name)
}

const loadPluginList = () => {
  // load plugin
  const pluginList = picgoHelper.getPluginList()
  formData.pluginList = pluginList
  formData.pluginNameList = pluginList.map((item: any) => item.fullName)
}

const initPage = () => {
  // load pluginlist
  loadPluginList()

  // show search reault after delay
  getSearchResult = _.debounce(_getSearchResult, 50)
  logger.debug("picgo plugin store inited", formData.pluginList)
}

watch(npmSearchText, (val: string) => {
  if (val) {
    formData.pluginList = []
    getSearchResult(val)
  } else {
    loadPluginList()
  }
})

onBeforeMount(() => {
  // bind events
  picgoHelper.bindPicgoEvent(PicgoHelperEvents.REFRESH_PLUGIN_LIST, initPage)
  picgoHelper.bindPicgoEvent(PicgoHelperEvents.DO_PICGO_CONFIG_PLUGIN, handlePicgoConfigPlugin)

  // init
  initPage()
})

onBeforeUnmount(() => {
  // unbind events
  picgoHelper.unbindPicgoEvent(PicgoHelperEvents.REFRESH_PLUGIN_LIST, initPage)
  picgoHelper.unbindPicgoEvent(PicgoHelperEvents.DO_PICGO_CONFIG_PLUGIN, handlePicgoConfigPlugin)
})
</script>

<template>
  <div class="plugin-setting">
    <!-- 头部 -->
    <div class="view-title">
      {{ t("setting.picgo.plugin") }} -
      <el-tooltip :content="t('setting.picgo.plugin.list')" placement="right">
        <el-button class="el-icon-goods" @click="goAwesomeList">
          <el-icon>
            <MaterialSymbolsShoppingBagOutlineSharp />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="t('setting.picgo.plugin.import.local')" placement="left">
        <el-button class="el-icon-download" @click="handleImportLocalPlugin">
          <el-icon>
            <MaterialSymbolsDownload />
          </el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 插件列表 -->
    <div class="plugin-list-box">
      <div class="plugin-search-box">
        <el-row class="handle-bar" :class="{ 'cut-width': formData.pluginList.length > 6 }">
          <el-input v-model="formData.searchText" :placeholder="t('setting.picgo.plugin.search.placeholder')">
            <template #suffix>
              <el-icon class="el-input__icon" style="cursor: pointer" @click="cleanSearch">
                <IconoirXmark />
              </el-icon>
            </template>
          </el-input>
        </el-row>
      </div>
      <div class="plugin-list-tip">
        {{ "当前共有" + formData.pluginList.length + "个插件。" }}
      </div>
      <div>
        <el-row v-loading="formData.loading" :gutter="10" class="plugin-list">
          <el-col v-for="item in formData.pluginList" :key="item.fullName" class="plugin-item__container" :span="12">
            <div class="plugin-item">
              <div v-if="!item.gui" class="unavailable-only-badge" title="Unavailable">Unavailable</div>
              <img class="plugin-item__logo" :src="item.logo" :onerror="defaultLogo" alt="img" />
              <div class="plugin-item__content" :class="{ disabled: !item.enabled }">
                <div class="plugin-item__name" @click="openHomepage(item.homepage)">
                  {{ item.name }} <small>{{ " " + item.version }}</small>
                </div>
                <div class="plugin-item__desc" :title="item.description">
                  {{ item.description }}
                </div>
                <div class="plugin-item__info-bar">
                  <span class="plugin-item__author">
                    {{ item.author }}
                  </span>
                  <span class="plugin-item__config">
                    <template v-if="formData.searchText">
                      <span v-if="checkWork(item)" class="config-button work">
                        {{ t("setting.picgo.plugin.work") }}
                      </span>
                      <span v-else class="config-button nowork">
                        {{ t("setting.picgo.plugin.nowork") }}
                      </span>
                      <template v-if="!item.hasInstall">
                        <span
                          v-if="!item.ing && checkWork(item)"
                          class="config-button install"
                          @click="installPlugin(item)"
                        >
                          {{ t("setting.picgo.plugin.install") }}
                        </span>
                        <span v-else-if="!item.ing && !checkWork(item)" class="config-button ing">
                          {{ t("setting.picgo.plugin.nouse") }}
                        </span>
                        <span v-else-if="item.ing" class="config-button ing">
                          {{ t("setting.picgo.plugin.installing") }}
                        </span>
                      </template>
                      <span v-else class="config-button ing">
                        {{ t("setting.picgo.plugin.installed") }}
                      </span>
                    </template>
                    <template v-else>
                      <span v-if="item.ing" class="config-button ing">
                        {{ t("setting.picgo.plugin.doing.something") }}
                      </span>
                      <template v-else>
                        <el-icon v-if="item.enabled" class="el-icon-setting" @click="buildContextMenu(item)">
                          <MaterialSymbolsSettings />
                        </el-icon>
                        <el-icon v-else class="el-icon-remove-outline" @click="buildContextMenu(item)">
                          <PhBellSimpleSlashFill />
                        </el-icon>
                      </template>
                    </template>
                  </span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
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
      <!-- 插件自定义配置表单 -->
      <div class="plugin-config-form">
        <config-form
          :id="formData.pluginConfigData.currentType"
          :ctx="ctx"
          :cfg="formData.cfg"
          :config-type="formData.pluginConfigData.currentType"
          :config-id="formData.pluginConfigData.configName"
          :config="formData.pluginConfigData.config"
          :is-new-form="false"
        />
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="stylus">
$darwinBg = #172426
.plugin-setting
  margin-top 10px
  position relative
  padding 0 20px 0

  .el-loading-mask
    background-color rgba(0, 0, 0, 0.8)

  .plugin-list-tip
    padding: 8px 15px;

  .plugin-list
    align-content flex-start
    box-sizing: border-box;
    padding: 8px 15px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    top: 10px;
    left: 5px;
    transition: all 0.2s ease-in-out 0.1s;
    width: 100%

    .el-loading-mask
      left: 20px
      width: calc(100% - 40px)

  .view-title
    color var(--custom-app-color)
    font-size 20px
    text-align center
    margin 10px auto
    position relative

    button
      height 24px
      margin-top -4px
      border none
      padding-left 12px
      width 24px

    button:hover, button:focus
      background transparent

    button.el-icon-goods
      margin-left 4px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out

      &:hover
        color #49B1F5

    button.el-icon-download
      position absolute
      right 0
      top 8px
      font-size 20px
      vertical-align middle
      cursor pointer
      transition color .2s ease-in-out

      &:hover
        color #49B1F5

  .handle-bar
    margin-bottom 20px

    &.cut-width
      padding-right: 8px

  .el-input__inner
    border-radius 0

  .plugin-item
    box-sizing border-box
    height 80px
    background #444
    padding 8px
    user-select text
    transition all .2s ease-in-out
    position relative

    &__container
      height 80px
      margin-bottom 10px

    .unavailable-only-badge
      position absolute
      right 0
      top 0
      font-size 12px
      padding 3px 8px
      background #49B1F5
      color #eee

    &.darwin
      background transparentify($darwinBg, #000, 0.75)

      &:hover
        background transparentify($darwinBg, #000, 0.85)

    &:hover
      background #333

    &__logo
      width 64px
      height 64px
      float left

    &__content
      float left
      width calc(100% - 72px)
      height 64px
      color #ddd
      margin-left 8px
      display flex
      flex-direction column
      justify-content space-between

      &.disabled
        color #aaa

    &__name
      font-size 16px
      height 22px
      line-height 22px
      // font-weight 600
      font-weight 600
      cursor pointer
      transition all .2s ease-in-out

      &:hover
        color: #1B9EF3

    &__desc
      font-size 14px
      height 21px
      line-height 21px
      overflow hidden
      text-overflow ellipsis
      white-space nowrap

    &__info-bar
      font-size 14px
      height 21px
      line-height 28px
      position relative

    &__author
      overflow hidden
      text-overflow ellipsis
      white-space nowrap

    &__config
      float right
      font-size 16px
      cursor pointer
      transition all .2s ease-in-out

      &:hover
        color: #1B9EF3

    .config-button
      font-size 12px
      color #ddd
      background #222
      padding 1px 8px
      height 18px
      line-height 18px
      text-align center
      position absolute
      top 4px
      right 20px
      transition all .2s ease-in-out

      &.reload
        right 0

      &.ing
        right 0

      &.install
        right 0
        width 36px

      &.work
        background: #3c8833
        margin-right: 32px
        cursor: default

      &.nowork
        background: #843333
        margin-right: 32px;
        cursor: default

        &:hover
          background: #1B9EF3
          color #fff

  .reload-mask
    position absolute
    width calc(100% - 40px)
    bottom -320px
    text-align center
    background rgba(0, 0, 0, 0.4)
    padding 10px 0

    &.cut-width
      width calc(100% - 48px)
</style>
