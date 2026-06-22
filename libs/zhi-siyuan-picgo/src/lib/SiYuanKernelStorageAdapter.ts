/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024-2025 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import type { IAsyncStorageAdapter, IJSON } from "universal-picgo-store"
import type { SiyuanKernelApi } from "zhi-siyuan-api"
import type { ILogger } from "zhi-lib-base"

/**
 * 思源内核 API 异步存储适配器。
 *
 * 通过 SiyuanKernelApi 封装层读写服务器文件。
 * 仅主配置 `picgo.cfg.json` 走此适配器，其余走 LocalStorageAdapter。
 */
export class SiYuanKernelStorageAdapter implements IAsyncStorageAdapter {
  readonly mode = "async" as const

  constructor(
    private readonly api: SiyuanKernelApi,
    private readonly serverPath: string,
    private readonly localStorageKey: string,
    private readonly logger: ILogger
  ) {}

  async read(): Promise<IJSON> {
    this.logger.info("[KernelAdapter] reading from", this.serverPath)
    const remote = await this.readKernelFile()
    this.logger.info("[KernelAdapter] readKernelFile result =>", remote.status)

    if (remote.status === "exists" && remote.text && remote.text.trim() !== "") {
      const parsed = JSON.parse(remote.text) as IJSON
      this.logger.info("[KernelAdapter] parsed remote data, keys:", Object.keys(parsed))
      return parsed
    }

    if (remote.status === "unavailable") {
      const err = new Error(`SiYuan kernel API unavailable: ${remote.reason}`)
      this.logger.error("[KernelAdapter]", err.message)
      throw err
    }

    this.logger.info("[KernelAdapter] file missing, trying localStorage migration")
    const migrated = await this.tryMigrateLocalStorage()
    if (migrated) {
      this.logger.info("[KernelAdapter] migrated from localStorage, keys:", Object.keys(migrated))
      return migrated
    }

    this.logger.info("[KernelAdapter] no data, returning empty")
    return {}
  }

  async write(data: IJSON): Promise<void> {
    this.logger.info("[KernelAdapter] writing to", this.serverPath)
    const result = await this.api.saveTextData(this.serverPath, JSON.stringify(data, null, 2))
    if (result?.code !== 0) {
      throw new Error(`saveTextData failed: ${result?.msg ?? "unknown error"}`)
    }
    this.logger.info("[KernelAdapter] write complete")
  }

  // ── 内部 ──

  private async readKernelFile(): Promise<KernelFileResult> {
    try {
      this.logger.info("[KernelAdapter] calling getFile:", this.serverPath)
      const text = await this.api.getFile(this.serverPath, "text")
      this.logger.info("[KernelAdapter] getFile returned", {
        type: typeof text,
        value: text === null ? "null" : text === "" ? "empty-string" : `length=${String(text).length}`,
      })

      // getFile 合约：
      // - HTTP 200 且有数据 → 文本内容
      // - HTTP 200 且 body {code: 404} → ""（文件不存在）
      // - 任何非 200 → null（API 不可达/鉴权失败）
      if (text === null) {
        return { status: "unavailable", reason: "kernel API returned null (non-200)" }
      }
      if (text === undefined || text === "") {
        return { status: "missing" }
      }
      return { status: "exists", text: String(text) }
    } catch (e: any) {
      return { status: "unavailable", reason: String(e?.message || e || "") }
    }
  }

  private async tryMigrateLocalStorage(): Promise<IJSON | null> {
    if (typeof window === "undefined" || !window.localStorage) {
      this.logger.info("[KernelAdapter] no window.localStorage, skip migration")
      return null
    }

    const raw = window.localStorage.getItem(this.localStorageKey)
    if (!raw) {
      this.logger.info("[KernelAdapter] localStorage key not found:", this.localStorageKey)
      return null
    }

    try { JSON.parse(raw) } catch {
      this.logger.info("[KernelAdapter] localStorage data is not valid JSON")
      return null
    }

    try {
      await this.write(JSON.parse(raw))
      this.logger.info("[KernelAdapter] migrated localStorage → kernel:", this.serverPath)
    } catch (e: any) {
      throw new Error(`Migration write failed: ${String(e?.message || e)}`)
    }

    return JSON.parse(raw)
  }
}

interface KernelFileResult {
  status: "exists" | "missing" | "unavailable"
  text?: string
  reason?: string
}
