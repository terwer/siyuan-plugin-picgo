/**
 * 发送事件的统一入口
 *
 * @param channel 频道
 * @param args 参数
 */
export declare function sendToMain(channel: string, args?: object): void;
/**
 * 处理事件统一入口封装
 *
 * @param eventId 事件ID
 * @param eventCallback 事件回调
 */
export declare const handleFromMain: (eventId: any, eventCallback: any) => void;
/**
 * 移除事件监听
 *
 * @param channel 频道
 */
export declare const removeEventListeners: (channel: any) => void;
//# sourceMappingURL=enentHandler.d.ts.map