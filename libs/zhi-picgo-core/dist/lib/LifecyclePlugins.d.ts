import { IPlugin, ILifecyclePlugins } from "../types";
export declare class LifecyclePlugins implements ILifecyclePlugins {
    static currentPlugin: string | null;
    private readonly list;
    private readonly pluginIdMap;
    private readonly name;
    constructor(name: string);
    register(id: string, plugin: IPlugin): void;
    unregister(pluginName: string): void;
    getName(): string;
    get(id: string): IPlugin | undefined;
    getList(): IPlugin[];
    getIdList(): string[];
}
export declare const setCurrentPluginName: (name?: string | null) => void;
export declare const getCurrentPluginName: () => string | null;
export default LifecyclePlugins;
