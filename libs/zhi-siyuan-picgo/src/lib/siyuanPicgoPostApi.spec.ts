import { describe, expect, it, vi } from "vitest"
import type { ConfigDomain, UnifiedConfigMigrationState } from "universal-picgo"
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
