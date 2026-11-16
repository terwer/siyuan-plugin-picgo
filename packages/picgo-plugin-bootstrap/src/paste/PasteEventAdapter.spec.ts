import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PasteEventAdapter } from "./PasteEventAdapter"

interface FakePasteEventOptions {
  files?: File[]
  textHTML?: string
  textPlain?: string
  siyuanHTML?: string
  withDefaultPrevention?: boolean
  withResolve?: boolean
}

const buildPasteEvent = (options: FakePasteEventOptions = {}) => {
  const preventDefault = vi.fn()
  const sourcePreventDefault = vi.fn()
  const resolve = vi.fn()
  const files = options.files ?? [{ name: "clipboard.png" } as File]
  const detail: any = {
    protyle: { block: { rootID: "doc-1", id: "block-1" } },
    files,
    textHTML: options.textHTML ?? "",
    textPlain: options.textPlain ?? "",
    siyuanHTML: options.siyuanHTML ?? "",
  }
  if (options.withDefaultPrevention !== false) {
    detail.source = { preventDefault: sourcePreventDefault }
  }
  if (options.withResolve !== false) {
    detail.resolve = resolve
  }

  const event = (options.withDefaultPrevention === false
    ? { detail }
    : { detail, preventDefault }) as unknown as CustomEvent

  return { event, preventDefault, sourcePreventDefault, resolve, detail }
}

describe("PasteEventAdapter", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      getSelection: () => null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ── 2x2 setting matrix: autoUpload x replaceLink ──────────────────
  it("takes over and asks for a remote link when auto upload and replace link are on", () => {
    const adapter = new PasteEventAdapter()
    const { event, preventDefault, sourcePreventDefault, resolve } = buildPasteEvent()

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
      replaceLink: true,
    })

    expect(result.taken).toBe(true)
    expect(result.snapshot?.replaceLink).toBe(true)
    expect(result.snapshot?.pageId).toBe("doc-1")
    expect(result.snapshot?.preventedBy).toEqual([
      "plugin-custom-event.preventDefault",
      "detail.source.preventDefault",
      "detail.resolve(empty-paste-payload)",
    ])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(sourcePreventDefault).toHaveBeenCalledOnce()
    expect(resolve).toHaveBeenCalledOnce()
  })

  it("still takes over for the upload when only replace link is off", () => {
    const adapter = new PasteEventAdapter()
    const { event, preventDefault, sourcePreventDefault, resolve, detail } = buildPasteEvent()

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
      replaceLink: false,
    })

    expect(result.taken).toBe(true)
    expect(result.snapshot?.replaceLink).toBe(false)
    expect(result.snapshot?.file).toBe(detail.files[0])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(sourcePreventDefault).toHaveBeenCalledOnce()
    expect(resolve).toHaveBeenCalledOnce()
  })

  it("does not take over when auto upload is off and replace link is on", () => {
    const adapter = new PasteEventAdapter()
    const { event, preventDefault, resolve } = buildPasteEvent()

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: false,
      allowPicAndText: false,
      replaceLink: true,
    })

    expect(result).toEqual({ taken: false, reason: "auto-upload-disabled" })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(resolve).not.toHaveBeenCalled()
  })

  it("does not take over when auto upload and replace link are both off", () => {
    const adapter = new PasteEventAdapter()
    const { event, preventDefault, resolve } = buildPasteEvent()

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: false,
      allowPicAndText: false,
      replaceLink: false,
    })

    expect(result).toEqual({ taken: false, reason: "auto-upload-disabled" })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(resolve).not.toHaveBeenCalled()
  })

  // ── boundaries around the takeover decision ───────────────────────
  it("keeps the pic-and-text guard ahead of the replace link flag", () => {
    const adapter = new PasteEventAdapter()
    const { event, preventDefault } = buildPasteEvent({ textPlain: "some text" })

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
      replaceLink: false,
    })

    expect(result).toEqual({ taken: false, reason: "pic-and-text-disabled" })
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it("takes over mixed content with the replace link flag carried into the snapshot", () => {
    const adapter = new PasteEventAdapter()
    const { event } = buildPasteEvent({ textPlain: "some text" })

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: true,
      replaceLink: false,
    })

    expect(result.taken).toBe(true)
    expect(result.snapshot?.replaceLink).toBe(false)
    expect(result.snapshot?.textPlain).toBe("some text")
  })

  it("rejects multi-file paste even when replace link is off", () => {
    const adapter = new PasteEventAdapter()
    const { event } = buildPasteEvent({ files: [{ name: "a.png" } as File, { name: "b.png" } as File] })

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
      replaceLink: false,
    })

    expect(result).toEqual({ taken: false, reason: "multiple-files-unsupported" })
  })

  it("rejects takeover when the host paste cannot be blocked, whatever the settings", () => {
    const adapter = new PasteEventAdapter()
    const { event } = buildPasteEvent({ withDefaultPrevention: false, withResolve: false })

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
      replaceLink: false,
    })

    expect(result).toEqual({ taken: false, reason: "default-prevention-unavailable" })
  })

  // ── historical behaviour ──────────────────────────────────────────
  it("defaults replace link to on when the snapshot has no flag", () => {
    const adapter = new PasteEventAdapter()
    const { event } = buildPasteEvent()

    const result = adapter.tryTakeoverFromSnapshot(event, {
      autoUpload: true,
      allowPicAndText: false,
    } as any)

    expect(result.taken).toBe(true)
    expect(result.snapshot?.replaceLink).toBe(true)
  })

  it("ignores paste events without image files", () => {
    const adapter = new PasteEventAdapter()
    const event = { detail: { protyle: { block: { rootID: "doc-1" } }, files: [] } } as unknown as CustomEvent

    expect(adapter.inspectCandidate(event)).toEqual({ candidate: false, reason: "no-image-files" })
  })
})
