export declare enum ILogType {
    success = "success",
    info = "info",
    warn = "warn",
    error = "error"
}
/**
 * these events will be catched by users
 */
export declare enum IBuildInEvent {
    UPLOAD_PROGRESS = "uploadProgress",
    FAILED = "failed",
    BEFORE_TRANSFORM = "beforeTransform",
    BEFORE_UPLOAD = "beforeUpload",
    AFTER_UPLOAD = "afterUpload",
    FINISHED = "finished",
    INSTALL = "install",
    UNINSTALL = "uninstall",
    UPDATE = "update",
    NOTIFICATION = "notification"
}
/**
 * these events will be catched only by picgo
 */
export declare enum IBusEvent {
    CONFIG_CHANGE = "CONFIG_CHANGE"
}
