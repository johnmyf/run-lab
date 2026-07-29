/**
 * 完赛时间计算 — 核心算法
 * @module logic/finish-time/calculator
 */
import { DISTANCE_CONFIGS } from '@/logic/pace-calculator/constants'
import {
  calculateSegmentPaces,
  buildRows,
  formatPace,
  formatTime,
} from '@/logic/pace-calculator/calculator'

/**
 * 计算完赛时间表格
 * @param {Object} params
 * @param {string} params.distanceKey
 * @param {number} params.paceMin - 配速分钟 0-15
 * @param {number} params.paceSec - 配速秒 0-59
 * @param {number} params.strategy - -10~+10
 * @param {number} params.interval - 1|5
 * @param {number|null} params.customKm
 * @returns {Object|null}
 */
export function calculateFinishTimeTable(params) {
  const { distanceKey, paceMin, paceSec, strategy, interval, customKm } = params

  // 确定总距离
  let totalKm
  if (distanceKey === 'custom') {
    if (!customKm || customKm < 3 || customKm > 300) return null
    totalKm = customKm
  } else {
    const config = DISTANCE_CONFIGS.find(d => d.key === distanceKey)
    if (!config) return null
    totalKm = config.km
  }

  // 平均配速 → 总秒数
  if (paceMin < 0 || paceMin > 15 || paceSec < 0 || paceSec > 59) return null
  const paceSeconds = paceMin * 60 + paceSec
  if (paceSeconds <= 0) return null
  const totalSeconds = Math.round(paceSeconds * totalKm)

  // 复用共享算法
  const segmentPaces = calculateSegmentPaces(totalSeconds, totalKm, strategy)
  const rows = buildRows(totalKm, totalSeconds, segmentPaces, interval)

  return {
    totalTimeDisplay: formatTime(totalSeconds),
    avgPaceDisplay: formatPace(paceSeconds),
    avgPaceSeconds: Math.round(paceSeconds),
    totalKm,
    totalSeconds,
    rows,
  }
}
