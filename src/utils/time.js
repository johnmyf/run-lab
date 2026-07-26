/**
 * 跑步时间/配速格式化工具函数
 * @module utils/time
 */

/**
 * 将 "M:SS" 格式配速转换为总秒数
 * @param {string|number} pace - 如 "6:24" 或 0
 * @returns {number} 总秒数
 */
export function paceToSeconds(pace) {
  if (!pace || pace === 0) return 0
  const parts = String(pace).split(':')
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

/**
 * 将总秒数转换为 "M:SS" 格式（M 无前导零）
 * @param {number} totalSecs - 总秒数
 * @returns {string} 如 "6:24"
 */
export function secondsToPace(totalSecs) {
  const m = Math.floor(totalSecs / 60)
  const s = Math.round(totalSecs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * 将 "H:MM:SS" 格式转为中文显示
 * @param {string} timeStr - 如 "0:30:40" 或 "1:31:35"
 * @returns {string} 如 "30分40秒" 或 "1小时31分35秒"
 */
export function formatPerformanceTime(timeStr) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length !== 3) return timeStr

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)
  const seconds = parseInt(parts[2], 10)

  let result = ''
  if (hours > 0) {
    result += `${hours}小时`
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}分`
  }
  result += `${seconds}秒`
  return result
}
