/**
 * 成绩预测模块 — 配速格式化函数
 * @module logic/performance-prediction/formatters
 */
import { paceToSeconds, secondsToPaceStr } from '@/utils/time'

/**
 * 将 "M:SS" 格式配速转换为 "M'SS"" 格式
 * @param {string|number} paceStr - 如 "5:28" 或 0
 * @returns {string} 如 "5'28""
 */
export function formatPaceStr(paceStr) {
  if (!paceStr || paceStr === 0) return ''
  return secondsToPaceStr(paceToSeconds(paceStr))
}

/**
 * 格式化范围值 {from, to} 为 "M'SS" ~ M'SS""
 * @param {{ from: string, to: string }|number} value
 * @returns {string}
 */
export function formatRange(value) {
  if (!value || value === 0) return ''
  return `${formatPaceStr(value.from)} ~ ${formatPaceStr(value.to)}`
}

/** 各间歇跑类型的格式化函数映射 */
export const INTERVAL_FORMATTERS = {
  /**
   * 800m 用时 = 1km 配速 × 0.8，后跟配速
   * @param {string} value - 1km 配速 "M:SS"
   */
  i800(value) {
    const eightHundredSecs = paceToSeconds(value) * 0.8
    return `${secondsToPaceStr(eightHundredSecs)} (配速:${formatPaceStr(value)}/km)`
  },
  /**
   * 1200m 用时直接显示，后跟配速(×0.834)
   * @param {string} value - 1km 配速 "M:SS"
   */
  i1200(value) {
    const perKmSecs = paceToSeconds(value) * 0.834
    return `${formatPaceStr(value)} (配速:${secondsToPaceStr(perKmSecs)}/km)`
  },
  /**
   * 1.6km 用时直接显示，后跟配速(×0.625)
   * @param {string} value - 1km 配速 "M:SS"
   */
  i1600(value) {
    const perKmSecs = paceToSeconds(value) * 0.625
    return `${formatPaceStr(value)} (配速:${secondsToPaceStr(perKmSecs)}/km)`
  }
}

/**
 * 格式化重复跑配速（转换为1000米配速）
 * @param {string} value - 原始配速 "M:SS"
 * @param {number} distance - 实际距离（米）
 * @returns {string}
 */
export function formatRepeatPace(value, distance) {
  const secs = paceToSeconds(value)
  const perKmSecs = secs * (1000 / distance)
  return `${secondsToPaceStr(secs)} (配速:${secondsToPaceStr(perKmSecs)}/km)`
}
