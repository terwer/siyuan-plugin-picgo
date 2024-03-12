/// <reference types="node" />
/// <reference types="node" />
import { IImgSize, IPathTransformedImgInfo, IPluginNameType, ILogger, IPicGo } from "../types";
export declare const isUrl: (url: string) => boolean;
export declare const isUrlEncode: (url: string) => boolean;
export declare const handleUrlEncode: (url: string) => string;
export declare const getImageSize: (file: Buffer) => IImgSize;
export declare const getFSFile: (filePath: string) => Promise<IPathTransformedImgInfo>;
export declare const getURLFile: (url: string, ctx: IPicGo) => Promise<IPathTransformedImgInfo>;
/**
 * detect the input string's type
 * for example
 * 1. @xxx/picgo-plugin-xxx -> scope
 * 2. picgo-plugin-xxx -> normal
 * 3. xxx -> simple
 * 4. not exists or is a path -> unknown
 * @param name
 */
export declare const getPluginNameType: (name: string) => IPluginNameType;
/**
 * detect the input string is a simple plugin name or not
 * for example
 * 1. xxx -> true
 * 2. /Usr/xx/xxxx/picgo-plugin-xxx -> false
 * @param name pluginNameOrPath
 */
export declare const isSimpleName: (nameOrPath: string) => boolean;
/**
 * streamline the full plugin name to a simple one
 * for example:
 * 1. picgo-plugin-xxx -> xxx
 * 2. @xxx/picgo-plugin-yyy -> yyy
 * @param name pluginFullName
 */
export declare const handleStreamlinePluginName: (name: string) => string;
/**
 * complete plugin name to full name
 * for example:
 * 1. xxx -> picgo-plugin-xxx
 * 2. picgo-plugin-xxx -> picgo-plugin-xxx
 * @param name pluginSimpleName
 * @param scope pluginScope
 */
export declare const handleCompletePluginName: (name: string, scope?: string) => string;
/**
 * handle install/uninstall/update plugin name or path
 * for example
 * 1. picgo-plugin-xxx -> picgo-plugin-xxx
 * 2. @xxx/picgo-plugin-xxx -> @xxx/picgo-plugin-xxx
 * 3. xxx -> picgo-plugin-xxx
 * 4. ./xxxx/picgo-plugin-xxx -> /absolutePath/.../xxxx/picgo-plugin-xxx
 * 5. /absolutePath/.../picgo-plugin-xxx -> /absolutePath/.../picgo-plugin-xxx
 * @param nameOrPath pluginName or pluginPath
 */
export declare const getProcessPluginName: (nameOrPath: string, logger?: ILogger | Console) => string;
/**
 * get the normal plugin name
 * for example:
 * 1. picgo-plugin-xxx -> picgo-plugin-xxx
 * 2. @xxx/picgo-plugin-xxx -> @xxx/picgo-plugin-xxx
 * 3. ./xxxx/picgo-plugin-xxx -> picgo-plugin-xxx
 * 4. /absolutePath/.../picgo-plugin-xxx -> picgo-plugin-xxx
 * 5. an exception: [package.json's name] !== [folder name]
 * then use [package.json's name], usually match the scope package.
 * 6. if plugin name has version: picgo-plugin-xxx@x.x.x then remove the version
 * @param nameOrPath
 */
export declare const getNormalPluginName: (nameOrPath: string, logger?: ILogger | Console) => string;
/**
 * handle transform the path to unix style
 * for example
 * 1. C:\\xxx\\xxx -> C:/xxx/xxx
 * 2. /xxx/xxx -> /xxx/xxx
 * @param path
 */
export declare const handleUnixStylePath: (pathStr: string) => string;
/**
 * remove plugin version when register plugin name
 * 1. picgo-plugin-xxx@1.0.0 -> picgo-plugin-xxx
 * 2. @xxx/picgo-plugin-xxx@1.0.0 -> @xxx/picgo-plugin-xxx
 * @param nameOrPath
 * @param scope
 */
export declare const removePluginVersion: (nameOrPath: string, scope?: boolean) => string;
/**
 * the config black item list which won't be setted
 * only can be got
 */
export declare const configBlackList: never[];
/**
 * check some config key is in blackList
 * @param key
 */
export declare const isConfigKeyInBlackList: (key: string) => boolean;
/**
 * check the input config is valid
 * config must be object such as { xxx: 'xxx' }
 * && can't be array
 * @param config
 * @returns
 */
export declare const isInputConfigValid: (config: any) => boolean;
export declare function safeParse<T>(str: string): T | string;
export declare const forceNumber: (num?: string | number) => number;
export declare const isDev: () => boolean;
export declare const isProd: () => boolean;
