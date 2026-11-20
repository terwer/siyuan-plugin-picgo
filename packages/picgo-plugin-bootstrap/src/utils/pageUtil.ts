/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2023-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 当前编辑器的上传范围。
 *
 * scopeBlockId 为空表示整篇文档；有值时表示编辑器正处于聚焦（缩放）状态，
 * 只应处理该块及其子块中的资源。
 */
export interface EditorScope {
  pageId: string
  scopeBlockId?: string
}

/**
 * 文档工具类
 */
class PageUtil {
  /**
   * 当前正在显示的正文编辑器。
   *
   * 分屏时优先取活动窗口焦点页签对应的编辑器；没有页签信息时回退到第一个
   * 可见正文编辑器。富文本标题片段同样带有 protyle 类，必须排除。
   */
  public static getActiveProtyleElement(): HTMLElement | null {
    const activeTabId = document
      .querySelector(".layout__wnd--active .layout-tab-bar .item--focus[data-id]")
      ?.getAttribute("data-id")
    if (activeTabId) {
      const activeEditor = Array.from(document.querySelectorAll<HTMLElement>("div.protyle[data-id]")).find(
        (editor) => editor.getAttribute("data-id") === activeTabId
      )
      if (activeEditor) {
        return activeEditor
      }
    }

    return document.querySelector<HTMLElement>("div.protyle:not(.fn__none):not(.protyle-lite-fragment)")
  }

  public static getPageId() {
    const getTitlePageId = (title: Element | null | undefined) => title?.getAttribute("data-node-id") ?? ""

    // 活动窗口的焦点页签才是当前文档；分屏里另一个编辑器即使可见也不能当作当前文档
    const activeTabId = document
      .querySelector(".layout__wnd--active .layout-tab-bar .item--focus[data-id]")
      ?.getAttribute("data-id")
    if (activeTabId) {
      const activeEditor = Array.from(document.querySelectorAll("div.protyle[data-id]")).find(
        (editor) => editor.getAttribute("data-id") === activeTabId
      )
      const activeTitle = activeEditor?.querySelector("div.protyle-title[data-node-id]")
      if (activeTitle) {
        return getTitlePageId(activeTitle)
      }
    }

    // 回退：直接找文档标题节点，跳过隐藏页签里的标题；不依赖 protyle-lite-fragment 类名
    const titles = Array.from(document.querySelectorAll("div.protyle-title[data-node-id]"))
    return getTitlePageId(titles.find((title) => title.closest(".fn__none") === null))
  }

  /**
   * 解析当前编辑器的上传范围。
   *
   * 聚焦时思源会在面包屑显示“退出聚焦”，并且正文区第一个块就是聚焦块；
   * 用这两个 DOM 信号兜底，避免依赖编辑器内部对象。
   */
  public static getActiveEditorScope(): EditorScope {
    const protyleElement = this.getActiveProtyleElement()
    if (!protyleElement) {
      return { pageId: "" }
    }

    const pageId = this.getPageId()
    const exitFocusElement = protyleElement.querySelector('[data-type="exit-focus"]')
    const isFocused = !!exitFocusElement && !exitFocusElement.classList.contains("fn__none")
    if (!isFocused) {
      return { pageId }
    }

    // 新版思源的富文本文档标题内部也有 .protyle-wysiwyg，必须排除标题片段，
    // 否则会把标题占位块误当成聚焦块。
    const contentWysiwygElement = Array.from(protyleElement.querySelectorAll<HTMLElement>(".protyle-wysiwyg")).find(
      (element) => !element.closest(".protyle-title") && !element.closest(".protyle-lite-fragment")
    )
    const firstBlockElement = contentWysiwygElement?.firstElementChild
    const scopeBlockId = firstBlockElement?.getAttribute("data-node-id") ?? ""
    return {
      pageId,
      scopeBlockId: scopeBlockId && scopeBlockId !== pageId ? scopeBlockId : undefined,
    }
  }
}

export default PageUtil
