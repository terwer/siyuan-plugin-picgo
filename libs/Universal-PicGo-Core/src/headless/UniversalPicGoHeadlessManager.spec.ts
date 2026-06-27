import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  BUILT_IN_UPLOADER_IDS,
  PICGO_HEADLESS_ERROR_CODES,
  PicGoHeadlessError,
  createPicGoHeadlessManager,
} from "./index"

let storeId = 0

const createManager = () => {
  storeId += 1
  return createPicGoHeadlessManager({
    configPath: `headless-contract-${storeId}`,
    baseDir: `headless-runtime-${storeId}`,
    pluginBaseDir: `headless-plugins-${storeId}`,
  })
}

describe("UniversalPicGoHeadlessManager", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("reads initialized config and preserves unknown fields while saving one uploader", async () => {
    const manager = createManager()
    const ctx = manager.getContext()
    ctx.saveConfig({
      "custom.unknown": { keep: true },
      "picBed.github": {
        repo: "old/repo",
        token: "old-token",
        branch: "main",
        extra: "keep-me",
      },
      "picBed.imgur": {
        clientId: "imgur-client",
      },
    })

    const result = await manager.saveUploaderConfig(
      "github",
      {
        repo: "new/repo",
        token: "new-token",
      },
      { setCurrent: true }
    )

    expect(result.ok).toBe(true)
    expect(ctx.getConfig("custom.unknown")).toEqual({ keep: true })
    expect(ctx.getConfig("picBed.imgur")).toEqual({ clientId: "imgur-client" })
    expect(ctx.getConfig("picBed.github")).toMatchObject({
      repo: "new/repo",
      token: "new-token",
      branch: "main",
      extra: "keep-me",
    })
    expect(ctx.getConfig("picBed.uploader")).toBe("github")
    expect(ctx.getConfig("picBed.current")).toBe("github")
  })

  it("lists built-in uploaders and exposes serializable schema metadata", () => {
    const manager = createManager()

    const uploaders = manager.listUploaders()
    expect(uploaders.map((item) => item.id)).toEqual(expect.arrayContaining([...BUILT_IN_UPLOADER_IDS]))
    expect(uploaders.find((item) => item.id === "github")).toMatchObject({
      builtin: true,
      schemaAvailable: true,
    })

    const githubSchema = manager.getUploaderSchema("github")
    const tokenField = githubSchema.fields.find((field) => field.name === "token")
    expect(tokenField).toMatchObject({
      type: "password",
      required: true,
      sensitive: true,
      valuePath: "picBed.github.token",
    })
    expect(JSON.parse(JSON.stringify(githubSchema))).toMatchObject({
      id: "github",
      builtin: true,
    })

    const tcyunSchema = manager.getUploaderSchema("tcyun")
    expect(tcyunSchema.fields.find((field) => field.name === "version")?.choices).toEqual([
      { label: "v4", value: "v4" },
      { label: "v5", value: "v5" },
    ])
  })

  it("audits every built-in uploader schema", () => {
    const manager = createManager()

    expect(manager.auditUploaderSchemas()).toEqual({
      ok: true,
      errors: [],
    })
  })

  it("returns structured validation errors for missing fields and unknown uploaders", async () => {
    const manager = createManager()

    expect(manager.validateUploaderConfig("github", { repo: "terwer/repo" })).toMatchObject({
      ok: false,
      uploaderId: "github",
      errors: expect.arrayContaining([
        expect.objectContaining({
          code: PICGO_HEADLESS_ERROR_CODES.MISSING_REQUIRED_FIELD,
          field: "token",
        }),
      ]),
    })

    const currentBefore = await manager.getCurrentUploader()
    expect(await manager.setCurrentUploader("not-exists")).toMatchObject({
      ok: false,
      errors: [
        expect.objectContaining({
          code: PICGO_HEADLESS_ERROR_CODES.UNKNOWN_UPLOADER,
        }),
      ],
    })
    expect(await manager.getCurrentUploader()).toBe(currentBefore)
  })

  it("uses the same validation before upload", async () => {
    const manager = createManager()
    await manager.setCurrentUploader("smms")

    await expect(manager.upload(["/tmp/image.png"])).rejects.toMatchObject({
      code: PICGO_HEADLESS_ERROR_CODES.VALIDATION_FAILED,
      errors: [
        expect.objectContaining({
          field: "token",
          code: PICGO_HEADLESS_ERROR_CODES.MISSING_REQUIRED_FIELD,
        }),
      ],
    })

    await manager.saveUploaderConfig("smms", { token: "token" }, { setCurrent: true })
    manager.getContext().upload = vi.fn(async () => [{ fileName: "image.png", imgUrl: "https://example.invalid/image.png" }])

    await expect(manager.upload(["/tmp/image.png"])).resolves.toEqual([
      { fileName: "image.png", imgUrl: "https://example.invalid/image.png" },
    ])
  })

  it("throws a structured schema error for unknown uploader schema lookup", () => {
    const manager = createManager()

    expect(() => manager.getUploaderSchema("not-exists")).toThrow(PicGoHeadlessError)
    try {
      manager.getUploaderSchema("not-exists")
    } catch (e) {
      expect(e).toMatchObject({
        code: PICGO_HEADLESS_ERROR_CODES.UNKNOWN_UPLOADER,
        uploaderId: "not-exists",
      })
    }
  })
})
