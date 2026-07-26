/**
 * 跑力值计算模块 — VDOT 算法
 * @module logic/running-power/vdot
 */
import { parseTimeToSeconds } from '@/utils/time'

/** VDOT 取值范围 */
export const VDOT_RANGE = { MIN: 30, MAX: 85 }

/**
 * 计算单个科目的 VDOT 值
 * @param {string} subject - 科目名（如 "5公里"），需与 sheet5-1.json key 对应
 * @param {Array<{subject: string, performance: string}>} pbs - 用户输入的最快成绩列表
 * @param {Object} vdotMap - VDOT 映射表 (sheet5-1.json)
 * @returns {number|null} VDOT 值，无匹配时返回 null
 */
export function getVDOT(subject, pbs, vdotMap) {
  const pb = pbs.find(p => p.subject === subject)
  if (!pb) return null

  const totalSeconds = parseTimeToSeconds(pb.performance)
  const { MIN, MAX } = VDOT_RANGE

  for (let v = MIN; v <= MAX; v++) {
    const baseTime = vdotMap[String(v)]?.[subject]
    if (!baseTime) continue
    const baseSeconds = parseTimeToSeconds(baseTime)
    if (totalSeconds > baseSeconds) {
      return Math.max(v - 1, MIN)
    }
  }
  return MAX
}
