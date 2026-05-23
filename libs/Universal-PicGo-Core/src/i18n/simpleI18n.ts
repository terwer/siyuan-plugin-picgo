import { ILocale } from "../types"

export class ObjectAdapter {
  private locales: Record<string, ILocale>

  constructor(locales: Record<string, ILocale>) {
    this.locales = locales
  }

  getLocale(language: string): ILocale {
    return this.locales[language]
  }

  setLocale(language: string, locales: ILocale): void {
    this.locales[language] = locales
  }
}

export class I18n {
  private readonly adapter: ObjectAdapter
  private defaultLanguage: string
  private currentLanguage: string

  constructor(options: { adapter: ObjectAdapter; defaultLanguage: string }) {
    this.adapter = options.adapter
    this.defaultLanguage = options.defaultLanguage.trim()
    this.currentLanguage = this.defaultLanguage
  }

  setLanguage(language: string): void {
    this.currentLanguage = language.trim()
  }

  translate<T extends string>(phrase: T, args?: Record<string, string>): string | undefined {
    const locale = this.adapter.getLocale(this.currentLanguage) ?? this.adapter.getLocale(this.defaultLanguage)
    if (!locale) {
      return undefined
    }

    const template = phrase.split(".").reduce<any>((object, key) => {
      if (!object || !Object.prototype.hasOwnProperty.call(object, key)) {
        return undefined
      }
      return object[key]
    }, locale)

    if (!template || typeof template !== "string") {
      return template
    }

    if (!args) {
      return template
    }

    return Object.keys(args).reduce((res, key) => res.replace("${" + key + "}", args[key]), template)
  }
}

