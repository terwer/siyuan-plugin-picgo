/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import type PicgoPlugin from "./index"
import { buildPluginPageIndex } from "./dialog"
import { PageRoute } from "./pageRoute"
import { createAppLogger } from "./appLogger"

const logger = createAppLogger("picgo-shell")

const SHELL_ROOT_ID = "picgo-plugin-shell-root"
const SHELL_WIDTH = 760
const SHELL_HEIGHT = 680
const VIEWPORT_MARGIN = 12
const ANCHOR_GAP = 8

interface ShellRuntimeState {
  root: HTMLDivElement | null
  panel: HTMLDivElement | null
  iframe: HTMLIFrameElement | null
  anchor: HTMLElement | null
  pageIndex: string
  visible: boolean
  onPointerDown: ((event: PointerEvent) => void) | null
  onKeyDown: ((event: KeyboardEvent) => void) | null
  onResize: (() => void) | null
  onMessage: ((event: MessageEvent) => void) | null
}

const shellState: ShellRuntimeState = {
  root: null,
  panel: null,
  iframe: null,
  anchor: null,
  pageIndex: "",
  visible: false,
  onPointerDown: null,
  onKeyDown: null,
  onResize: null,
  onMessage: null,
}

const shellStyles = `
  #${SHELL_ROOT_ID} {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
  }

  #${SHELL_ROOT_ID}[aria-hidden="true"] {
    display: none;
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell {
    position: fixed;
    width: min(${SHELL_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px));
    height: min(${SHELL_HEIGHT}px, calc(100vh - 64px));
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    overflow: hidden;
    color: var(--b3-theme-on-background, #dfe0e1);
    background: var(--b3-theme-background, #1f1f1f);
    border: 1px solid var(--b3-theme-surface-lighter, rgba(255, 255, 255, 0.12));
    border-radius: 10px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.36);
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__header {
    position: relative;
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 12px;
    user-select: none;
    border-bottom: 1px solid var(--b3-theme-surface-lighter, rgba(255, 255, 255, 0.08));
    background: var(--b3-theme-surface, rgba(0, 0, 0, 0.12));
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__title {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__close {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 6px;
    color: inherit;
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    transition: background-color 0.12s ease-in-out, color 0.12s ease-in-out;
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__close:hover,
  #${SHELL_ROOT_ID} .picgo-plugin-shell__close:focus {
    background-color: var(--b3-theme-surface-lighter, rgba(255, 255, 255, 0.1));
    box-shadow: none;
    outline: none;
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--b3-theme-background, #1f1f1f);
  }

  #${SHELL_ROOT_ID} .picgo-plugin-shell__iframe {
    display: block;
    width: 100%;
    min-height: 100%;
    height: 100%;
    border: 0;
    background: var(--b3-theme-background, #1f1f1f);
  }
`

const createShellRoot = (pluginInstance: PicgoPlugin) => {
  const existingRoot = document.getElementById(SHELL_ROOT_ID) as HTMLDivElement | null
  if (existingRoot) {
    existingRoot.remove()
  }

  const root = document.createElement("div")
  root.id = SHELL_ROOT_ID
  root.setAttribute("aria-hidden", "true")

  const style = document.createElement("style")
  style.textContent = shellStyles
  root.appendChild(style)

  const panel = document.createElement("div")
  panel.className = "picgo-plugin-shell"
  panel.setAttribute("role", "dialog")
  panel.setAttribute("aria-modal", "false")
  panel.tabIndex = -1

  const header = document.createElement("div")
  header.className = "picgo-plugin-shell__header"

  const title = document.createElement("div")
  title.className = "picgo-plugin-shell__title"
  title.textContent = pluginInstance.i18n?.picgo ?? "PicGo"
  header.appendChild(title)

  const closeButton = document.createElement("button")
  closeButton.className = "picgo-plugin-shell__close"
  closeButton.type = "button"
  closeButton.title = "关闭 PicGo"
  closeButton.setAttribute("aria-label", "关闭 PicGo")
  closeButton.textContent = "×"
  closeButton.addEventListener("click", () => {
    destroyPluginShell()
  })
  header.appendChild(closeButton)
  panel.appendChild(header)

  const body = document.createElement("div")
  body.className = "picgo-plugin-shell__body"

  const iframe = document.createElement("iframe")
  iframe.className = "picgo-plugin-shell__iframe"
  iframe.title = pluginInstance.i18n?.picgo ?? "PicGo"
  iframe.setAttribute("allow", "clipboard-read; clipboard-write")
  body.appendChild(iframe)
  panel.appendChild(body)

  root.appendChild(panel)
  document.body.appendChild(root)

  shellState.root = root
  shellState.panel = panel
  shellState.iframe = iframe

  bindShellListeners()
}

const scrollPluginShellToTop = () => {
  const body = shellState.panel?.querySelector(".picgo-plugin-shell__body") as HTMLDivElement | null
  body?.scrollTo({ top: 0, left: 0, behavior: "auto" })
  if (body) {
    body.scrollTop = 0
  }

  try {
    const iframeWindow = shellState.iframe?.contentWindow
    const iframeDocument = iframeWindow?.document
    iframeWindow?.scrollTo({ top: 0, left: 0, behavior: "auto" })
    iframeDocument?.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "auto" })
    iframeDocument?.documentElement.scrollTo({ top: 0, left: 0, behavior: "auto" })
    iframeDocument?.body.scrollTo({ top: 0, left: 0, behavior: "auto" })
  } catch {
    // Same-origin in normal plugin runtime. Ignore if a fallback/debug frame blocks access.
  }
}

const bindShellListeners = () => {
  if (!shellState.onPointerDown) {
    shellState.onPointerDown = (event: PointerEvent) => {
      if (!shellState.visible || !shellState.root) {
        return
      }

      const target = event.target as Node | null
      if (!target) {
        return
      }

      if (shellState.root.contains(target) || shellState.anchor?.contains(target)) {
        return
      }

      hidePluginShell()
    }
    document.addEventListener("pointerdown", shellState.onPointerDown, true)
  }

  if (!shellState.onKeyDown) {
    shellState.onKeyDown = (event: KeyboardEvent) => {
      if (!shellState.visible) {
        return
      }

      if (event.key === "Escape") {
        hidePluginShell()
      }
    }
    document.addEventListener("keydown", shellState.onKeyDown, true)
  }

  if (!shellState.onResize) {
    shellState.onResize = () => {
      if (shellState.visible) {
        positionShell()
      }
    }
    window.addEventListener("resize", shellState.onResize)
    window.addEventListener("scroll", shellState.onResize, true)
  }

  if (!shellState.onMessage) {
    shellState.onMessage = (event: MessageEvent) => {
      if (event.source !== shellState.iframe?.contentWindow) {
        return
      }

      if (event.data?.type === "siyuan-plugin-picgo:shell-scroll-top") {
        scrollPluginShellToTop()
        window.setTimeout(scrollPluginShellToTop, 0)
        window.setTimeout(scrollPluginShellToTop, 80)
      }
    }
    window.addEventListener("message", shellState.onMessage)
  }
}

const unbindShellListeners = () => {
  if (shellState.onPointerDown) {
    document.removeEventListener("pointerdown", shellState.onPointerDown, true)
    shellState.onPointerDown = null
  }

  if (shellState.onKeyDown) {
    document.removeEventListener("keydown", shellState.onKeyDown, true)
    shellState.onKeyDown = null
  }

  if (shellState.onResize) {
    window.removeEventListener("resize", shellState.onResize)
    window.removeEventListener("scroll", shellState.onResize, true)
    shellState.onResize = null
  }

  if (shellState.onMessage) {
    window.removeEventListener("message", shellState.onMessage)
    shellState.onMessage = null
  }
}

const getShellSize = () => {
  const width = Math.min(SHELL_WIDTH, Math.max(320, window.innerWidth - VIEWPORT_MARGIN * 2))
  const height = Math.min(SHELL_HEIGHT, Math.max(360, window.innerHeight - 64))
  return { width, height }
}

const positionShell = () => {
  const panel = shellState.panel
  if (!panel) {
    return
  }

  const { width, height } = getShellSize()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const anchorRect = shellState.anchor?.getBoundingClientRect()

  const fallbackTop = 48
  const fallbackRight = VIEWPORT_MARGIN
  const topFromAnchor = anchorRect ? anchorRect.bottom + ANCHOR_GAP : fallbackTop
  const rightFromAnchor = anchorRect ? viewportWidth - anchorRect.right : fallbackRight

  const top = Math.min(Math.max(topFromAnchor, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN))
  const left = Math.min(
    Math.max(viewportWidth - rightFromAnchor - width, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN)
  )

  panel.style.width = `${width}px`
  panel.style.height = `${height}px`
  panel.style.top = `${top}px`
  panel.style.left = `${left}px`
}

const reloadPluginShellFrame = (pageIndex: string) => {
  const iframe = shellState.iframe
  if (!iframe) {
    return
  }

  if (shellState.pageIndex === pageIndex && iframe.contentWindow) {
    try {
      iframe.contentWindow.location.reload()
      return
    } catch (e) {
      logger.warn("reload mounted shell iframe failed, fallback to src reset", e)
    }
  }

  iframe.src = pageIndex
  shellState.pageIndex = pageIndex
}

export const openPluginShell = (pluginInstance: PicgoPlugin, pageKey: PageRoute = PageRoute.Page_Home, anchor?: HTMLElement | null) => {
  if (!shellState.root || !shellState.panel || !shellState.iframe) {
    createShellRoot(pluginInstance)
  }

  const pageIndex = buildPluginPageIndex(pageKey)
  shellState.anchor = anchor ?? shellState.anchor

  reloadPluginShellFrame(pageIndex)

  showPluginShell()
  logger.info("open mounted shell page =>", pageIndex)
}

export const showPluginShell = () => {
  if (!shellState.root || !shellState.panel) {
    return
  }

  shellState.root.setAttribute("aria-hidden", "false")
  shellState.visible = true
  positionShell()
  focusPluginShell()
}

export const hidePluginShell = () => {
  if (!shellState.root) {
    return
  }

  shellState.root.setAttribute("aria-hidden", "true")
  shellState.visible = false
}

export const focusPluginShell = () => {
  shellState.panel?.focus()
  try {
    shellState.iframe?.contentWindow?.focus()
  } catch {
    // ignore cross-frame focus failures; the shell frame is same-origin in normal SiYuan runtime.
  }
}

export const destroyPluginShell = () => {
  unbindShellListeners()
  shellState.root?.remove()
  shellState.root = null
  shellState.panel = null
  shellState.iframe = null
  shellState.anchor = null
  shellState.pageIndex = ""
  shellState.visible = false
}
