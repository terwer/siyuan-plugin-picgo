import { afterEach, describe, expect, it, vi } from "vitest"
import { getLoggerConfig, isLevelEnabled, resetLoggerConfig, simpleLogger } from "zhi-lib-base"
import { configureLogging } from "./logging"

describe("configureLogging", () => {
  afterEach(() => {
    resetLoggerConfig()
    vi.restoreAllMocks()
  })

  it("uses warn as the default level", () => {
    configureLogging()

    expect(getLoggerConfig().level).toBe("warn")
    expect(isLevelEnabled("info", "zhi-siyuan-api")).toBe(false)
    expect(isLevelEnabled("info", "zhi")).toBe(false)
    expect(isLevelEnabled("warn", "zhi-siyuan-api")).toBe(true)
    expect(isLevelEnabled("error", "zhi-siyuan-api")).toBe(true)
  })

  it("keeps the upload action lines", () => {
    configureLogging()

    expect(isLevelEnabled("info", "universal-picgo")).toBe(true)
    expect(isLevelEnabled("info", "picgo-plugin")).toBe(true)
  })

  it("does not print dependency INFO lines", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})

    configureLogging()
    simpleLogger("noisy", "zhi-siyuan-api").info("dependency info")

    expect(infoSpy).not.toHaveBeenCalled()
  })
})
