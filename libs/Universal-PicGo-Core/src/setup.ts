// jsdom 29 removed the global `window`, but many tests reference `window.localStorage`.
// Restore compatibility without changing test code.
if (typeof globalThis.window === "undefined") {
  ;(globalThis as any).window = globalThis
}
