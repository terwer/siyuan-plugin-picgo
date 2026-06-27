/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

export interface IJSON {
  [propsName: string]: string | number | IJSON
}

/** 同步存储适配器（文件系统 / localStorage） */
export interface ISyncStorageAdapter {
  read(): IJSON
  write(data: IJSON): void
}

/** 异步存储适配器（内核 API / 远程存储）。MUST 使用 `mode: "async"` 显式标识。 */
export interface IAsyncStorageAdapter {
  readonly mode: "async"
  read(): Promise<IJSON>
  write(data: IJSON): Promise<void>
}

export type StorageAdapter = ISyncStorageAdapter | IAsyncStorageAdapter

export type StorageAdapterFactory = (dbPath: string) => StorageAdapter
