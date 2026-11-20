import { afterEach, describe, expect, it } from "vitest"
import { getPageQueryParam } from "./pageQuery"

afterEach(() => {
  window.history.replaceState({}, "", "/")
})

describe("getPageQueryParam", () => {
  it("reads a parameter from a plain query string", () => {
    window.history.replaceState({}, "", "/plugins/siyuan-plugin-picgo/?pageId=20260526165741-p675vq6")

    expect(getPageQueryParam("pageId")).toBe("20260526165741-p675vq6")
  })

  it("reads a parameter from a hash query with a leading slash", () => {
    window.history.replaceState(
      {},
      "",
      "/plugins/siyuan-plugin-picgo/#/?pageId=20260526165741-p675vq6&scopeBlockId=20260526165741-focus"
    )

    expect(getPageQueryParam("pageId")).toBe("20260526165741-p675vq6")
    expect(getPageQueryParam("scopeBlockId")).toBe("20260526165741-focus")
  })

  it("reads a parameter when a cache-busting query precedes the hash", () => {
    window.history.replaceState(
      {},
      "",
      "/plugins/siyuan-plugin-picgo/?v=1795151772265#/?pageId=20260526165741-p675vq6&scopeBlockId=20260526165741-focus"
    )

    expect(getPageQueryParam("pageId")).toBe("20260526165741-p675vq6")
    expect(getPageQueryParam("scopeBlockId")).toBe("20260526165741-focus")
  })

  it("returns an empty string for a missing parameter", () => {
    window.history.replaceState({}, "", "/plugins/siyuan-plugin-picgo/#/setting?showBack=true")

    expect(getPageQueryParam("scopeBlockId")).toBe("")
  })
})
