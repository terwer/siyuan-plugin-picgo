/// <reference types="node" />
import { EventEmitter } from "events";
import Commander from "../lib/Commander";
import { Logger } from "../lib/Logger";
import { IHelper, IImgInfo, IPicGo, IStringKeyMap, IPluginLoader, II18nManager, IPicGoPlugin, IPicGoPluginInterface, IRequest } from "../types";
import Request from "../lib/Request";
import PluginHandler from "../lib/PluginHandler";
export declare class PicGo extends EventEmitter implements IPicGo {
    private _config;
    private lifecycle;
    private db;
    private _pluginLoader;
    configPath: string;
    baseDir: string;
    helper: IHelper;
    log: Logger;
    cmd: Commander;
    output: IImgInfo[];
    input: any[];
    pluginHandler: PluginHandler;
    /**
     * @deprecated will be removed in v1.5.0+
     *
     * use request instead
     */
    Request: Request;
    i18n: II18nManager;
    VERSION: string;
    GUI_VERSION?: string;
    get pluginLoader(): IPluginLoader;
    constructor(configPath?: string);
    private initConfigPath;
    private initConfig;
    private init;
    /**
     * easily mannually load a plugin
     * if provide plugin name, will register plugin by name
     * or just instantiate a plugin
     */
    use(plugin: IPicGoPlugin, name?: string): IPicGoPluginInterface;
    registerCommands(): void;
    getConfig<T>(name?: string): T;
    saveConfig(config: IStringKeyMap<any>): void;
    removeConfig(key: string, propName: string): void;
    setConfig(config: IStringKeyMap<any>): void;
    unsetConfig(key: string, propName: string): void;
    get request(): IRequest["request"];
    upload(input?: any[]): Promise<IImgInfo[] | Error>;
}
