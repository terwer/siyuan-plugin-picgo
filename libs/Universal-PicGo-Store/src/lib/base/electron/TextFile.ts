/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SyncAdapter } from "@commonify/lowdb"
import { win } from "../../utils"

export class TextFileSync implements SyncAdapter<string> {
  // PathLike
  #tempFilename: any
  // PathLike
  #filename: any

  // PathLike
  constructor(filename: any) {
    const path = win.require("path")
    this.#filename = filename
    const f = filename.toString()
    this.#tempFilename = path.join(path.dirname(f), `.${path.basename(f)}.tmp`)
  }

  read(): string | null {
    let data

    try {
      const fs = win.fs
      data = fs.readFileSync(this.#filename, "utf-8")
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        return null
      }
      throw e
    }

    return data
  }

  write(str: string): void {
    const fs = win.fs
    fs.writeFileSync(this.#tempFilename, str)
    fs.renameSync(this.#tempFilename, this.#filename)
  }
}
