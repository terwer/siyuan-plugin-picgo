import { IJSON } from "../../types"
import localForage from "localforage"

export class LocalForgeAdapter {
  private readonly adapter: LocalForage
  private readonly dbPath: string

  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.adapter = localForage
    localForage.config({
      driver: localForage.LOCALSTORAGE, // Force WebSQL; same as using setDriver()
      name: "universal-picgo-store",
      version: 1.0,
      storeName: "picgo-store", // Should be alphanumeric, with underscores.
      description: "universal picgo store",
    })
  }

  read(): IJSON {
    console.log(this.adapter)
    throw new Error("Method LocalForgeAdapter.read not implemented")

    const data = this.adapter.getItem(this.dbPath)
  }

  write(obj: any): void {
    throw new Error("Method LocalForgeAdapter.write not implemented")
  }
}
