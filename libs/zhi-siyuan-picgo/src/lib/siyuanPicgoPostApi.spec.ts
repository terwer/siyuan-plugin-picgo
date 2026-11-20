import { describe, expect, it, vi } from "vitest"
import type { ConfigDomain, UnifiedConfigMigrationState } from "universal-picgo"
import { SIYUAN_PICGO_FILE_MAP_KEY } from "./constants"
import { ImageItem } from "./models/ImageItem"
import { ImageParser } from "./parser/ImageParser"
import { SiyuanPicgoPostApi } from "./siyuanPicgoPostApi"

const INITIAL_DOMAINS: UnifiedConfigMigrationState["domains"] = {
  picgoMain: { status: "not-started", importedSources: [] },
  picgoSettings: { status: "not-started", importedSources: [] },
  siyuanBehavior: { status: "not-started", importedSources: [] },
  siyuanConnection: { status: "not-started", importedSources: [] },
  externalPicList: { status: "not-started", importedSources: [] },
  pluginValues: { status: "not-started", importedSources: [] },
  uploaderConfig: { status: "not-started", importedSources: [] },
  lskyState: { status: "not-started", importedSources: [] },
  pasteBootstrap: { status: "not-started", importedSources: [] },
}

const makeState = (overrides: Partial<UnifiedConfigMigrationState> = {}): UnifiedConfigMigrationState => ({
  version: "v3.0-unified-async-config-source",
  status: "not-started",
  attempts: 0,
  ...overrides,
  domains: {
    ...INITIAL_DOMAINS,
    ...(overrides.domains ?? {}),
  },
})

describe("SiyuanPicgoPostApi v3 migration state bridge", () => {
  it("reads the real v3 facade migration state", () => {
    const failedState = makeState({
      status: "failed",
      error: "global failure",
      domains: {
        ...INITIAL_DOMAINS,
        picgoMain: { status: "imported", importedSources: ["success-source"] },
        siyuanConnection: { status: "failed", importedSources: [], error: "kernel timeout" },
      },
    })
    const facade = {
      getSnapshot: vi.fn(() => ({ migration: failedState })),
    }
    const api = Object.create(SiyuanPicgoPostApi.prototype) as any
    api.getConfigFacade = vi.fn(() => facade)

    const state = api.getConfigMigrationState()

    expect(state.status).toBe("failed")
    expect(state.version).toBe("v3.0-unified-async-config-source")
    expect(state.domains.siyuanConnection.error).toBe("kernel timeout")
    expect(state.domains.picgoMain.importedSources).toEqual(["success-source"])
  })

  it("retries through facade.retryMigration and keeps successful domains intact", async () => {
    const retriedState = makeState({
      status: "done",
      attempts: 2,
      domains: {
        ...INITIAL_DOMAINS,
        picgoMain: { status: "imported", importedSources: ["success-source"] },
        siyuanConnection: { status: "imported", importedSources: ["browser:siyuan-cfg"] },
      },
    })
    const facade = {
      retryMigration: vi.fn(async (_domains?: ConfigDomain[]) => retriedState),
      flush: vi.fn(async () => undefined),
      reload: vi.fn(async () => ({ migration: retriedState })),
    }
    const ctx = {
      reloadConfigAsync: vi.fn(async () => undefined),
    }
    const api = Object.create(SiyuanPicgoPostApi.prototype) as any
    api.getConfigFacadeAsync = vi.fn(async () => facade)
    api.ctx = vi.fn(() => ctx)

    const result = await api.retryConfigMigration(["siyuanConnection"])

    expect(facade.retryMigration).toHaveBeenCalledWith(["siyuanConnection"])
    expect(facade.flush).toHaveBeenCalled()
    expect(facade.reload).toHaveBeenCalled()
    expect(ctx.reloadConfigAsync).toHaveBeenCalled()
    expect(result.domains.picgoMain.importedSources).toEqual(["success-source"])
    expect(result.domains.siyuanConnection.status).toBe("imported")
  })
})

describe("SiyuanPicgoPostApi.parsePostLocalImages", () => {
  const createPostApi = (imageBlocks: any[] = []) => {
    const api = Object.create(SiyuanPicgoPostApi.prototype) as any
    api.logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    api.siyuanApi = {
      getImageBlocksByID: vi.fn(async () => imageBlocks),
    }
    api.imageParser = new ImageParser()
    return api
  }

  it("binds each local image to the image block that contains it", async () => {
    const api = createPostApi([
      { id: "block-a", markdown: "![a](assets/a.png)" },
      { id: "block-b", markdown: "![b](assets/b.png)" },
    ])

    const images = await api.parsePostLocalImages("page-1", "![a](assets/a.png)\n![b](assets/b.png)")

    expect(images).toEqual([
      { url: "assets/a.png", alt: "a", title: "", isLocal: true, blockId: "block-a" },
      { url: "assets/b.png", alt: "b", title: "", isLocal: true, blockId: "block-b" },
    ])
  })

  it("returns database-table images from the markdown even when there is no image block", async () => {
    const api = createPostApi([])
    const markdown = "|图片|主键|\n| --- | --- |\n|![cat](assets/cat.png)|图片行|"

    const images = await api.parsePostLocalImages("page-1", markdown)

    expect(api.siyuanApi.getImageBlocksByID).toHaveBeenCalledWith("page-1")
    expect(images).toEqual([{ url: "assets/cat.png", alt: "cat", title: "", isLocal: true, blockId: "" }])
  })

  it("returns an empty array when the document has no local images", async () => {
    const api = createPostApi([])

    const images = await api.parsePostLocalImages("page-1", "plain text")

    expect(images).toEqual([])
  })

  it("keeps parsing the markdown when the image-block query fails", async () => {
    const api = createPostApi([])
    api.siyuanApi.getImageBlocksByID = vi.fn(async () => {
      throw new Error("database is busy")
    })

    const images = await api.parsePostLocalImages("page-1", "![a](assets/a.png)")

    expect(images).toEqual([{ url: "assets/a.png", alt: "a", title: "", isLocal: true, blockId: "" }])
    expect(api.logger.warn).toHaveBeenCalled()
  })
})

describe("SiyuanPicgoPostApi.uploadPostImagesToBed", () => {
  it("replaces every database image when one cell has multiple local images", async () => {
    const api = Object.create(SiyuanPicgoPostApi.prototype) as any
    api.logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    api.imageParser = new ImageParser()
    api.parsePostLocalImages = vi.fn(async () => [
      { url: "assets/a.png", alt: "a", title: "", isLocal: true, blockId: "" },
      { url: "assets/b.png", alt: "b", title: "", isLocal: true, blockId: "" },
    ])
    const imageItems = [
      new ImageItem("assets/a.png", "http://kernel/assets/a.png", true, "a", ""),
      new ImageItem("assets/b.png", "http://kernel/assets/b.png", true, "b", ""),
    ]
    api.doConvertImagesToImagesItemArray = vi.fn(async () => imageItems)
    const fileMap: Record<string, ImageItem> = {}
    for (const item of imageItems) {
      const uploaded = new ImageItem(item.originUrl, "https://bed/" + item.name, false, item.alt, item.title)
      fileMap[uploaded.hash] = uploaded
    }
    api.siyuanApi = {
      getBlockAttrs: vi.fn(async () => ({ [SIYUAN_PICGO_FILE_MAP_KEY]: JSON.stringify(fileMap) })),
    }
    api.uploadSingleImageToBed = vi.fn(async () => undefined)

    const result = await api.uploadPostImagesToBed(
      "page-1",
      {},
      "|图片|主键|\n| --- | --- |\n|![a](assets/a.png) ![b](assets/b.png)|x|"
    )

    expect(api.uploadSingleImageToBed).toHaveBeenCalledTimes(2)
    expect(result.hasImages).toBe(true)
    expect(result.flag).toBe(true)
    expect(result.mdContent).toContain("![a](https://bed/a.png)")
    expect(result.mdContent).toContain("![b](https://bed/b.png)")
    expect(result.mdContent).not.toContain("assets/")
  })
})

describe("SiyuanPicgoPostApi.getImageBlocksInScope", () => {
  const ROOT_ID = "20261120122056-w4d5tyy"
  const FOCUS_ID = "20261120122056-sf4l9x9"
  const CHILD_ID = "20261120122056-y0dv20c"

  const createPostApi = (overrides: { headingChildren?: string[] | null; headingError?: Error } = {}) => {
    const api = Object.create(SiyuanPicgoPostApi.prototype) as any
    api.logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    api.siyuanApi = {
      getImageBlocksByID: vi.fn(async () => [{ id: "doc-block" }]),
      sql: vi.fn(async () => [{ id: "scoped-block" }]),
      siyuanRequest: vi.fn(async () => {
        if (overrides.headingError) {
          throw overrides.headingError
        }
        return overrides.headingChildren ?? []
      }),
    }
    return api
  }

  it("keeps the whole-document query when no focus block is given", async () => {
    const api = createPostApi()

    const blocks = await api.getImageBlocksInScope(ROOT_ID)
    const blocksForRoot = await api.getImageBlocksInScope(ROOT_ID, "")

    expect(blocks).toEqual([{ id: "doc-block" }])
    expect(blocksForRoot).toEqual([{ id: "doc-block" }])
    expect(api.siyuanApi.getImageBlocksByID).toHaveBeenCalledTimes(2)
    expect(api.siyuanApi.sql).not.toHaveBeenCalled()
  })

  it("keeps the whole-document query when the focus block is the document itself", async () => {
    const api = createPostApi()

    await api.getImageBlocksInScope(ROOT_ID, ROOT_ID)

    expect(api.siyuanApi.getImageBlocksByID).toHaveBeenCalledWith(ROOT_ID)
    expect(api.siyuanApi.sql).not.toHaveBeenCalled()
  })

  it("queries the heading subtree including nested heading children", async () => {
    const api = createPostApi({ headingChildren: [CHILD_ID, "20261120122056-nd7mpfq"] })

    const blocks = await api.getImageBlocksInScope(ROOT_ID, FOCUS_ID)

    expect(api.siyuanApi.siyuanRequest).toHaveBeenCalledWith("/api/block/getHeadingChildrenIDs", { id: FOCUS_ID })
    const sql = api.siyuanApi.sql.mock.calls[0][0] as string
    expect(sql).toContain(`'${FOCUS_ID}'`)
    expect(sql).toContain(`'${CHILD_ID}'`)
    expect(sql).toContain(`b.root_id = '${ROOT_ID}'`)
    expect(sql).toContain("ORDER BY d.depth DESC")
    expect(sql).toContain("LIMIT 10000")
    expect(blocks).toEqual([{ id: "scoped-block" }])
  })

  it("falls back to the focus block when heading children are unavailable", async () => {
    const api = createPostApi({ headingError: new Error("not found") })

    await api.getImageBlocksInScope(ROOT_ID, FOCUS_ID)

    expect(api.logger.warn).toHaveBeenCalled()
    const sql = api.siyuanApi.sql.mock.calls[0][0] as string
    expect(sql).toContain(`'${FOCUS_ID}'`)
    expect(api.siyuanApi.sql).toHaveBeenCalledTimes(1)
  })

  it("skips the scoped query for an invalid document id", async () => {
    const api = createPostApi({ headingChildren: [CHILD_ID] })

    const blocks = await api.getImageBlocksInScope("invalid-doc", FOCUS_ID)

    expect(blocks).toEqual([])
    expect(api.siyuanApi.sql).not.toHaveBeenCalled()
  })
})
