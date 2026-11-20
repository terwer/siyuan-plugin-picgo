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

    expect(PageUtil.getPageId()).toBe("20260526165741-active")
  })

  it("不依赖 protyle-lite-fragment 类名也能跳过标题片段", () => {
    document.body.innerHTML = `
      <div class="fn__flex-1 protyle fn__none">
        <div class="protyle-title" data-node-id="20260526165741-hidden">
          <div class="protyle-title__rich protyle">旧版宿主的隐藏标题片段</div>
        </div>
      </div>
      <div class="fn__flex-1 protyle">
        <div class="protyle-title" data-node-id="20260526165741-active">
          <div class="protyle-title__rich protyle">旧版宿主里的当前文档</div>
        </div>
      </div>`

    expect(PageUtil.getPageId()).toBe("20260526165741-active")
  })

  it("按活动窗口的焦点页签返回分屏中的当前文档", () => {
    document.body.innerHTML = `
      <div data-type="wnd">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="left-tab">左侧文档</li>
        </ul>
        <div class="protyle" data-id="left-tab">
          <div class="protyle-title" data-node-id="20260526165741-left">
            <div class="protyle-title__rich protyle-lite-fragment protyle">左侧文档</div>
          </div>
        </div>
      </div>
      <div class="layout__wnd--active" data-type="wnd">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="right-tab">右侧文档</li>
        </ul>
        <div class="protyle" data-id="right-tab">
          <div class="protyle-title" data-node-id="20260526165741-right">
            <div class="protyle-title__rich protyle-lite-fragment protyle">右侧文档</div>
          </div>
        </div>
      </div>`

    // 分屏左窗格在 DOM 中靠前，不能按 DOM 顺序取第一个编辑器
    expect(PageUtil.getPageId()).toBe("20260526165741-right")
  })

  it("跳过没有标题的非文档 protyle（如智能体输入框）", () => {
    document.body.innerHTML = `
      <div class="agent-chat__composer-host protyle-lite-fragment protyle"></div>
      <div class="fn__flex-1 protyle">
        <div class="protyle-title" data-node-id="20260526165741-active">
          <div class="protyle-title__rich protyle-lite-fragment protyle">当前文档</div>
        </div>
      </div>`

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
  it("聚焦时返回正文首个块作为 scopeBlockId", () => {
    document.body.innerHTML = `
      <div class="layout__wnd--active">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="tab-1">当前文档</li>
        </ul>
        <div class="protyle" data-id="tab-1">
          <div class="protyle-title" data-node-id="20260526165741-page">
            <div class="protyle-title__rich protyle-lite-fragment protyle">当前文档</div>
          </div>
          <div class="protyle-breadcrumb"><span data-type="exit-focus">退出聚焦</span></div>
          <div class="protyle-wysiwyg">
            <div data-node-id="20260526165741-focus">聚焦块</div>
          </div>
        </div>
      </div>`

    expect(PageUtil.getActiveEditorScope()).toEqual({
      pageId: "20260526165741-page",
      scopeBlockId: "20260526165741-focus",
    })
  })

  it("未聚焦时只返回整篇文档的 pageId", () => {
    document.body.innerHTML = `
      <div class="layout__wnd--active">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="tab-1">当前文档</li>
        </ul>
        <div class="protyle" data-id="tab-1">
          <div class="protyle-title" data-node-id="20260526165741-page">
            <div class="protyle-title__rich protyle-lite-fragment protyle">当前文档</div>
          </div>
          <div class="protyle-breadcrumb"><span data-type="exit-focus" class="fn__none">退出聚焦</span></div>
          <div class="protyle-wysiwyg">
            <div data-node-id="20260526165741-first">首个块</div>
          </div>
        </div>
      </div>`

    expect(PageUtil.getActiveEditorScope()).toEqual({ pageId: "20260526165741-page" })
  })

  it("分屏时从活动窗口的焦点页签取编辑器", () => {
    document.body.innerHTML = `
      <div data-type="wnd">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="left-tab">左侧文档</li>
        </ul>
        <div class="protyle" data-id="left-tab">
          <div class="protyle-title" data-node-id="20260526165741-left"></div>
        </div>
      </div>
      <div class="layout__wnd--active" data-type="wnd">
        <ul class="layout-tab-bar">
          <li class="item item--focus" data-id="right-tab">右侧文档</li>
        </ul>
        <div class="protyle" data-id="right-tab">
          <div class="protyle-title" data-node-id="20260526165741-right"></div>
        </div>
      </div>`

    expect(PageUtil.getActiveProtyleElement()?.getAttribute("data-id")).toBe("right-tab")
    expect(PageUtil.getActiveEditorScope()).toEqual({ pageId: "20260526165741-right" })
  })
})
