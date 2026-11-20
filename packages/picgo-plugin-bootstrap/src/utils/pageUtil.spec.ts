// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest"
import PageUtil from "./pageUtil"

afterEach(() => {
  document.body.innerHTML = ""
})

describe("PageUtil.getPageId", () => {
  it("返回活动文档的节点 ID", () => {
    document.body.innerHTML = `
      <div class="fn__flex-1 protyle">
        <div class="protyle-title" data-node-id="20260526165741-p675vq6">
          <div class="protyle-title__rich protyle-lite-fragment protyle">当前文档</div>
        </div>
      </div>`

    expect(PageUtil.getPageId()).toBe("20260526165741-p675vq6")
  })

  it("跳过隐藏标签页标题里的 protyle-lite-fragment", () => {
    document.body.innerHTML = `
      <div class="fn__flex-1 protyle fn__none">
        <div class="protyle-title" data-node-id="20260526165741-hidden">
          <div class="protyle-title__rich protyle-lite-fragment protyle">隐藏的标签页</div>
        </div>
      </div>
      <div class="fn__flex-1 protyle">
        <div class="protyle-title" data-node-id="20260526165741-active">
          <div class="protyle-title__rich protyle-lite-fragment protyle">当前文档</div>
        </div>
      </div>`

    // 只取第一个 div.protyle 会命中隐藏标签页里的标题片段，导致返回空字符串（issue #2087）
    expect(PageUtil.getPageId()).toBe("20260526165741-active")
  })

  it("没有正文编辑器时返回空字符串", () => {
    document.body.innerHTML = `
      <div class="protyle-title__rich protyle-lite-fragment protyle">只有标题片段</div>`

    expect(PageUtil.getPageId()).toBe("")
  })

  it("没有 protyle 时返回空字符串", () => {
    document.body.innerHTML = `<div class="layout"></div>`

    expect(PageUtil.getPageId()).toBe("")
  })
})

describe("PageUtil.getActiveEditorScope", () => {
  const renderProtyle = (options: { focusedBlockId?: string; titleId?: string } = {}) => {
    const titleId = options.titleId ?? "20260526165741-p675vq6"
    const focusClass = options.focusedBlockId ? "" : "fn__none"
    const firstBlockId = options.focusedBlockId ?? "20260526165741-first"
    document.body.innerHTML = `
      <div class="fn__flex-1 protyle">
        <div class="protyle-title" data-node-id="${titleId}">
          <div class="protyle-wysiwyg"><div data-node-id="${titleId}-title"></div></div>
        </div>
        <div class="protyle-breadcrumb">
          <button data-type="exit-focus" class="${focusClass}">退出聚焦</button>
        </div>
        <div class="protyle-content">
          <div class="protyle-wysiwyg">
            <div data-node-id="${firstBlockId}" data-type="NodeHeading"></div>
          </div>
        </div>
      </div>`
  }

  it("未聚焦时返回整篇文档范围", () => {
    renderProtyle()

    expect(PageUtil.getActiveEditorScope()).toEqual({
      pageId: "20260526165741-p675vq6",
      scopeBlockId: undefined,
    })
  })

  it("聚焦时返回聚焦块 ID", () => {
    renderProtyle({ focusedBlockId: "20260526165741-focus" })

    expect(PageUtil.getActiveEditorScope()).toEqual({
      pageId: "20260526165741-p675vq6",
      scopeBlockId: "20260526165741-focus",
    })
  })

  it("聚焦块就是文档时按整篇文档处理", () => {
    renderProtyle({ focusedBlockId: "20260526165741-p675vq6" })

    expect(PageUtil.getActiveEditorScope()).toEqual({
      pageId: "20260526165741-p675vq6",
      scopeBlockId: undefined,
    })
  })

  it("没有正文编辑器时返回空范围", () => {
    document.body.innerHTML = `<div class="layout"></div>`

    expect(PageUtil.getActiveEditorScope()).toEqual({ pageId: "" })
  })
})
