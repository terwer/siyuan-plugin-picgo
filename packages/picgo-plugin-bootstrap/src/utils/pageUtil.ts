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
   * 富文本标题片段同样带有 protyle 类，且隐藏标签页里的标题片段不会被 fn__none
   * 过滤，只按文档顺序取第一个 protyle 会命中标题片段（issue #2087）。
   */
  public static getActiveProtyleElement(): HTMLElement | null {
    return document.querySelector<HTMLElement>("div.protyle:not(.fn__none):not(.protyle-lite-fragment)")
  }

  public static getPageId() {
    return this.getActiveEditorScope().pageId
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

    const protyleTitleElement = protyleElement.querySelector("div.protyle-title")
    const pageId = protyleTitleElement?.hasAttribute("data-node-id")
      ? protyleTitleElement.getAttribute("data-node-id") ?? ""
      : ""

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
