/// <reference types="node" />
import { EventEmitter } from "events";
import { IPicGo } from "../types";
export declare class Lifecycle extends EventEmitter {
    private readonly ctx;
    constructor(ctx: IPicGo);
    start(input: any[]): Promise<IPicGo>;
    private beforeTransform;
    private doTransform;
    private beforeUpload;
    private doUpload;
    private afterUpload;
    private handlePlugins;
}
export default Lifecycle;
