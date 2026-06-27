import { JSONStore } from "./lib/JSONStore"
import { JSONAdapter } from "./lib/adapters/JSONAdapter"
import { LocalStorageAdapter } from "./lib/adapters/LocalStorageAdapter"
import { win, currentWin, parentWin, hasNodeEnv } from "./lib/utils"
import type {
  IJSON,
  ISyncStorageAdapter,
  IAsyncStorageAdapter,
  StorageAdapter,
  StorageAdapterFactory,
} from "./types"

export type { IJSON, ISyncStorageAdapter, IAsyncStorageAdapter, StorageAdapter, StorageAdapterFactory }
export { JSONStore, JSONAdapter, LocalStorageAdapter }
export { win, currentWin, parentWin, hasNodeEnv }
