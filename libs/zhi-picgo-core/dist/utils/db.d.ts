import { IConfig, IPicGo } from "../types";
import { IJSON } from "@picgo/store/dist/types";
declare class DB {
    private readonly ctx;
    private readonly db;
    constructor(ctx: IPicGo);
    read(flush?: boolean): IJSON;
    get(key?: string): any;
    set(key: string, value: any): void;
    has(key: string): boolean;
    unset(key: string, value: any): boolean;
    saveConfig(config: Partial<IConfig>): void;
    removeConfig(config: IConfig): void;
}
export default DB;
