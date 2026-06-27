import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PasteEventAdapter } from "./PasteEventAdapter"

describe("PasteEventAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      getSelection: () => null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("takes over a single image paste synchronously from a ready snapshot", () => {
    const adapter = new PasteEventAdapter()
    const file = { name: "clipboard.png" } as File
    const preventDefault = vi.fn()
    const sourcePreventDefault = vi.fn()
    const resolve = vi.fn()
    const event = {
      detail: {
        protyle: { block: { rootID: "doc-1", id: "block-1" } },
        files: [file],
        textHTML: "",
        textPlain: "",
        siyuanHTML: "",
        source: { preventDefault: sourcePreventDefault },
        resolve,
      },
      preventDefault,
    } as unknown as CustomEvent

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
    })

    expect(result.taken).toBe(true)
    expect(result.snapshot?.pageId).toBe("doc-1")
    expect(result.snapshot?.targetBlockId).toBe("doc-1")
    expect(result.snapshot?.file).toBe(file)
    expect(result.snapshot?.preventedBy).toEqual([
      "plugin-custom-event.preventDefault",
      "detail.source.preventDefault",
      "detail.resolve(empty-paste-payload)",
    ])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(sourcePreventDefault).toHaveBeenCalledOnce()
    expect(resolve).toHaveBeenCalledOnce()
    expect(resolve).toHaveBeenCalledWith({
      textHTML: "",
      textPlain: "",
      siyuanHTML: "",
      files: expect.objectContaining({ length: 0 }),
    })
  })

  it("does not prevent host paste when auto upload is disabled", () => {
    const adapter = new PasteEventAdapter()
    const preventDefault = vi.fn()
    const resolve = vi.fn()
    const event = {
      detail: {
        protyle: { block: { rootID: "doc-1" } },
        files: [{ name: "clipboard.png" }],
        resolve,
      },
      preventDefault,
    } as unknown as CustomEvent

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: false,
      allowPicAndText: false,
    })

    expect(result).toEqual({ taken: false, reason: "auto-upload-disabled" })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(resolve).not.toHaveBeenCalled()
  })
})
