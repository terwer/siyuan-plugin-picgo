import PageUtil, { type EditorScope } from "./utils/pageUtil"

/**
 * 思源编辑器实例中与上传范围相关的字段。
 *
 * 只保留必要字段，避免插件宿主与思源内部类型强耦合；事件回调按结构读取。
 */
interface ProtyleScopeSource {
  element?: HTMLElement
  block?: {
    id?: string
    rootID?: string
    showAll?: boolean
  }
}

/**
 * 跟踪当前活动的思源编辑器，并解析聚焦上传范围。
 *
 * 通过思源插件事件 loaded-protyle-static / switch-protyle 取得 protyle，
 * 用 block.showAll 与 block.id 判断是否处于聚焦（缩放）状态。事件尚未到达或
 * 指向的不是当前可见编辑器时，回退到 PageUtil 的 DOM 解析，保证插件在首次
 * 加载、切换页签和聚焦页签之间切换时都能拿到正确的范围。
 */
export class EditorScopeTracker {
  private activeProtyle: ProtyleScopeSource | undefined

  public readonly handleProtyleEvent = (event: CustomEvent<{ protyle?: ProtyleScopeSource }>) => {
    const protyle = event?.detail?.protyle
    if (protyle?.element && protyle.block) {
      this.activeProtyle = protyle
    }
  }

  public getScope(): EditorScope {
    const protyle = this.activeProtyle
    const activeElement = PageUtil.getActiveProtyleElement()
    if (protyle?.element && protyle.element === activeElement && protyle.block?.rootID) {
      const pageId = protyle.block.rootID
      const isFocused = protyle.block.showAll === true && !!protyle.block.id && protyle.block.id !== pageId
      return {
        pageId,
        scopeBlockId: isFocused ? protyle.block.id : undefined,
      }
    }

    return PageUtil.getActiveEditorScope()
  }

  public reset() {
    this.activeProtyle = undefined
  }
}
