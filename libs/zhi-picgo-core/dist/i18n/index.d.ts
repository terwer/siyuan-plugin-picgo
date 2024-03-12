import { ILocalesKey } from "./zh-CN";
import { IPicGo } from "../types";
import { IStringKeyMap, II18nManager } from "../types/index";
import { ILocale } from "@picgo/i18n/dist/types";
declare class I18nManager implements II18nManager {
    private readonly i18n;
    private readonly objectAdapter;
    private readonly ctx;
    constructor(ctx: IPicGo);
    private loadOutterI18n;
    private getOutterI18nFolder;
    translate<T extends string>(key: ILocalesKey | T, args?: IStringKeyMap<string>): string;
    setLanguage(language: string): void;
    addLocale(language: string, locales: ILocale): boolean;
    addLanguage(language: string, locales: ILocale): boolean;
    getLanguageList(): string[];
}
export { I18nManager };
