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
