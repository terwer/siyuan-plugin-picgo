import { IPicGo, IOptions } from "../types";
/**
 * Generate template files to destination files.
 * @param {PicGo} ctx
 * @param {IOptions} options
 */
declare const generate: (ctx: IPicGo, options: IOptions) => Promise<any>;
/**
 * Return the filters' result
 * @param ctx PicGo
 * @param exp condition expression
 * @param data options data
 */
declare const filters: (ctx: IPicGo, exp: any, data: any) => boolean;
/**
 * Render files to a virtual tree object
 * @param {array} files
 * @param source
 * @param options
 */
declare const render: (files: string[], source: string, options: any) => any;
/**
 * Write rendered files' content to real file
 * @param {string} dir
 * @param {object} files
 */
declare const writeFileTree: (dir: string, files: any) => void;
export { filters, generate, render, writeFileTree };
