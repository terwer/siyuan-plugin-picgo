import mime from "mime"

export function lookupMimeType(fileName?: string): string | undefined {
  if (!fileName) {
    return undefined
  }
  return mime.getType(fileName) || undefined
}
