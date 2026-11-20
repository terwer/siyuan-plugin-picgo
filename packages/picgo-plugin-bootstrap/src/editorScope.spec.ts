// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest"
import { EditorScopeTracker } from "./editorScope"

const ROOT_ID = "20261120122056-w4d5tyy"
const FOCUS_ID = "20261120122056-sf4l9x9"

const renderActiveProtyle = (options: { focusedBlockId?: string; titleId?: string } = {}) => {
  const titleId = options.titleId ?? ROOT_ID
  const focusClass = options.focusedBlockId ? "" : "fn__none"
  const firstBlockId = options.focusedBlockId ?? "20261120122056-first"
  document.body.innerHTML = `
    <div class="fn__flex-1 protyle">
      <div class="protyle-title" data-node-id="${titleId}">当前文档</div>
      <div class="protyle-breadcrumb">
        <button data-type="exit-focus" class="${focusClass}">退出聚焦</button>
      </div>
      <div class="protyle-wysiwyg">
        <div data-node-id="${firstBlockId}" data-type="NodeHeading"></div>
      </div>
    </div>`

  return document.querySelector<HTMLElement>("div.protyle") as HTMLElement
}

const emitProtyleEvent = (
  tracker: EditorScopeTracker,
  protyle: { element: HTMLElement; block: { id: string; rootID: string; showAll: boolean } }
) => {
  tracker.handleProtyleEvent({ detail: { protyle } } as unknown as CustomEvent)
}

afterEach(() => {
  document.body.innerHTML = ""
})

describe("EditorScopeTracker.getScope", () => {
  it("聚焦页签只返回聚焦块范围", () => {
    const tracker = new EditorScopeTracker()
    const element = renderActiveProtyle({ focusedBlockId: FOCUS_ID })

    emitProtyleEvent(tracker, {
      element,
      block: { id: FOCUS_ID, rootID: ROOT_ID, showAll: true },
    })

    expect(tracker.getScope()).toEqual({ pageId: ROOT_ID, scopeBlockId: FOCUS_ID })
  })

  it("普通文档页签返回整篇文档范围", () => {
    const tracker = new EditorScopeTracker()
    const element = renderActiveProtyle()

    emitProtyleEvent(tracker, {
      element,
      block: { id: ROOT_ID, rootID: ROOT_ID, showAll: false },
    })

    expect(tracker.getScope()).toEqual({ pageId: ROOT_ID, scopeBlockId: undefined })
  })

  it("protyle 不是当前可见编辑器时回退到 DOM 解析", () => {
    const tracker = new EditorScopeTracker()
    renderActiveProtyle({ focusedBlockId: FOCUS_ID })
    const otherElement = document.createElement("div")

    emitProtyleEvent(tracker, {
      element: otherElement,
      block: { id: FOCUS_ID, rootID: ROOT_ID, showAll: true },
    })

    expect(tracker.getScope()).toEqual({ pageId: ROOT_ID, scopeBlockId: FOCUS_ID })
  })

  it("没有 protyle 事件时回退到 DOM 解析", () => {
    const tracker = new EditorScopeTracker()
    renderActiveProtyle()

    expect(tracker.getScope()).toEqual({ pageId: ROOT_ID, scopeBlockId: undefined })
  })

  it("reset 后重新回退到 DOM 解析", () => {
    const tracker = new EditorScopeTracker()
    const element = renderActiveProtyle({ focusedBlockId: FOCUS_ID })

    emitProtyleEvent(tracker, {
      element,
      block: { id: FOCUS_ID, rootID: ROOT_ID, showAll: true },
    })
    tracker.reset()

    expect(tracker.getScope()).toEqual({ pageId: ROOT_ID, scopeBlockId: FOCUS_ID })
  })
})
