import { Command } from "commander";
import { Inquirer } from "inquirer";
import { IPlugin, ICommander, IPicGo } from "../types";
export declare class Commander implements ICommander {
    private readonly name;
    static currentPlugin: string | null;
    private readonly list;
    private readonly pluginIdMap;
    private readonly ctx;
    program: Command;
    inquirer: Inquirer;
    constructor(ctx: IPicGo);
    getName(): string;
    init(): void;
    register(id: string, plugin: IPlugin): void;
    unregister(pluginName: string): void;
    loadCommands(): void;
    get(id: string): IPlugin | undefined;
    getList(): IPlugin[];
    getIdList(): string[];
}
export default Commander;
