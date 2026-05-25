/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { onBeforeUnmount, onMounted, ref } from "vue"

interface RuntimeReloadNoticeState {
  required: boolean
  reason: string
  createdAt: number
}

const STORAGE_KEY = "siyuan-plugin-picgo/runtime-reload-required"
const EVENT_NAME = "siyuan-plugin-picgo-runtime-reload-required-change"

const emptyState = (): RuntimeReloadNoticeState => ({
  required: false,
  reason: "",
  createdAt: 0,
})

const readReloadNoticeState = (): RuntimeReloadNoticeState => {
  if (typeof window === "undefined" || !window.localStorage) {
    return emptyState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState()
  } catch {
    return emptyState()
  }
}

const reloadNoticeState = ref<RuntimeReloadNoticeState>(readReloadNoticeState())

const writeReloadNoticeState = (state: RuntimeReloadNoticeState) => {
  reloadNoticeState.value = state
  if (typeof window === "undefined" || !window.localStorage) {
    return
  }

  if (state.required) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }))
}

const onRuntimeReloadNoticeChanged = (event: Event) => {
  const customEvent = event as CustomEvent<RuntimeReloadNoticeState>
  reloadNoticeState.value = customEvent.detail ?? readReloadNoticeState()
}

export const markRuntimeReloadRequired = (reason: string) => {
  writeReloadNoticeState({
    required: true,
    reason,
    createdAt: Date.now(),
  })
}

export const clearRuntimeReloadRequired = () => {
  writeReloadNoticeState(emptyState())
}

export const useRuntimeReloadNotice = () => {
  onMounted(() => {
    reloadNoticeState.value = readReloadNoticeState()
    window.addEventListener(EVENT_NAME, onRuntimeReloadNoticeChanged)
  })

  onBeforeUnmount(() => {
    window.removeEventListener(EVENT_NAME, onRuntimeReloadNoticeChanged)
  })

  return {
    reloadNoticeState,
    clearRuntimeReloadRequired,
  }
}

export type { RuntimeReloadNoticeState }
