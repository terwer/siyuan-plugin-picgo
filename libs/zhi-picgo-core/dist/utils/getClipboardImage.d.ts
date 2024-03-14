import { IPicGo, IClipboardImage } from "../types";
export type Platform = "darwin" | "win32" | "win10" | "linux" | "wsl";
declare const getClipboardImage: (ctx: IPicGo) => Promise<IClipboardImage>;
export default getClipboardImage;
