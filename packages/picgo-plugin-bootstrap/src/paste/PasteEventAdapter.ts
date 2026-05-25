import { IPicGo, generateUniqueName } from "zhi-siyuan-picgo"

interface PasteTakeoverConfig {
  autoUpload: boolean
  allowPicAndText: boolean
}

export interface PasteInputSnapshot {
  transactionId: string
  pageId: string
  targetBlockId: string
  file: File
  generatedName: string
  textHTML: string
  textPlain: string
  siyuanHTML: string
  preventedBy: string[]
}

export interface DeferredPasteCandidate {
  deferred: boolean
  reason?: string
  event?: CustomEvent
  detail?: any
  pageId?: string
  files?: File[]
  textHTML?: string
  textPlain?: string
  siyuanHTML?: string
  preventedBy?: string[]
}

export interface PasteCandidateInfo {
  candidate: boolean
  reason?: string
  event?: CustomEvent
  detail?: any
  pageId?: string
  files?: File[]
  textHTML?: string
  textPlain?: string
  siyuanHTML?: string
}

export interface PasteTakeoverResult {
  taken: boolean
  reason?: string
  snapshot?: PasteInputSnapshot
}

class EmptyFilesLike {
  public readonly length = 0

  public item(): File | null {
    return null
  }

  public [Symbol.iterator](): IterableIterator<File> {
    return [][Symbol.iterator]()
  }
}

/**
 * Owns the raw SiYuan paste event boundary.
 *
 * This adapter must stay synchronous until it has decided whether PicGo takes
 * over the paste flow. If takeover is accepted, it prevents the plugin
 * CustomEvent/default source and resolves SiYuan's paste hook with an empty
 * file payload before any async upload starts.
 */
class PasteEventAdapter {
  public inspectCandidate(event: CustomEvent): PasteCandidateInfo {
    const detail = event.detail ?? {}
    const pageId = detail?.protyle?.block?.rootID ?? detail?.protyle?.block?.id ?? ""
    if (!pageId) {
      return { candidate: false, reason: "missing-page-id" }
    }

    const files = this.normalizeFiles(detail.files)
    if (files.length === 0) {
      return { candidate: false, reason: "no-image-files" }
    }

    return {
      candidate: true,
      event,
      detail,
      pageId,
      files,
      textHTML: detail.textHTML ?? "",
      textPlain: detail.textPlain ?? "",
      siyuanHTML: detail.siyuanHTML ?? "",
    }
  }

  public tryTakeover(event: CustomEvent, ctx: IPicGo): PasteTakeoverResult {
    return this.tryTakeoverWithConfig(event, this.readConfigFromContext(ctx))
  }

  public tryTakeoverWithConfig(event: CustomEvent, config?: Partial<PasteTakeoverConfig>): PasteTakeoverResult {
    const finalConfig = this.normalizeConfig(config)
    const candidate = this.inspectCandidate(event)
    if (!candidate.candidate || !candidate.detail || !candidate.pageId || !candidate.files) {
      return { taken: false, reason: candidate.reason ?? "not-candidate" }
    }

    const files = candidate.files
    const textHTML = candidate.textHTML ?? ""
    const textPlain = candidate.textPlain ?? ""
    const siyuanHTML = candidate.siyuanHTML ?? ""
    const hasPicAndText = siyuanHTML.trim() !== "" || textHTML.trim() !== "" || textPlain.trim() !== ""
    if (hasPicAndText && !finalConfig.allowPicAndText) {
      return { taken: false, reason: "pic-and-text-disabled" }
    }

    if (!finalConfig.autoUpload) {
      return { taken: false, reason: "auto-upload-disabled" }
    }

    if (files.length > 1) {
      return { taken: false, reason: "multiple-files-unsupported" }
    }

    if (!this.canBlockHostPaste(candidate.detail, event)) {
      return { taken: false, reason: "default-prevention-unavailable" }
    }

    const snapshot: PasteInputSnapshot = {
      transactionId: `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pageId: candidate.pageId,
      targetBlockId: this.findCurrentBlockId() || candidate.pageId,
      file: files[0],
      generatedName: generateUniqueName(),
      textHTML,
      textPlain,
      siyuanHTML,
      preventedBy: this.preventHostPaste(candidate.detail, event),
    }

    return {
      taken: true,
      snapshot,
    }
  }

  public readBrowserConfig(): PasteTakeoverConfig {
    const fallback: PasteTakeoverConfig = {
      autoUpload: true,
      allowPicAndText: false,
    }

    if (typeof window === "undefined" || !window.localStorage) {
      return fallback
    }

    try {
      const raw = window.localStorage.getItem("universal-picgo/picgo.cfg.json")
      if (!raw) {
        return fallback
      }
      const cfg = JSON.parse(raw)
      return {
        autoUpload: cfg?.siyuan?.autoUpload ?? fallback.autoUpload,
        allowPicAndText: cfg?.siyuan?.txtImageSwitch ?? fallback.allowPicAndText,
      }
    } catch {
      return fallback
    }
  }

  /**
   * @deprecated Use tryTakeover() after configuration is available.
   */
  public deferIfCandidate(event: CustomEvent): DeferredPasteCandidate {
    const detail = event.detail ?? {}
    const pageId = detail?.protyle?.block?.rootID ?? detail?.protyle?.block?.id ?? ""
    if (!pageId) {
      return { deferred: false, reason: "missing-page-id" }
    }

    const files = this.normalizeFiles(detail.files)
    if (files.length === 0) {
      return { deferred: false, reason: "no-image-files" }
    }

    if (!this.canBlockHostPaste(detail, event)) {
      return { deferred: false, reason: "default-prevention-unavailable" }
    }

    return {
      deferred: true,
      event,
      detail,
      pageId,
      files,
      textHTML: detail.textHTML ?? "",
      textPlain: detail.textPlain ?? "",
      siyuanHTML: detail.siyuanHTML ?? "",
      preventedBy: this.preventHostPaste(detail, event),
    }
  }

  public resolveTakeover(candidate: DeferredPasteCandidate, ctx: IPicGo): PasteTakeoverResult {
    if (!candidate.deferred || !candidate.detail || !candidate.event || !candidate.pageId || !candidate.files) {
      return { taken: false, reason: candidate.reason ?? "not-deferred" }
    }

    const files = candidate.files
    const textHTML = candidate.textHTML ?? ""
    const textPlain = candidate.textPlain ?? ""
    const siyuanHTML = candidate.siyuanHTML ?? ""
    const hasPicAndText = siyuanHTML.trim() !== "" || textHTML.trim() !== "" || textPlain.trim() !== ""
    if (hasPicAndText) {
      const allowPicAndText = ctx.getConfig<boolean>("siyuan.txtImageSwitch", true)
      if (!allowPicAndText) {
        return { taken: false, reason: "pic-and-text-disabled" }
      }
    }

    const autoUpload = ctx.getConfig<boolean>("siyuan.autoUpload", true)
    if (!autoUpload) {
      return { taken: false, reason: "auto-upload-disabled" }
    }

    if (files.length > 1) {
      return { taken: false, reason: "multiple-files-unsupported" }
    }

    const snapshot: PasteInputSnapshot = {
      transactionId: `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pageId: candidate.pageId,
      targetBlockId: this.findCurrentBlockId() || candidate.pageId,
      file: files[0],
      generatedName: generateUniqueName(),
      textHTML,
      textPlain,
      siyuanHTML,
      preventedBy: candidate.preventedBy ?? [],
    }

    return {
      taken: true,
      snapshot,
    }
  }

  private normalizeFiles(filesLike: any): File[] {
    if (!filesLike || typeof filesLike.length !== "number") {
      return []
    }

    const files: File[] = []
    for (let i = 0; i < filesLike.length; i++) {
      const item = filesLike[i]
      const file = typeof item?.getAsFile === "function" ? item.getAsFile() : item
      if (file) {
        files.push(file as File)
      }
    }
    return files
  }

  private canBlockHostPaste(detail: any, event: CustomEvent): boolean {
    return (
      typeof detail?.resolve === "function" ||
      typeof detail?.source?.preventDefault === "function" ||
      typeof event.preventDefault === "function"
    )
  }

  private preventHostPaste(detail: any, event: CustomEvent): string[] {
    const preventedBy: string[] = []

    if (typeof event.preventDefault === "function") {
      event.preventDefault()
      preventedBy.push("plugin-custom-event.preventDefault")
    }

    if (typeof detail?.source?.preventDefault === "function") {
      detail.source.preventDefault()
      preventedBy.push("detail.source.preventDefault")
    }

    // SiYuan's paste plugin hook waits for detail.resolve only when the
    // CustomEvent is prevented. Resolve with empty files/text so the built-in
    // upload/insert path has nothing left to process.
    if (typeof detail?.resolve === "function") {
      detail.resolve({
        textHTML: "",
        textPlain: "",
        siyuanHTML: "",
        files: new EmptyFilesLike(),
      })
      preventedBy.push("detail.resolve(empty-paste-payload)")
    }

    return preventedBy
  }

  private findCurrentBlockId(): string {
    const selection = window.getSelection?.()
    if (!selection || selection.rangeCount === 0) {
      return ""
    }

    let node: Node | null = selection.getRangeAt(0).startContainer
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const nodeId = element.getAttribute("data-node-id")
        if (nodeId) {
          return nodeId
        }
      }
      node = node.parentNode
    }

    return ""
  }

  private readConfigFromContext(ctx: IPicGo): PasteTakeoverConfig {
    return this.normalizeConfig({
      autoUpload: ctx.getConfig<boolean>("siyuan.autoUpload", true),
      allowPicAndText: ctx.getConfig<boolean>("siyuan.txtImageSwitch", false),
    })
  }

  private normalizeConfig(config?: Partial<PasteTakeoverConfig>): PasteTakeoverConfig {
    return {
      autoUpload: config?.autoUpload ?? true,
      allowPicAndText: config?.allowPicAndText ?? false,
    }
  }
}

export { PasteEventAdapter, type PasteTakeoverConfig }
