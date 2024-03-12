import { IPicGo, IPicGoPlugin, IPluginLoader, IPicGoPluginInterface } from "../types/index";
/**
 * Local plugin loader, file system is required
 */
export declare class PluginLoader implements IPluginLoader {
    private readonly ctx;
    private list;
    private readonly fullList;
    private readonly pluginMap;
    constructor(ctx: IPicGo);
    private init;
    private resolvePlugin;
    load(): boolean;
    registerPlugin(name: string, plugin?: IPicGoPlugin): void;
    unregisterPlugin(name: string): void;
    getPlugin(name: string): IPicGoPluginInterface | undefined;
    /**
     * Get the list of enabled plugins
     */
    getList(): string[];
    hasPlugin(name: string): boolean;
    /**
     * Get the full list of plugins, whether it is enabled or not
     */
    getFullList(): string[];
}
export default PluginLoader;
