import { afterEach, describe, expect, it } from "vitest"
import ConfigDb from "."

const createCtx = (configPath: string) =>
  ({
    configPath,
    log: {
      error: () => undefined,
    },
  }) as any

describe("ConfigDb defaults", () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it("enables low-friction SiYuan upload defaults for first-time users", () => {
    const db = new ConfigDb(createCtx("config-db-defaults"))

    expect(db.get("siyuan.autoUpload")).toBe(true)
    expect(db.get("siyuan.replaceLink")).toBe(true)
    expect(db.get("siyuan.txtImageSwitch")).toBe(false)
    expect(db.get("siyuan.waitTimeout")).toBe(2)
    expect(db.get("siyuan.retryTimes")).toBe(5)
  })

  it("does not overwrite an explicit user choice", () => {
    window.localStorage.setItem(
      "config-db-existing-choice",
      JSON.stringify({
        picBed: {
          uploader: "github",
          current: "github",
        },
        picgoPlugins: {},
        siyuan: {
          autoUpload: false,
          replaceLink: false,
          txtImageSwitch: true,
        },
      })
    )

    const db = new ConfigDb(createCtx("config-db-existing-choice"))

    expect(db.get("siyuan.autoUpload")).toBe(false)
    expect(db.get("siyuan.replaceLink")).toBe(false)
    expect(db.get("siyuan.txtImageSwitch")).toBe(true)
  })
})
