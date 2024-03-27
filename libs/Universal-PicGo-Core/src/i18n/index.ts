/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { IBrowserLocal, II18nManager, ILocale, IPicGo, IStringKeyMap } from "../types"
import { I18n, ObjectAdapter } from "@picgo/i18n"
import { ILocales, ILocalesKey, ZH_CN } from "./zh-CN"
import { EN } from "./en"
import { ZH_TW } from "./zh-TW"
import yaml from "js-yaml"
import _ from "lodash-es"
import { hasNodeEnv, win } from "universal-picgo-store"
import { ensureFolderSync, pathExistsSync } from "../utils/nodeUtils"
import { browserPathJoin } from "../utils/browserUtils"
import BrowserI18nDb from "./browserI18nDb"

const languageList: IStringKeyMap<IStringKeyMap<string>> = {
  "zh-CN": ZH_CN,
  "zh-TW": ZH_TW,
  en: EN,
}

class I18nManager implements II18nManager {
  private readonly i18n: I18n
  private readonly objectAdapter: ObjectAdapter
  private readonly ctx: IPicGo
  private readonly browserI18nDb?: BrowserI18nDb

  constructor(ctx: IPicGo) {
    this.ctx = ctx
    if (!hasNodeEnv) {
      this.browserI18nDb = new BrowserI18nDb(this.ctx)
    }
    this.objectAdapter = new ObjectAdapter(languageList)
    let language = this.ctx.getConfig<string>("settings.language") || "zh-CN"
    if (!languageList[language]) {
      language = "zh-CN" // use default
    }
    this.i18n = new I18n({
      adapter: this.objectAdapter,
      defaultLanguage: language,
    })
    this.loadOutterI18n()
  }

  translate<T extends string>(key: ILocalesKey | T, args?: IStringKeyMap<string>): string {
    return this.i18n.translate(key, args) || key
  }

  setLanguage(language: string): void {
    this.i18n.setLanguage(language)
    this.ctx.saveConfig({
      "settings.language": language,
    })
  }

  addLocale(language: string, locales: ILocale): boolean {
    const originLocales = this.objectAdapter.getLocale(language)
    if (!originLocales) {
      return false
    }
    const newLocales = _.merge(originLocales, locales)
    this.objectAdapter.setLocale(language, newLocales)
    return true
  }

  addLanguage(language: string, locales: ILocale): boolean {
    const originLocales = this.objectAdapter.getLocale(language)
    if (originLocales) {
      return false
    }
    this.objectAdapter.setLocale(language, locales)
    languageList[language] = locales
    return true
  }

  getLanguageList(): string[] {
    return Object.keys(languageList)
  }

  // ===================================================================================================================
  private getOutterI18nFolder(): string {
    let i18nFolder: string
    if (hasNodeEnv) {
      const fs = win.fs
      const path = win.require("path")
      i18nFolder = path.join(this.ctx.baseDir, "i18n-cli")
      ensureFolderSync(fs, i18nFolder)
    } else {
      i18nFolder = browserPathJoin(this.ctx.baseDir, "i18n-cli", "i18n.json")
    }

    return i18nFolder
  }

  private loadOutterI18n(): void {
    if (hasNodeEnv) {
      const fs = win.fs
      const path = win.require("path")
      const i18nFolder = this.getOutterI18nFolder()
      const files = fs.readdirSync(i18nFolder, {
        withFileTypes: true,
      })
      files.forEach((file: any) => {
        if (file.isFile() && file.name.endsWith(".yml")) {
          const i18nFilePath = path.join(i18nFolder, file.name)
          const i18nFile = fs.readFileSync(i18nFilePath, "utf8")
          try {
            const i18nFileObj = yaml.load(i18nFile) as ILocales
            languageList[file.name.replace(/\.yml$/, "")] = i18nFileObj
          } catch (e) {
            console.error(e)
          }
        }
      })
    } else {
      // "i18n": [
      //    {
      //      name: "zh-CN",
      //      yaml: "---ILocales str---",
      //    }
      // ]
      const i18ns = this.browserI18nDb?.read() ?? []
      i18ns.forEach((i18n: IBrowserLocal) => {
        const i18nFileObj = yaml.load(i18n.yaml) as ILocales
        languageList[i18n.name] = i18nFileObj
      })
    }
  }
}

export { I18nManager }
