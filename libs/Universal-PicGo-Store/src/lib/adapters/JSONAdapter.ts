import { IJSON } from "../../types"
import { TextFileSync } from "../base/electron/TextFile"
import json from "comment-json"
import { writeFileSync } from "../base/electron/writeFileAtomic"

export class JSONAdapter {
  private readonly adapter: TextFileSync
  private readonly dbPath: string
  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.adapter = new TextFileSync(dbPath)
  }

  read(): IJSON {
    const data = this.adapter.read()
    /* istanbul ignore if */
    if (data === null) {
      return {}
    } else {
      try {
        // comment-json will break in some cases
        const res = json.parse(data || "{}")
        if (res === null || typeof res !== "object") {
          return {}
        }
        return res as IJSON
      } catch (e) {
        try {
          return JSON.parse(data)
        } catch (e) {
          console.error("[PicGo store] JSON parse error", e)
          return {}
        }
      }
    }
  }

  write(obj: any): void {
    writeFileSync(this.dbPath, json.stringify(obj, null, 2))
  }
}
