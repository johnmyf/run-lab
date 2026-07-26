/**
 * 成绩预测模块 — 配速格式化函数
 * @module logic/performance-prediction/formatters
 */
import { paceToSeconds, secondsToPace } from '@/utils/time'

/**
 * 格式化范围值 {from, to} 为 "M:SS ~ M:SS"
 * @param {{ from: string, to: string }|number} value
 * @returns {string}
 */
export function formatRange(value) {
  if (!value || value === 0) return ''
  return `${value.from} ~ ${value.to}`
}

/** 各间歇跑类型的格式化函数映射 */
export const INTERVAL_FORMATTERS = {
  /**
   * 800m 用时 = 1km 配速 × 0.8，后跟配速
   * @param {string} value - 1km 配速 "M:SS"
   */
  i800(value) {
    const eightHundredSecs = paceToSeconds(value) * 0.8
    return `${secondsToPace(eightHundredSecs)} (配速:${value}/km)`
  },
  /**
   * 1200m 用时直接显示，后跟配速(×0.834)
   * @param {string} value - 1km 配速 "M:SS"
   */
  i1200(value) {
    const perKmSecs = paceToSeconds(value) * 0.834
    return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
  },
  /**
   * 1.6km 用时直接显示，后跟配速(×0.625)
   * @param {string} value - 1km 配速 "M:SS"
   */
  i1600(value) {
    const perKmSecs = paceToSeconds(value) * 0.625
    return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
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
  return `${value} (配速:${secondsToPace(perKmSecs)}/km)`
}
