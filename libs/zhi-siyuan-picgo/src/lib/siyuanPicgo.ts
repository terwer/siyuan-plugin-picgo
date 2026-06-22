/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { SiyuanPicgoPostApi } from "./siyuanPicgoPostApi"
import { ILogger, simpleLogger } from "zhi-lib-base"
import {
  resolveSiyuanPicGoPaths,
  SIYUAN_PICGO_KERNEL_CONFIG_PATH,
  SIYUAN_PICGO_KERNEL_EXTERNAL_PATH,
  SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH,
  SIYUAN_PICGO_MAIN_CONFIG_KEY,
  SIYUAN_PICGO_EXTERNAL_CONFIG_KEY,
  SIYUAN_PICGO_SIYUAN_CONNECTION_KEY,
  type SiyuanPicGoInstanceOptions,
} from "./siyuanPicgoPaths"
import type { SiyuanConfigLike } from "./siyuanConfigLike"
import { SiyuanKernelApi } from "zhi-siyuan-api"
import { JSONAdapter, LocalStorageAdapter, hasNodeEnv } from "universal-picgo-store"
import type { StorageAdapter } from "universal-picgo-store"
import { isSiyuanProxyAvailable } from "universal-picgo"
import { SiyuanDevice } from "zhi-device"
import { SiYuanKernelStorageAdapter } from "./SiYuanKernelStorageAdapter"

class SiyuanPicGo {
  private static logger: ILogger | null = null
  private static siyuanApiInstance: SiyuanKernelApi | null = null
  private static picgoInstance: SiyuanPicgoPostApi | null = null
  private static instanceKey: string | null = null

  public static async getInstance(
    siyuanConfig: SiyuanConfigLike,
    options?: boolean | SiyuanPicGoInstanceOptions
  ): Promise<SiyuanPicgoPostApi> {
    const normalizedOptions: SiyuanPicGoInstanceOptions =
      typeof options === "boolean" ? { isDev: options } : options ?? {}
    const isDev = normalizedOptions.isDev
    const paths = resolveSiyuanPicGoPaths(normalizedOptions.paths)

    const resolved = normalizedOptions.storageAdapterFactory
      ? { kind: "custom" as const, factory: normalizedOptions.storageAdapterFactory }
      : resolveStorageAdapterFactory(siyuanConfig)

    const factory = resolved.factory

    const instanceKey = JSON.stringify({
      apiUrl: siyuanConfig.apiUrl,
      configPath: paths.configPath,
      baseDir: paths.baseDir,
      pluginBaseDir: paths.pluginBaseDir,
      zhiNpmPath: paths.zhiNpmPath,
      storageKind: resolved.kind,
    })

    if (!this.logger) {
      this.logger = simpleLogger("get-instance", "zhi-siyuan-picgo", isDev)
    }

    if (this.instanceKey !== null && this.instanceKey !== instanceKey) {
      this.logger.info("PicGo instance path contract changed, reinitializing singleton")
      this.siyuanApiInstance = null
      this.picgoInstance = null
      this.instanceKey = null
    }

    if (!this.siyuanApiInstance) {
      this.logger.debug("初始化 SiyuanKernelApi 实例")
      this.siyuanApiInstance = new SiyuanKernelApi(siyuanConfig as any)
    }

    const isNewInstance = !this.picgoInstance
    if (!this.picgoInstance) {
      this.logger.debug("初始化 SiyuanPicgoPostApi 实例")
      this.logger.info("resolved PicGo paths =>", paths)
      this.picgoInstance = new SiyuanPicgoPostApi(siyuanConfig, isDev, paths, factory)
      this.instanceKey = instanceKey
    }

    await this.picgoInstance.init()
    if (isNewInstance) {
      await this.checkConfigMigration(this.siyuanApiInstance, this.picgoInstance)
    }

    return this.picgoInstance
  }

  private static async checkConfigMigration(siyuanApi: SiyuanKernelApi, picgo: SiyuanPicgoPostApi): Promise<void> {
    const initialState = picgo.getConfigMigrationState()
    if (initialState.status === "running") {
      siyuanApi.pushMsg({
        msg: "检测到 PicGo 配置初始化或迁移任务，正在等待完成，请勿进行任何操作...",
        timeout: 1000,
      })
      this.logger?.warn("检测到 PicGo 配置初始化或迁移任务，正在等待完成...")
      await picgo.waitForConfigMigration()
    }
    const finalState = picgo.getConfigMigrationState()
    if (finalState.status === "failed") {
      const errorText = finalState.error ? `，错误信息：${finalState.error}` : ""
      siyuanApi.pushErrMsg({
        msg: `PicGo 配置初始化或迁移失败${errorText}。请在 PicGo 设置页点击"重试初始化"。`,
        timeout: 7000,
      })
      this.logger?.error(`PicGo config migration failed${errorText}`)
      return
    }
    if (initialState.status === "running" && finalState.status === "done") {
      siyuanApi.pushMsg({ msg: "PicGO 配置初始化或迁移完成", timeout: 7000 })
      this.logger?.info("PicGO 配置初始化或迁移完成🎉")
    }
    this.logger?.info("PicGO instance is ready😄")
  }
}

function resolveStorageAdapterFactory(config: SiyuanConfigLike): {
  kind: "node-json" | "siyuan-kernel" | "local-storage"
  factory: (dbPath: string) => StorageAdapter
} {
  if (hasNodeEnv) return { kind: "node-json", factory: (path) => new JSONAdapter(path) }

  // iframe / window 有 siyuan 对象
  if (getSiyuanRuntimeConfig()?.workspaceDir) {
    return createKernelFactory(config)
  }

  // 同域直开：通过 API 连通性验证
  if (isSiyuanProxyAvailable()) {
    console.info("[resolveStorageAdapterFactory] proxy available, using kernel adapter")
    return createKernelFactory(config)
  }

  return { kind: "local-storage", factory: (path) => new LocalStorageAdapter(path) }
}

function createKernelFactory(config: SiyuanConfigLike) {
  const kernelApi = new SiyuanKernelApi(config as any)
  const kernelLogger = simpleLogger("kernel-storage", "zhi-siyuan-picgo")

  // Map logical keys to their kernel server paths.
  // PicGo 3.0: ALL user configuration domains go through Kernel adapter
  // when running in Kernel-backed runtime (supersedes v2 main-config-only).
  const kernelPathByLogicalKey: Record<string, string> = {
    [SIYUAN_PICGO_MAIN_CONFIG_KEY]: SIYUAN_PICGO_KERNEL_CONFIG_PATH,
    [SIYUAN_PICGO_EXTERNAL_CONFIG_KEY]: SIYUAN_PICGO_KERNEL_EXTERNAL_PATH,
    [SIYUAN_PICGO_SIYUAN_CONNECTION_KEY]: SIYUAN_PICGO_KERNEL_SIYUAN_CONNECTION_PATH,
  }

  return {
    kind: "siyuan-kernel" as const,
    factory: (dbPath: string) => {
      const kernelPath = kernelPathByLogicalKey[dbPath]
      if (kernelPath) {
        return new SiYuanKernelStorageAdapter(
          kernelApi,
          kernelPath,
          dbPath,
          kernelLogger
        )
      }
      // PC-only runtime artifacts (plugin packages, logs, etc.) stay local
      return new LocalStorageAdapter(dbPath)
    },
  }
}

function getSiyuanRuntimeConfig(): { workspaceDir: string } | null {
  try {
    const win = SiyuanDevice.siyuanWindow()
    return win?.siyuan?.config?.system ?? null
  } catch {
    return null
  }
}

export { SiyuanPicGo }
