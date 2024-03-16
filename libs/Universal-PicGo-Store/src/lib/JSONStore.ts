/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IJSON } from "../types"
import localForage from "localforage"
import { hasNodeEnv } from "./utils"

class JSONStore {
  constructor(dbPath: string) {
    if (!dbPath) {
      throw Error("Please provide valid dbPath")
    }

    if (hasNodeEnv) {

    } else {
    }
    alert(1)
  }

  read(flush = false): IJSON {
    throw Error("Not Implemented")
  }

  get(key = ""): any {
    throw Error("get Not Implemented for json store")
  }

  set(key: string, value: any): void {
    throw Error("Not Implemented")
  }

  has(key: string): boolean {
    throw Error("Not Implemented")
  }

  unset(key: string, value: any): boolean {
    throw Error("Not Implemented")
  }
}

export { JSONStore }
