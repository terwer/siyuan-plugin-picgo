export function getByPath(obj: any, path?: string, defaultValue?: any): any {
  if (!path) {
    return obj ?? defaultValue
  }
  const parts = splitPath(path)
  let current = obj
  for (const part of parts) {
    if (current == null) {
      return defaultValue
    }
    current = current[part]
  }
  return current === undefined ? defaultValue : current
}

export function setByPath(obj: any, path: string, value: any): void {
  const parts = splitPath(path)
  if (parts.length === 0) {
    return
  }

  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}

export function unsetByPath(obj: any, path: string): boolean {
  const parts = splitPath(path)
  if (parts.length === 0 || obj == null) {
    return false
  }

  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    current = current?.[parts[i]]
    if (current == null) {
      return false
    }
  }

  const last = parts[parts.length - 1]
  if (!Object.prototype.hasOwnProperty.call(current, last)) {
    return false
  }
  delete current[last]
  return true
}

export function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  for (const [key, value] of Object.entries(source)) {
    const writableTarget = target as Record<string, any>
    const targetValue = writableTarget[key]
    if (isPlainObject(targetValue) && isPlainObject(value)) {
      deepMerge(targetValue, value)
    } else {
      writableTarget[key] = value
    }
  }
  return target
}

function splitPath(path: string): string[] {
  return path
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean)
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
