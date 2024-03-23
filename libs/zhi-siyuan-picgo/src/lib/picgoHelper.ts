/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import _ from "lodash-es"
import {
  eventBus,
  IBusEvent,
  IConfig,
  IPicBedType,
  IPicGo,
  IUploaderConfigItem,
  IUploaderConfigListItem
} from "universal-picgo"
import { getRawData, trimValues } from "./utils/utils"
import { readonly } from "vue"
import IdUtil from "./utils/idUtil"

/**
 * picgo 工具类
 *
 * @version 1.6.0
 * @since 1.6.0
 * @author terwer
 */
class PicgoHelper {
  private readonly ctx: IPicGo
  /**
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * !!! 这个 cfg 是响应式的，修改这个会自动完成持久化
   *
   * @private
   */
  private readonly reactiveCfg: IConfig
  private readonly readonlyCfg: IConfig

  /**
   * 狗子 PicGo 帮组类
   *
   * @param ctx 上下文
   * @param reactiveCfg 响应式配置对象
   */
  constructor(ctx: IPicGo, reactiveCfg: IConfig) {
    if (!ctx) {
      throw new Error("PicGo ctx cannot be null")
    }
    if (!reactiveCfg) {
      throw new Error("PicGo reactive config cannot be null")
    }
    this.ctx = ctx
    this.reactiveCfg = reactiveCfg
    this.readonlyCfg = readonly(this.reactiveCfg)
  }

  /**
   * 根据 key 获取配置项
   *
   * @param key
   * @param defaultValue
   */
  public getPicgoConfig(key?: string, defaultValue?: any) {
    if (!key) {
      return this.readonlyCfg as unknown
    }
    return _.get(this.readonlyCfg, key, defaultValue)
  }

  /**
   * 保存配置
   *
   * @param cfg
   */
  public savePicgoConfig(cfg: Partial<IConfig>) {
    if (!cfg) {
      console.warn(`cfg can not be undefined `)
      return
    }
    // 刷新
    Object.keys(cfg).forEach((name: string) => {
      const rawCfg = getRawData(cfg)
      _.set(this.reactiveCfg, name, rawCfg[name])
      eventBus.emit(IBusEvent.CONFIG_CHANGE, {
        configName: name,
        value: rawCfg[name]
      })
    })
  }

  /**
   * 获取所有的图床列表
   */
  public getPicBeds(): IPicBedType[] {
    const picBedTypes = this.ctx.helper.uploader.getIdList()
    const picBedFromDB = this.getPicgoConfig("picBed.list") || []

    const picBeds = picBedTypes
      .map((item: any) => {
        const visible = picBedFromDB.find((i: any) => i.type === item) // object or undefined
        return {
          type: item,
          name: this.ctx.helper.uploader.get(item).name || item,
          visible: visible ? visible.visible : true
        }
      })
      .sort((a: any) => {
        if (a.type === "smms") {
          return -1
        }
        return 0
      })

    return picBeds
  }

  /**
   * 获取启用的图床
   */
  public getVisiablePicBeds(): IPicBedType[] {
    const picBeds = this.getPicBeds()
    const visiablePicBeds = picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item
        }
        return null
      })
      .filter((item: any) => item) as IPicBedType[]

    // SM.MS是必选的
    if (visiablePicBeds.length == 0) {
      const defaultPicbed = {
        type: "smms",
        name: "SM.MS"
      } as IPicBedType
      visiablePicBeds.push(defaultPicbed)
    }
    return visiablePicBeds
  }

  /**
   * 获取可用的图床列表名称
   */
  public getVisiablePicBedNames(): string[] {
    const picBeds = this.getPicBeds()
    return picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item.name
        }
        return null
      })
      .filter((item: any) => item) as string[]
  }

  /**
   * 根据图床数据获取可用的图床列表名称
   *
   * @param picBeds
   */
  public static getVisiablePicBedNamesByPicBeds(picBeds: IPicBedType[]): string[] {
    return picBeds
      .map((item: IPicBedType) => {
        if (item.visible) {
          return item.name
        }
        return null
      })
      .filter((item: any) => item) as string[]
  }

  /**
   * 获取当前图床
   */
  public getCurrentUploader() {
    return this.getPicgoConfig("picBed.uploader") || this.getPicgoConfig("picBed.current") || "smms"
  }

  public getUploaderConfigList(type: string): IUploaderConfigItem {
    if (!type) {
      return {
        configList: [] as IUploaderConfigListItem[],
        defaultId: ""
      }
    }
    const currentUploaderConfig = this.getPicgoConfig(`uploader.${type}`, {})
    let configList = currentUploaderConfig.configList
    let defaultId = currentUploaderConfig.defaultId || ""
    if (!configList) {
      const res = this.upgradeUploaderConfig(type)
      configList = res.configList
      defaultId = res.defaultId
    }

    const configItem = {
      configList,
      defaultId
    }
    // console.warn("获取当前图床配置列表：", configItem)
    return configItem
  }

  /**
   * 选择当前图床
   *
   * @param type 当前图床类型
   * @param id 当前图床配置ID
   * @author terwer
   * @since 0.7.0
   */
  public selectUploaderConfig = (type: string, id: string) => {
    const { configList } = this.getUploaderConfigList(type)
    const config = configList.find((item: any) => item._id === id)
    if (config) {
      this.savePicgoConfig({
        [`uploader.${type}.defaultId`]: id,
        [`picBed.${type}`]: config
      })
    }

    return config
  }

  /**
   * 设置默认图床
   *
   * @param type
   */
  public setDefaultPicBed(type: string) {
    this.savePicgoConfig({
      "picBed.current": type,
      "picBed.uploader": type
    })
  }

  /**
   * get picbed config by type，获取的是表单属性详细信息
   *
   * it will trigger the uploader config function & get the uploader config result
   * & not just read from
   *
   * @author terwer
   * @since 0.7.0
   */
  public getPicBedConfig(type: string) {
    const name = this.ctx.helper.uploader.get(type)?.name || type
    if (this.ctx.helper.uploader.get(type)?.config) {
      const _config = this.ctx.helper.uploader.get(type).config(this.ctx)
      const config = this.handleConfigWithFunction(_config)
      return {
        config,
        name
      }
    } else {
      return {
        config: [],
        name
      }
    }
  }

  /**
   * 更新图床配置
   *
   * @param type 图床类型
   * @param id 图床配置ID
   * @param config 图床配置
   *
   * @author terwer
   * @since 0.7.0
   */
  public updateUploaderConfig(type: string, id: string, config: IUploaderConfigListItem) {
    // ensure raw for save
    config = getRawData(config)
    const uploaderConfig = this.getUploaderConfigList(type)
    let configList = uploaderConfig.configList
    // ensure raw for save
    configList = getRawData(configList)
    const defaultId = uploaderConfig.ddefaultId
    const existConfig = configList.find((item: IUploaderConfigListItem) => item._id === id)
    let updatedConfig
    let updatedDefaultId = defaultId
    if (existConfig) {
      updatedConfig = Object.assign(existConfig, trimValues(config), {
        _updatedAt: Date.now()
      })
    } else {
      updatedConfig = this.completeUploaderMetaConfig(config)
      updatedDefaultId = updatedConfig._id
      configList.push(updatedConfig)
    }
    this.savePicgoConfig({
      [`uploader.${type}.configList`]: configList,
      [`uploader.${type}.defaultId`]: updatedDefaultId,
      [`picBed.${type}`]: updatedConfig
    })
  }

  // ===================================================================================================================

  /**
   * upgrade old uploader config to new format
   *
   * @param type type
   * @author terwer
   * @since 0.7.0
   */
  private upgradeUploaderConfig = (type: string) => {
    const uploaderConfig = this.getPicgoConfig(`picBed.${type}`, {})
    if (!uploaderConfig._id) {
      Object.assign(uploaderConfig, this.completeUploaderMetaConfig(uploaderConfig))
    }

    const uploaderConfigList = [uploaderConfig]
    this.savePicgoConfig({
      [`uploader.${type}`]: {
        configList: uploaderConfigList,
        defaultId: uploaderConfig._id
      },
      [`picBed.${type}`]: uploaderConfig
    })
    return {
      configList: uploaderConfigList as IUploaderConfigListItem[],
      defaultId: uploaderConfig._id as string
    }
  }

  /**
   * 增加配置元数据
   *
   * @param originData 原始数据
   */
  private completeUploaderMetaConfig(originData: any) {
    return Object.assign(
      {
        _configName: "Default"
      },
      trimValues(originData),
      {
        _id: IdUtil.newUuid(),
        _createdAt: Date.now(),
        _updatedAt: Date.now()
      }
    )
  }

  /**
   * 配置处理
   *
   * @param config 配置
   */
  private handleConfigWithFunction(config: any) {
    for (const i in config) {
      if (typeof config[i].default === "function") {
        config[i].default = config[i].default()
      }
      if (typeof config[i].choices === "function") {
        config[i].choices = config[i].choices()
      }
    }
    return config
  }
}

export { PicgoHelper }
