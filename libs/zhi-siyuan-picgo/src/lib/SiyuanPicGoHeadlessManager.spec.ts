import { describe, expect, it, vi } from "vitest"
import { SiyuanPicGoHeadlessManager } from "./SiyuanPicGoHeadlessManager"

const LOCAL_IMAGE = { url: "assets/a.png", alt: "a", title: "", isLocal: true, blockId: "block-1" }

const makePostResult = (overrides: Record<string, unknown> = {}) => ({
  flag: false,
  hasImages: false,
  mdContent: "",
  errmsg: "文章中没有图片",
  ...overrides,
})

const createManager = (
  options: {
    localImages?: unknown[]
    validation?: { ok: boolean; errors: unknown[] }
    postResult?: Record<string, unknown>
  } = {}
) => {
  const manager = Object.create(SiyuanPicGoHeadlessManager.prototype) as any
  manager.postApi = {
    parsePostLocalImages: vi.fn(async () => options.localImages ?? []),
    uploadPostImagesToBed: vi.fn(async () => options.postResult ?? makePostResult()),
  }
  manager.getCurrentUploader = vi.fn(async () => "smms")
  manager.getUploaderConfig = vi.fn(async () => ({}))
  manager.validateUploaderConfig = vi.fn(() => options.validation ?? { ok: true, errors: [] })
  return manager
}

describe("SiyuanPicGoHeadlessManager.uploadMarkdownImages", () => {
  it("skips uploader validation and delegates to the post api when there are no local images", async () => {
    const manager = createManager()

    const result = await manager.uploadMarkdownImages("page-1", { box: "nb" }, "plain text")

    expect(manager.postApi.parsePostLocalImages).toHaveBeenCalledWith("page-1", "plain text")
    expect(manager.getCurrentUploader).not.toHaveBeenCalled()
    expect(manager.validateUploaderConfig).not.toHaveBeenCalled()
    expect(manager.postApi.uploadPostImagesToBed).toHaveBeenCalledWith("page-1", { box: "nb" }, "plain text")
    expect(result.hasImages).toBe(false)
  })

  it("validates the current uploader before uploading when local images exist", async () => {
    const manager = createManager({ localImages: [LOCAL_IMAGE] })

    await manager.uploadMarkdownImages("page-1", {}, "![a](assets/a.png)")

    expect(manager.getCurrentUploader).toHaveBeenCalled()
    expect(manager.validateUploaderConfig).toHaveBeenCalledTimes(1)
    expect(manager.postApi.uploadPostImagesToBed).toHaveBeenCalledWith("page-1", {}, "![a](assets/a.png)")
  })

  it("throws a structured validation error and does not start uploading when config is invalid", async () => {
    const manager = createManager({
      localImages: [LOCAL_IMAGE],
      validation: { ok: false, errors: [{ field: "token", message: "required" }] },
    })

    await expect(manager.uploadMarkdownImages("page-1", {}, "![a](assets/a.png)")).rejects.toThrow(
      'Uploader "smms" config is invalid'
    )
    expect(manager.postApi.uploadPostImagesToBed).not.toHaveBeenCalled()
  })
})
