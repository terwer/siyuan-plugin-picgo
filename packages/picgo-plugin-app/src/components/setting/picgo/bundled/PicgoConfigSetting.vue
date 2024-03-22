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

  showPicBedList: [] as IPicBedType[],
  picBed: [] as IPicBedType[],
})

const getPicBeds = () => {
  const { picBeds, showPicBedList } = PicgoUtil.getPicBeds(formData.cfg)
  formData.picBed = picBeds
  formData.showPicBedList = showPicBedList
}

onBeforeMount(() => {
  getPicBeds()
})
</script>

<template>
  <div>
    <!-- 图床开关 -->
    <el-form-item :label="t('setting.picgo.picgo.choose.showed.picbed')" label-width="140px" required>
      <el-checkbox-group v-if="formData.showPicBedList.length > 0" v-model="formData.showPicBedList">
        <el-checkbox v-for="item in formData.picBed" :key="item.name" :label="item.name" />
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
