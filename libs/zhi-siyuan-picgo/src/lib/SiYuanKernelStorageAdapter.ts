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
 * PicGo 3.0: 所有用户配置 owner files 均通过此适配器
 * (picgo.cfg.json, external-picgo-cfg.json, siyuan-cfg.json)。
 * 仅 PC-only runtime artifacts 保持本地。
 */
export class SiYuanKernelStorageAdapter implements IAsyncStorageAdapter {
  readonly mode = "async" as const
  readonly storageKind = "siyuan-kernel" as const

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
      const err = this.createKernelError("read", remote.reason ?? "unknown")
      this.logger.error("[KernelAdapter]", err.message)
      throw err
    }

    // Only a real missing owner file may consult browser legacy data.
    // Kernel unavailable/auth/transport failures are not missing files and
    // must never fall back to localStorage or generated defaults.
    this.logger.info("[KernelAdapter] file missing, trying localStorage migration")
    const migrated = await this.tryMigrateLocalStorage()
    if (migrated) {
      this.logger.info("[KernelAdapter] migrated from localStorage, keys:", Object.keys(migrated))
      return migrated
    }

    // No remote data and no localStorage data — return empty.
    // The facade will seed defaults via mergeDefaults().
    this.logger.info("[KernelAdapter] no data, returning empty")
    return {}
  }

  async write(data: IJSON): Promise<void> {
    this.logger.info("[KernelAdapter] writing to", this.serverPath)
    const serialized = JSON.stringify(data, null, 2)

    let result: unknown
    try {
      result = await this.api.saveTextData(this.serverPath, serialized)
    } catch (e: any) {
      throw this.createKernelError("write", `saveTextData threw: ${String(e?.message || e)}`)
    }

    // zhi-siyuan-api@2.21.0 saveTextData() is typed as returning SiyuanData,
    // but its implementation delegates to putFile()/siyuanRequestForm(), which
    // returns response.data on code=0. For the Kernel file put endpoint that is commonly
    // null, so absence of a top-level `code` must not be treated as failure.
    if (this.isExplicitFailedSiyuanResult(result)) {
      throw this.createKernelError("write", `saveTextData failed: ${result.msg ?? "unknown error"}`)
    }

    await this.verifyWrite(serialized)
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
      throw this.createKernelError("write", `Migration write failed: ${String(e?.message || e)}`)
    }

    return JSON.parse(raw)
  }

  private isExplicitFailedSiyuanResult(result: unknown): result is { code: number; msg?: string } {
    return Boolean(
      result &&
      typeof result === "object" &&
      "code" in result &&
      typeof (result as { code?: unknown }).code === "number" &&
      (result as { code: number }).code !== 0
    )
  }

  private async verifyWrite(expectedSerialized: string): Promise<void> {
    const remote = await this.readKernelFile()
    if (remote.status !== "exists" || !remote.text || remote.text.trim() === "") {
      throw this.createKernelError(
        "write",
        `write verification failed: ${remote.status}${remote.reason ? `: ${remote.reason}` : ""}`
      )
    }

    try {
      const expected = JSON.parse(expectedSerialized)
      const actual = JSON.parse(remote.text)
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error("remote content mismatch after saveTextData")
      }
    } catch (e: any) {
      throw this.createKernelError("write", `write verification failed: ${String(e?.message || e)}`)
    }
  }

  private createKernelError(operation: "read" | "write", reason: string): Error {
    const err = new Error(
      `SiYuan Kernel ${operation} failed for owner file ${this.serverPath} ` +
      `(storage=siyuan-kernel, legacyKey=${this.localStorageKey}): ${reason}`
    ) as Error & {
      storageKind?: string
      ownerFile?: string
      serverPath?: string
      localStorageKey?: string
      operation?: string
      causeReason?: string
    }
    err.storageKind = "siyuan-kernel"
    err.ownerFile = this.serverPath
    err.serverPath = this.serverPath
    err.localStorageKey = this.localStorageKey
    err.operation = operation
    err.causeReason = reason
    return err
  }
}

interface KernelFileResult {
  status: "exists" | "missing" | "unavailable"
  text?: string
  reason?: string
}
