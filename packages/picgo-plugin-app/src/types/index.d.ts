/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

interface IStringKeyMap {
  [propName: string]: any
}

/**
 * 图床类型定义
 */
interface IPicBedType {
  type: string
  name: string
  visible: boolean
}

/**
 * 某个PicGO平台配置列表
 */
interface IUploaderConfigItem {
  configList: IUploaderConfigListItem[]
  defaultId: string
}

type IUploaderConfigListItem = IStringKeyMap & IUploaderListItemMetaInfo

interface IUploaderListItemMetaInfo {
  _id: string
  _configName: string
  _updatedAt: number
  _createdAt: number
}

type ICheckBoxValueType = boolean | string | number

interface INPMSearchResultObject {
  package: {
    name: string
    scope: string
    version: string
    description: string
    keywords: string[]
    author: {
      name: string
    }
    links: {
      npm: string
      homepage: string
    }
  }
}

/**
 * The browser app has no Node type definitions loaded, but vite.config.ts replaces
 * `process.env.*` at build time through `define`, so the object has to be declared here.
 */
declare const process: {
  env: Record<string, string | undefined>
}
