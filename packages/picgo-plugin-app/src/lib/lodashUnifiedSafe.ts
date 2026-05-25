/*
 * Product-bundle safe subset for Element Plus' lodash-unified imports.
 *
 * Element Plus only needs a small set of data helpers at runtime. Pulling the
 * generic lodash-es entry into this browser-facing plugin bundle also pulls its
 * legacy global-object fallback (`Function("return this")`). Keep the adapter
 * local to the app bundle so reusable libraries do not depend on this shim.
 */

type AnyFn = (...args: any[]) => any

const isObject = (value: any): value is Record<string, any> => value !== null && typeof value === "object"

const isPlainMergeable = (value: any): value is Record<string, any> => {
  if (!isObject(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const toPath = (path: string | Array<string | number>) => {
  if (Array.isArray(path)) return path.map(String)
  return String(path)
    .replace(/\[(\w+)\]/g, ".$1")
    .replace(/^\./, "")
    .split(".")
    .filter(Boolean)
}

export function castArray<T>(value?: T | T[]): T[] {
  if (arguments.length === 0) return []
  return Array.isArray(value) ? value : [value as T]
}

export function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.slice() as T
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (value instanceof RegExp) return new RegExp(value) as T
  if (isObject(value)) return { ...value }
  return value
}

export function cloneDeep<T>(value: T, seen = new WeakMap<object, any>()): T {
  if (!isObject(value)) return value
  if (seen.has(value)) return seen.get(value)
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (value instanceof RegExp) return new RegExp(value) as T
  if (value instanceof Map) {
    const result = new Map()
    seen.set(value, result)
    value.forEach((v, k) => result.set(cloneDeep(k, seen), cloneDeep(v, seen)))
    return result as T
  }
  if (value instanceof Set) {
    const result = new Set()
    seen.set(value, result)
    value.forEach((v) => result.add(cloneDeep(v, seen)))
    return result as T
  }
  const result: any = Array.isArray(value) ? [] : {}
  seen.set(value, result)
  for (const key of Reflect.ownKeys(value)) {
    result[key as any] = cloneDeep((value as any)[key as any], seen)
  }
  return result
}

export function debounce<T extends AnyFn>(func: T, wait = 0, options: any = {}) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let result: ReturnType<T>
  const leading = Boolean(options.leading)
  const trailing = options.trailing !== false

  const invoke = () => {
    if (!lastArgs) return result
    const args = lastArgs
    const self = lastThis
    lastArgs = undefined
    lastThis = undefined
    result = func.apply(self, args)
    return result
  }

  const debounced = function (this: any, ...args: Parameters<T>) {
    const shouldCallLeading = leading && !timer
    lastArgs = args
    lastThis = this
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      if (trailing && !shouldCallLeading) invoke()
    }, wait)
    if (shouldCallLeading) return invoke()
    return result
  } as T & { cancel: () => void; flush: () => ReturnType<T> }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    lastArgs = undefined
    lastThis = undefined
  }
  debounced.flush = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    return invoke() as ReturnType<T>
  }

  return debounced
}

export function throttle<T extends AnyFn>(func: T, wait = 0, options: any = {}) {
  let lastCall = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let result: ReturnType<T>
  const leading = options.leading !== false
  const trailing = options.trailing !== false

  const invoke = (time: number) => {
    lastCall = time
    const args = lastArgs
    const self = lastThis
    lastArgs = undefined
    lastThis = undefined
    if (args) result = func.apply(self, args)
    return result
  }

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (!lastCall && !leading) lastCall = now
    const remaining = wait - (now - lastCall)
    lastArgs = args
    lastThis = this
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      return invoke(now)
    }
    if (!timer && trailing) {
      timer = setTimeout(() => {
        timer = undefined
        invoke(Date.now())
      }, remaining)
    }
    return result
  } as T & { cancel: () => void; flush: () => ReturnType<T> }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    lastCall = 0
    timer = undefined
    lastArgs = undefined
    lastThis = undefined
  }
  throttled.flush = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
    return invoke(Date.now()) as ReturnType<T>
  }

  return throttled
}

export function isEqual(a: any, b: any, seen = new WeakMap<object, any>()): boolean {
  if (Object.is(a, b)) return true
  if (!isObject(a) || !isObject(b)) return false
  if (a.constructor !== b.constructor) return false
  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime()
  if (a instanceof RegExp) return b instanceof RegExp && String(a) === String(b)
  if (seen.get(a) === b) return true
  seen.set(a, b)
  if (Array.isArray(a)) {
    return Array.isArray(b) && a.length === b.length && a.every((item, index) => isEqual(item, b[index], seen))
  }
  const keysA = Reflect.ownKeys(a)
  const keysB = Reflect.ownKeys(b)
  const recordA = a as Record<PropertyKey, any>
  const recordB = b as Record<PropertyKey, any>
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => keysB.includes(key) && isEqual(recordA[key], recordB[key], seen))
  )
}

export const flatten = <T>(array: T[][]) => array.flat()
export const flattenDeep = (array: any[]): any[] =>
  array.reduce<any[]>((acc, item) => acc.concat(Array.isArray(item) ? flattenDeep(item) : item), [])
export const flatMap = <T, R>(array: T[], iteratee: (item: T, index: number, array: T[]) => R | R[]) =>
  array.flatMap(iteratee)

export const fromPairs = (pairs: Array<[string, any]>) => Object.fromEntries(pairs)

export function get(object: any, path: string | Array<string | number>, defaultValue?: any) {
  let current = object
  for (const key of toPath(path)) {
    if (current == null) return defaultValue
    current = current[key]
  }
  return current === undefined ? defaultValue : current
}

export function set(object: any, path: string | Array<string | number>, value: any) {
  const keys = toPath(path)
  let current = object
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value
      return
    }
    if (!isObject(current[key])) current[key] = /^\d+$/.test(keys[index + 1]) ? [] : {}
    current = current[key]
  })
  return object
}

export function findLastIndex<T>(array: T[], predicate: (item: T, index: number, array: T[]) => boolean) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return i
  }
  return -1
}

export const isNil = (value: any) => value == null
export const isUndefined = (value: any) => value === undefined

export function memoize<T extends AnyFn>(func: T, resolver?: (...args: Parameters<T>) => any) {
  const memoized = function (this: any, ...args: Parameters<T>) {
    const key = resolver ? resolver(...args) : args[0]
    if (memoized.cache.has(key)) return memoized.cache.get(key)
    const result = func.apply(this, args)
    memoized.cache.set(key, result)
    return result
  } as T & { cache: Map<any, ReturnType<T>> }
  memoized.cache = new Map()
  return memoized
}

export function merge(target: any, ...sources: any[]) {
  for (const source of sources) {
    if (!isObject(source)) continue
    for (const key of Reflect.ownKeys(source)) {
      const sourceValue = source[key as any]
      if (isPlainMergeable(sourceValue)) {
        if (!isPlainMergeable(target[key as any])) target[key as any] = {}
        merge(target[key as any], sourceValue)
      } else if (Array.isArray(sourceValue)) {
        target[key as any] = sourceValue.slice()
      } else {
        target[key as any] = sourceValue
      }
    }
  }
  return target
}

export function omit<T extends Record<string, any>>(object: T, keys: string[]) {
  const result: Record<string, any> = {}
  for (const key of Object.keys(object || {})) {
    if (!keys.includes(key)) result[key] = object[key]
  }
  return result
}

export function pick<T extends Record<string, any>>(object: T, keys: string[]) {
  const result: Record<string, any> = {}
  for (const key of keys) {
    if (object != null && Object.prototype.hasOwnProperty.call(object, key)) result[key] = object[key]
  }
  return result
}

export function union<T>(...arrays: T[][]) {
  return Array.from(new Set(arrays.flat()))
}
