import { afterEach, describe, expect, it, vi } from "vitest"
import * as store from "universal-picgo-store"
import {
  isElectronRuntime,
  isPicGoPluginPackageName,
  isThirdPartyPluginRuntimeAvailable,
} from "./pluginRuntime"

describe("PicGo third-party plugin runtime guard", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("allows third-party plugins only in Electron runtime", () => {
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue({
      process: {
        versions: {
          electron: "28.0.0",
        },
      },
    } as any)

    expect(isElectronRuntime()).toBe(true)
    expect(isThirdPartyPluginRuntimeAvailable()).toBe(true)
  })

  it("blocks third-party plugin config in non-Electron Node runtimes", () => {
    vi.spyOn(store, "hasNodeEnv", "get").mockReturnValue(true)
    vi.spyOn(store, "win", "get").mockReturnValue({
      process: {
        versions: {
          node: "20.0.0",
        },
      },
    } as any)

    expect(isElectronRuntime()).toBe(false)
    expect(isThirdPartyPluginRuntimeAvailable()).toBe(false)
  })

  it("recognizes PicGo plugin package names", () => {
    expect(isPicGoPluginPackageName("picgo-plugin-watermark-elec")).toBe(true)
    expect(isPicGoPluginPackageName("@scope/picgo-plugin-s3")).toBe(true)
    expect(isPicGoPluginPackageName("picgo")).toBe(false)
  })
})
