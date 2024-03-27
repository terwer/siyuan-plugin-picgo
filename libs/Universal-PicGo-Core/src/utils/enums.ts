/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * these events will be catched by users
 */
export enum IBuildInEvent {
  UPLOAD_PROGRESS = "uploadProgress",
  FAILED = "failed",
  BEFORE_TRANSFORM = "beforeTransform",
  BEFORE_UPLOAD = "beforeUpload",
  AFTER_UPLOAD = "afterUpload",
  FINISHED = "finished",
  INSTALL = "install",
  UNINSTALL = "uninstall",
  UPDATE = "update",
  NOTIFICATION = "notification",
}

/**
 * these events will be catched only by picgo
 */
export enum IBusEvent {
  CONFIG_CHANGE = "CONFIG_CHANGE",
}

/**
 * PicGo 类型枚举
 *
 * @version 1.6.0
 * @since 1.6.0
 * @author terwer
 */
export enum PicgoTypeEnum {
  Bundled = "bundled",
  App = "app",
  // Core = "core",
}
