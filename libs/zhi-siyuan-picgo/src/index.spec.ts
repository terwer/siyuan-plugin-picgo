import { describe, it } from "vitest"
import { getFileHash } from "./lib/utils/md5Util"

describe("index", () => {
  it("test index", () => {
    console.log(getFileHash("hello"))
  })
})
