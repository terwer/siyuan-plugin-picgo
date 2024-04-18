/*
 *            GNU GENERAL PUBLIC LICENSE
 *               Version 3, 29 June 2007
 *
 *  Copyright (C) 2022-2024 Terwer, Inc. <https://terwer.space/>
 *  Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

/**
 * 模拟 Js 定时器
 *
 * // 示例用法
 * ```
 * let example = async () => {
 *     await JsTimer(() => task(), (count) => count >= 5, 1000);
 * };
 *
 * example();
 * ```
 *
 * @param task - 要执行的任务
 * @param args - 参数
 * @param condition - 停止条件，重试次数作为参数
 * @param interval - 轮询间隔
 */
async function JsTimer(
  task: (args: any) => Promise<void>,
  args: any,
  condition: (count: number) => boolean,
  interval: number
): Promise<boolean> {
  return new Promise((resolve: any) => {
    // 计数器初始为零
    let count = 0
    let isSuccess = false
    const timeId = window.setInterval(async () => {
      // 每次定时器触发增加计数
      count++
      // 任务执行成功或者达到了终止条件都要返回
      if (isSuccess || condition(count)) {
        window.clearInterval(timeId)
        resolve(isSuccess)
      } else {
        try {
          await task(args)
          isSuccess = true
          // 任务执行完成后继续轮询
        } catch (e) {
          isSuccess = false
          // 处理任务执行过程中的错误
          console.error("JsTimer task error:", e)
        }
      }
    }, interval)
  })
}

export { JsTimer }
