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