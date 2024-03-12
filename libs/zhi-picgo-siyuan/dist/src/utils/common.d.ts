import { PicGo } from "zhi-picgo-core";
/**
 * 思源笔记新窗口
 */
export declare const isSiyuanNewWin: () => boolean;
/**
 * 获取可操作的Window
 */
export declare const getSiyuanWindow: () => Window & typeof globalThis;
/**
 * get raw data from reactive or ref
 */
export declare const getRawData: (args: any) => any;
/**
 * 获取Picgo对象
 */
export declare const getPicgoFromWindow: () => PicGo;
/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export declare const handleStreamlinePluginName: (name: string) => string;
/**
 * for just simple clone an object
 */
export declare const simpleClone: (obj: any) => any;
//# sourceMappingURL=common.d.ts.map