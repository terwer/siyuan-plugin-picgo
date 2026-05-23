import { describe, expect, it } from "vitest"
import { deepMerge, getByPath, setByPath, unsetByPath } from "./pathObject"

describe("pathObject helpers", () => {
  it("gets, sets, unsets, and deep merges dotted paths", () => {
    const target: any = {}

    setByPath(target, "picBed.current", "smms")
    setByPath(target, "uploader.smms.defaultId", "default")

    expect(getByPath(target, "picBed.current")).toBe("smms")
    expect(getByPath(target, "missing.key", "fallback")).toBe("fallback")
    expect(unsetByPath(target, "uploader.smms.defaultId")).toBe(true)
    expect(unsetByPath(target, "uploader.smms.defaultId")).toBe(false)
    expect(target.uploader.smms).toEqual({})

    deepMerge(target, {
      picBed: { uploader: "github" },
      uploader: { github: { defaultId: "github-default" } },
    })

    expect(target).toEqual({
      picBed: { current: "smms", uploader: "github" },
      uploader: { smms: {}, github: { defaultId: "github-default" } },
    })
  })
})
