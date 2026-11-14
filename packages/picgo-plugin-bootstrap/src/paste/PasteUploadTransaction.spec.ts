import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ImageItem, ImageParser, SIYUAN_PICGO_FILE_MAP_KEY } from "zhi-siyuan-picgo"
import { PasteInputSnapshot } from "./PasteEventAdapter"
import { PasteUploadTransaction } from "./PasteUploadTransaction"

const REMOTE_URL = "https://cdn.example.com/2024/01/clipboard.png"
const ASSET_PATH = "assets/clipboard-20240101-abcdef.png"

const buildFile = (name = "clipboard.png", type = "image/png") => new File([new Uint8Array([1, 2, 3])], name, { type })

const buildSnapshot = (overrides: Partial<PasteInputSnapshot> = {}): PasteInputSnapshot => ({
  transactionId: "paste-test",
  pageId: "doc-1",
  targetBlockId: "block-1",
  file: buildFile(),
  generatedName: "20240101010101abcdef",
  textHTML: "",
  textPlain: "",
  siyuanHTML: "",
  replaceLink: true,
  preventedBy: [],
  ...overrides,
})

const buildTransaction = (
  options: {
    assetResult?: any
    assetThrows?: Error
    bedThrows?: Error
    insertFails?: boolean
    useSiyuanRequestOnly?: boolean
  } = {}
) => {
  const notifyInfo = vi.fn()
  const notifySuccess = vi.fn()
  const notifyError = vi.fn()
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  const uploadAsset = vi.fn(async (..._args: any[]) => {
    if (options.assetThrows) {
      throw options.assetThrows
    }
    return options.assetResult ?? { errFiles: [], succMap: { "clipboard.png": ASSET_PATH } }
  })

  const insertResponse = options.insertFails ? [{ doOperations: [] }] : [{ doOperations: [{ id: "inserted-block-1" }] }]
  const insertBlock = vi.fn(async (..._args: any[]) => insertResponse)
  const siyuanRequest = vi.fn(async (..._args: any[]) => insertResponse)

  const uploadSingleImageToBed = vi.fn(async (..._args: any[]) => {
    if (options.bedThrows) {
      throw options.bedThrows
    }
    return [{ imgUrl: REMOTE_URL }]
  })

  const setBlockAttrs = vi.fn(async (..._args: any[]) => undefined)
  const getBlockAttrs = vi.fn(async (..._args: any[]) => ({}))

  // SiyuanKernelApi in production has no insertBlock(); it goes through siyuanRequest.
  const siyuanApi: any = options.useSiyuanRequestOnly
    ? { uploadAsset, siyuanRequest, getBlockAttrs, setBlockAttrs }
    : { uploadAsset, insertBlock, getBlockAttrs, setBlockAttrs }

  const transaction = new PasteUploadTransaction({
    ctx: { reloadConfig: vi.fn() } as any,
    picgoPostApi: { uploadSingleImageToBed },
    siyuanApi,
    notifyInfo,
    notifySuccess,
    notifyError,
    logger,
  })

  return {
    transaction,
    notifyInfo,
    notifySuccess,
    notifyError,
    logger,
    uploadAsset,
    insertBlock,
    siyuanRequest,
    getBlockAttrs,
    setBlockAttrs,
    uploadSingleImageToBed,
  }
}

describe("PasteUploadTransaction", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      getSelection: () => null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("replaceLink enabled (default)", () => {
    it("uploads and inserts the image-bed link", async () => {
      const deps = buildTransaction()

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: true }))

      expect(result.ok).toBe(true)
      expect(result.mode).toBe("remote-link")
      expect(deps.uploadSingleImageToBed).toHaveBeenCalledOnce()
      expect(deps.uploadSingleImageToBed.mock.calls[0][4]).toBe(true)
      expect(deps.uploadAsset).not.toHaveBeenCalled()
      expect(deps.insertBlock).toHaveBeenCalledOnce()
      expect(deps.insertBlock.mock.calls[0][0]).toBe(`![clipboard.png](${REMOTE_URL})`)
      expect(deps.notifySuccess).toHaveBeenCalledWith("🎉剪贴板图片已上传并插入图床链接")

      const storedMap = JSON.parse(deps.setBlockAttrs.mock.calls[0][1][SIYUAN_PICGO_FILE_MAP_KEY])
      expect(Object.values(storedMap)).toHaveLength(1)
      expect((Object.values(storedMap)[0] as any).url).toBe(REMOTE_URL)
      expect((Object.values(storedMap)[0] as any).isLocal).toBe(false)
    })

    it("treats a snapshot without the flag as replaceLink enabled", async () => {
      const deps = buildTransaction()

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: undefined as any }))

      expect(result.mode).toBe("remote-link")
      expect(deps.uploadAsset).not.toHaveBeenCalled()
      expect(deps.insertBlock.mock.calls[0][0]).toBe(`![clipboard.png](${REMOTE_URL})`)
    })
  })

  describe("replaceLink disabled", () => {
    it("still uploads but inserts the SiYuan local asset and stores the mapping", async () => {
      const deps = buildTransaction()

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: false }))

      expect(result.ok).toBe(true)
      expect(result.mode).toBe("local-link")
      expect(result.localAsset).toEqual({ assetPath: ASSET_PATH, assetName: "clipboard-20240101-abcdef.png" })
      expect(deps.uploadSingleImageToBed).toHaveBeenCalledOnce()
      expect(deps.uploadAsset).toHaveBeenCalledOnce()

      const formData = deps.uploadAsset.mock.calls[0][0] as FormData
      expect(formData.get("assetsDirPath")).toBe("/assets/")
      const uploaded = formData.get("file[]") as File
      expect(uploaded).toBeInstanceOf(File)
      expect(uploaded.name).toBe("clipboard.png")

      expect(deps.insertBlock).toHaveBeenCalledOnce()
      expect(deps.insertBlock.mock.calls[0][0]).toBe(`![clipboard.png](${ASSET_PATH})`)
      expect(deps.insertBlock.mock.calls[0][0]).not.toContain(REMOTE_URL)
      expect(deps.notifySuccess).toHaveBeenCalledWith("🎉剪贴板图片已上传到图床，替换本地链接已关闭，文档保留本地图片")

      const storedMap = JSON.parse(deps.setBlockAttrs.mock.calls[0][1][SIYUAN_PICGO_FILE_MAP_KEY])
      // The metadata key must match the key produced when the document image is parsed later,
      // otherwise publishing with the image bed cannot replace the local link.
      const expectedKey = new ImageItem(ASSET_PATH, "", false).hash
      expect(Object.keys(storedMap)).toEqual([expectedKey])

      // Publishing with the image bed re-parses the document first, so the stored key must be
      // the key that this parse produces, otherwise the local link can never be replaced later.
      const parsed = new ImageParser(false).parseLocalImagesToArray(`![clipboard.png](${ASSET_PATH})`)
      expect(parsed).toHaveLength(1)
      const publishKey = new ImageItem(parsed[0].url, "", parsed[0].isLocal, parsed[0].alt, parsed[0].title).hash
      expect(publishKey).toBe(expectedKey)
      const storedItem = storedMap[expectedKey]
      expect(storedItem.url).toBe(REMOTE_URL)
      expect(storedItem.isLocal).toBe(false)
      expect(storedItem.originUrl).toBe(ASSET_PATH)
      expect(storedItem.blockId).toBe("inserted-block-1")
    })

    it("derives an asset file name when the clipboard file has no extension", async () => {
      const deps = buildTransaction()

      await deps.transaction.execute(buildSnapshot({ replaceLink: false, file: buildFile("clipboard", "image/jpeg") }))

      const formData = deps.uploadAsset.mock.calls[0][0] as FormData
      expect((formData.get("file[]") as File).name).toBe("clipboard.jpg")
    })

    it("reports a document write failure when the asset upload returns no path", async () => {
      const deps = buildTransaction({ assetResult: { errFiles: ["clipboard.png"], succMap: {} } })

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: false }))

      expect(result.ok).toBe(false)
      expect(result.mode).toBe("local-link")
      expect(deps.insertBlock).not.toHaveBeenCalled()
      expect(deps.setBlockAttrs).not.toHaveBeenCalled()
      expect(deps.notifyError).toHaveBeenCalledWith(expect.stringContaining("本地图片写入文档失败"))
      expect(result.remoteImage).toEqual({ imgUrl: REMOTE_URL })
    })

    it("does not touch the document when the image-bed upload fails", async () => {
      const deps = buildTransaction({ bedThrows: new Error("bed down") })

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: false }))

      expect(result.ok).toBe(false)
      expect(deps.uploadAsset).not.toHaveBeenCalled()
      expect(deps.insertBlock).not.toHaveBeenCalled()
      expect(deps.setBlockAttrs).not.toHaveBeenCalled()
      expect(deps.notifyError).toHaveBeenCalledWith(expect.stringContaining("图片上传失败"))
    })
  })

  describe("production kernel adapter", () => {
    it("inserts the local image through /api/block/insertBlock when no insertBlock helper exists", async () => {
      const deps = buildTransaction({ useSiyuanRequestOnly: true })

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: false }))

      expect(result.ok).toBe(true)
      expect(deps.siyuanRequest).toHaveBeenCalledOnce()
      const [apiPath, payload] = deps.siyuanRequest.mock.calls[0] as any
      expect(apiPath).toBe("/api/block/insertBlock")
      expect(payload.dataType).toBe("markdown")
      expect(payload.data).toBe(`![clipboard.png](${ASSET_PATH})`)
      expect(payload.parentID).toBe("doc-1")
      expect(payload.previousID).toBe("block-1")
    })

    it("inserts the remote image through /api/block/insertBlock when replace link is on", async () => {
      const deps = buildTransaction({ useSiyuanRequestOnly: true })

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: true }))

      expect(result.ok).toBe(true)
      expect((deps.siyuanRequest.mock.calls[0] as any)[1].data).toBe(`![clipboard.png](${REMOTE_URL})`)
      expect(deps.uploadAsset).not.toHaveBeenCalled()
    })
  })

  describe("shared failure boundaries", () => {
    it("reports a metadata failure after the document mutation", async () => {
      const deps = buildTransaction()
      deps.setBlockAttrs.mockRejectedValueOnce(new Error("attr write failed"))

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: false }))

      expect(result.ok).toBe(false)
      expect(deps.insertBlock).toHaveBeenCalledOnce()
      expect(deps.notifyError).toHaveBeenCalledWith(expect.stringContaining("元数据同步失败"))
    })

    it("fails when the inserted image block id is missing", async () => {
      const deps = buildTransaction({ insertFails: true })

      const result = await deps.transaction.execute(buildSnapshot({ replaceLink: true }))

      expect(result.ok).toBe(false)
      expect(deps.notifyError).toHaveBeenCalledWith(expect.stringContaining("未返回新图片块 ID"))
    })
  })
})
