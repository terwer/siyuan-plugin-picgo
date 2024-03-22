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
import { createAppLogger } from "@/utils/appLogger.ts"

const logger = createAppLogger("picgo-config-setting")
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

  // 用户选择展示的图床
  showPicBedList: [] as string[],
  // 全量图床集合
  picBeds: [] as IPicBedType[],
})

const handleShowPicBedListChange = (val: ICheckBoxValueType[]) => {
  const list = formData.picBeds.map((item: IPicBedType) => {
    if (!val.includes(item.name)) {
      item.visible = false
    } else {
      item.visible = true
    }
    return item
  })
  PicgoUtil.savePicgoConfig(props.ctx, {
    "picBed.list": list,
  })
  logger.debug("保存启用的图床", list)
}

const initPicBeds = () => {
  const picBeds = PicgoUtil.getPicBeds(props.ctx)
  formData.picBeds = picBeds

  formData.showPicBedList = picBeds
    .map((item: IPicBedType) => {
      if (item.visible) {
        return item.name
      }
      return null
    })
    .filter((item: any) => item) as string[]
}

onBeforeMount(() => {
  initPicBeds()
})
</script>

<template>
  <div>
    <!-- 图床开关 -->
    <el-form-item :label="t('setting.picgo.picgo.choose.showed.picbed')" label-width="140px" required>
      <el-checkbox-group
        v-if="formData.picBeds.length > 0"
        v-model="formData.showPicBedList"
        @change="handleShowPicBedListChange"
      >
        <el-checkbox v-for="item in formData.picBeds" :key="item.name" :label="item.name" :value="item.name" />
      </el-checkbox-group>
      <div v-else class="no-beds">{{ t("upload.no.beds") }}</div>
    </el-form-item>
  </div>
</template>

<style scoped lang="stylus">
.no-beds
  color red
  font-size 12px
</style>
