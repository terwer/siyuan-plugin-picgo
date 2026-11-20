/**
 * 读取插件页面的路由参数。
 *
 * 插件页面使用 hash 路由，参数可能出现在：
 * - 普通查询串：`?pageId=...`
 * - hash 查询串：`#/?pageId=...` 或 `#/setting?pageId=...`
 *
 * 宿主的插件入口会在 hash 前追加缓存版本号，因此不能直接依赖
 * `window.location.search`，也不能假设 hash 里的查询串没有前导 `/`。
 */
export const getPageQueryParam = (key: string): string => {
  if (typeof window === "undefined") {
    return ""
  }

  const fromSearch = new URLSearchParams(window.location.search).get(key)
  if (fromSearch) {
    return fromSearch
  }

  const hash = window.location.hash.replace(/^#/, "")
  const queryIndex = hash.indexOf("?")
  const hashQuery = queryIndex >= 0 ? hash.slice(queryIndex + 1) : ""
  return new URLSearchParams(hashQuery).get(key) ?? ""
}
