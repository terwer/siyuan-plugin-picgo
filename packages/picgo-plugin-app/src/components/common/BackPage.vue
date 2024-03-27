<!--
  -            GNU GENERAL PUBLIC LICENSE
  -               Version 3, 29 June 2007
  -
  -  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
  -  Everyone is permitted to copy and distribute verbatim copies
  -  of this license document, but changing it is not allowed.
  -->

<script setup lang="ts">
// uses
import { useRoute, useRouter } from "vue-router"
import { ref } from "vue"
import { createAppLogger } from "@/utils/appLogger.ts"
import { ArrowLeft } from "@element-plus/icons-vue"
import { useVueI18n } from "$composables/useVueI18n.ts"

const logger = createAppLogger("back-page")
const { t } = useVueI18n()
const router = useRouter()
const { query } = useRoute()

// props
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  hasBackEmit: {
    type: Boolean,
    default: false,
  },
})

// datas
const showBack = ref(query.showBack === "true")

// emits
const emit = defineEmits(["backEmit"])

const onBack = () => {
  if (emit && props.hasBackEmit) {
    logger.info("using backEmit do back")
    emit("backEmit")
  } else {
    logger.warn("no backEmit, using router handle back")
    router.back()
  }
}
</script>

<template>
  <div id="page-body">
    <div v-if="showBack" class="page-head">
      <el-page-header :icon="ArrowLeft" :title="t('common.back')" @click="onBack">
        <template #content>
          <div class="flex items-center">
            <span class="text-large font-600 mr-3">{{ props.title }}</span>
          </div>
        </template>
      </el-page-header>
    </div>
    <div class="page-content-box">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="stylus">
#page-body
  margin 10px 20px
</style>
