/**
 * 步频步幅计算模块 — 核心算法
 * @module logic/cadence-stride/calculator
 */
import { secondsToPaceStr } from '@/utils/time'
import { CADENCE_UNIT, STRIDE_UNIT, PACE_UNIT } from './constants'

/**
 * 由步频、步幅计算配速（秒/公里）
 * @param {number} cadence - 步频（步/分钟，>0）
 * @param {number} stride - 步幅（米，>0）
 * @returns {number} 每公里秒数
 */
export function calcPaceSeconds(cadence, stride) {
  return 60000 / (cadence * stride)
}

/**
 * 由配速、步幅计算步频（步/分钟）
 * @param {number} paceSeconds - 配速（秒/公里，>0）
 * @param {number} stride - 步幅（米，>0）
 * @returns {number} 步频
 */
export function calcCadence(paceSeconds, stride) {
  return 60000 / (paceSeconds * stride)
}

/**
 * 由配速、步频计算步幅（米）
 * @param {number} paceSeconds - 配速（秒/公里，>0）
 * @param {number} cadence - 步频（步/分钟，>0）
 * @returns {number} 步幅
 */
export function calcStride(paceSeconds, cadence) {
  return 60000 / (paceSeconds * cadence)
}

/** 配速格式化：如 277.8 → "4'38\"/公里" */
export function formatPaceStr(paceSeconds) {
  return `${secondsToPaceStr(paceSeconds)}${PACE_UNIT}`
}

/** 步频格式化：四舍五入为整数 */
export function formatCadenceStr(cadence) {
  return String(Math.round(cadence))
}

/** 步幅格式化：最多 2 位小数，去尾零（1.20 → "1.2"） */
export function formatStrideStr(stride) {
  return String(parseFloat(stride.toFixed(2)))
}

/**
 * 实时计算入口：两个所需输入均有效（正数）时返回结果句子三段，否则 null
 * @param {Object} params
 * @param {'pace'|'cadence'|'stride'} params.mode - 计算项
 * @param {number} params.cadence - 步频（无效时传 NaN）
 * @param {number} params.stride - 步幅（无效时传 NaN）
 * @param {number} params.paceSeconds - 配速秒数（配速 picker 得出）
 * @returns {{ prefix: string, value: string, suffix: string }|null}
 */
export function computeResult({ mode, cadence, stride, paceSeconds }) {
  if (mode === 'pace') {
    if (!isValid(cadence) || !isValid(stride)) return null
    const paceSec = calcPaceSeconds(cadence, stride)
    return {
      prefix: `由平均步频: ${formatCadenceStr(cadence)} ${CADENCE_UNIT}, 平均步幅: ${formatStrideStr(stride)} ${STRIDE_UNIT}, 得出平均配速: `,
      value: formatPaceStr(paceSec),
      suffix: '',
    }
  }
  if (mode === 'cadence') {
    if (!isValid(paceSeconds) || !isValid(stride)) return null
    const cad = calcCadence(paceSeconds, stride)
    return {
      prefix: `由平均配速: ${formatPaceStr(paceSeconds)}, 平均步幅: ${formatStrideStr(stride)} ${STRIDE_UNIT}, 得出平均步频: `,
      value: formatCadenceStr(cad),
      suffix: ` ${CADENCE_UNIT}`,
    }
  }
  if (mode === 'stride') {
    if (!isValid(paceSeconds) || !isValid(cadence)) return null
    const st = calcStride(paceSeconds, cadence)
    return {
      prefix: `由平均配速: ${formatPaceStr(paceSeconds)}, 平均步频: ${formatCadenceStr(cadence)} ${CADENCE_UNIT}, 得出平均步幅: `,
      value: formatStrideStr(st),
      suffix: ` ${STRIDE_UNIT}`,
    }
  }
  // 未识别 mode 防御：不静默落入任何分支
  return null
}

/** 有效正数判定 */
function isValid(n) {
  return typeof n === 'number' && isFinite(n) && n > 0
}
