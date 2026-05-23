import { IJSON } from "../../types"
import { TextFileSync } from "../base/electron/TextFile"
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
    }
    try {
      const res = JSON.parse(stripJsonComments(data || "{}"))
      if (res === null || typeof res !== "object") {
        return {}
      }
      return res as IJSON
    } catch (e) {
      console.error("[PicGo store] JSON parse error", e)
      return {}
    }
  }

  write(obj: any): void {
    writeFileSync(this.dbPath, JSON.stringify(obj, null, 2))
  }
}

function stripJsonComments(input: string): string {
  let output = ""
  let inString = false
  let escaped = false
  let inLineComment = false
  let inBlockComment = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false
        output += char
      }
      continue
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false
        i++
      } else if (char === "\n" || char === "\r") {
        output += char
      }
      continue
    }

    if (inString) {
      output += char
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      output += char
      continue
    }

    if (char === "/" && next === "/") {
      inLineComment = true
      i++
      continue
    }

    if (char === "/" && next === "*") {
      inBlockComment = true
      i++
      continue
    }

    output += char
  }

  return output
}
