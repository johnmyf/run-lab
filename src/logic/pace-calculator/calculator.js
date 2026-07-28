/**
 * 配速计算器 — 核心算法
 * @module logic/pace-calculator/calculator
 */
import { DISTANCE_CONFIGS, STRATEGY_CONFIG } from './constants'

/**
 * 计算配速表格
 * @param {Object} params
 * @param {string} params.distanceKey - 距离键值
 * @param {number} params.hours - 时 0-6
 * @param {number} params.minutes - 分 0-59
 * @param {number} params.seconds - 秒 0-59
 * @param {number} params.strategy - 配速策略 -10~+10
 * @param {number} params.interval - 显示间隔 1|5
 * @returns {Object} { avgPaceDisplay, avgPaceSeconds, totalKm, totalSeconds, rows }
 */
export function calculatePaceTable(params) {
  const { distanceKey, hours, minutes, seconds, strategy, interval } = params
  const config = DISTANCE_CONFIGS.find(d => d.key === distanceKey)
  if (!config) return null

  const totalKm = config.km
  const totalSeconds = hours * 3600 + minutes * 60 + seconds
  if (totalSeconds <= 0) return null
  if (strategy < STRATEGY_CONFIG.MIN || strategy > STRATEGY_CONFIG.MAX) return null
  if (interval !== 1 && interval !== 5) return null

  const avgPaceSeconds = totalSeconds / totalKm
  const avgPaceDisplay = formatPace(avgPaceSeconds)

  // 计算 5 段配速
  const segmentPaces = calculateSegmentPaces(totalSeconds, totalKm, strategy)

  // 生成表格行
  const rows = buildRows(totalKm, totalSeconds, segmentPaces, interval)

  return { avgPaceDisplay, avgPaceSeconds: Math.round(avgPaceSeconds), totalKm, totalSeconds, rows }
}

/** 计算 5 段配速值（秒/公里） */
function calculateSegmentPaces(totalSeconds, totalKm, strategy) {
  const { SEGMENTS } = STRATEGY_CONFIG
  const r = strategy / 100 / SEGMENTS

  if (Math.abs(r) < 0.0001) {
    // 匀速
    const pace = totalSeconds / totalKm
    return Array(SEGMENTS).fill(pace)
  }

  // 等比数列和：Σ(1+r)^(k-1) for k=1..5
  const sum = (Math.pow(1 + r, SEGMENTS) - 1) / r
  const P = totalSeconds * SEGMENTS / (totalKm * sum)

  return Array.from({ length: SEGMENTS }, (_, i) => P * Math.pow(1 + r, i))
}

/** 精确累计时间（某公里点的精确秒数） */
function exactCumulativeTime(distance, totalKm, segmentPaces) {
  const { SEGMENTS } = STRATEGY_CONFIG
  const segLen = totalKm / SEGMENTS
  let time = 0
  let remaining = distance

  for (let i = 0; i < SEGMENTS && remaining > 0.0001; i++) {
    const segDist = Math.min(remaining, segLen)
    time += segDist * segmentPaces[i]
    remaining -= segDist
  }

  return time
}

/** 生成表格行 */
function buildRows(totalKm, totalSeconds, segmentPaces, interval) {
  const numFullKm = Math.floor(totalKm)
  const hasPartialKm = totalKm - numFullKm > 0.001

  // Step 1: 计算所有公里边界的精确累计时间
  const boundaries = [{ km: 0, exactCum: 0 }]
  for (let i = 1; i <= numFullKm; i++) {
    boundaries.push({ km: i, exactCum: exactCumulativeTime(i, totalKm, segmentPaces) })
  }
  if (hasPartialKm) {
    boundaries.push({ km: totalKm, exactCum: totalSeconds })
  }

  // Step 2: 生成每公里行
  const allRows = []
  const { SEGMENTS } = STRATEGY_CONFIG

  for (let i = 1; i < boundaries.length; i++) {
    const prev = boundaries[i - 1]
    const curr = boundaries[i]
    const isLastRow = (i === boundaries.length - 1)

    const roundedCum = Math.round(curr.exactCum)
    const prevRoundedCum = Math.round(prev.exactCum)

    let paceSeconds
    if (isLastRow) {
      // 尾行：使用该段每公里配速（不是按剩余距离换算）
      const segIdx = Math.min(Math.floor(prev.km * SEGMENTS / totalKm), SEGMENTS - 1)
      paceSeconds = Math.round(segmentPaces[segIdx])
    } else {
      paceSeconds = roundedCum - prevRoundedCum
    }

    allRows.push({
      km: curr.km,
      cumulativeSeconds: roundedCum,
      paceSeconds,
    })
  }

  // Step 3: 按间隔过滤
  if (interval === 1) {
    return allRows
  }

  // interval === 5: 每 5km 显示一行，配速为该 5km 块的平均配速
  const result = []
  let lastCum = 0
  let lastKm = 0

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i]
    const kmInt = Math.round(row.km)
    const isTotal = (row.km === totalKm)

    if (isTotal || (kmInt % 5 === 0 && kmInt > 0)) {
      let paceSeconds

      if (isTotal && Math.abs(row.km - kmInt) > 0.001) {
        // 有小数尾行：显示最后一段的每公里配速（不是块平均）
        paceSeconds = Math.round(segmentPaces[SEGMENTS - 1])
      } else {
        // 整公里行：显示该 5km 块的平均配速
        const blockDist = row.km - lastKm
        const blockTime = row.cumulativeSeconds - lastCum
        paceSeconds = blockDist > 0 ? Math.round(blockTime / blockDist) : 0
      }

      result.push({
        km: row.km,
        cumulativeSeconds: row.cumulativeSeconds,
        paceSeconds,
      })

      lastCum = row.cumulativeSeconds
      lastKm = row.km
    }
  }

  return result
}

/**
 * 格式化秒数为配速显示 "M'SS""
 * @param {number} secs
 * @returns {string} 如 "5'41""
 */
export function formatPace(secs) {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}'${String(s).padStart(2, '0')}"`
}

/**
 * 格式化秒数为时间显示 "H:MM:SS" 或 "MM:SS"
 * @param {number} totalSecs - 整数
 * @returns {string}
 */
export function formatTime(totalSecs) {
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
