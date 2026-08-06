/**
 * 体重建议模块 — 计算算法
 * @module logic/bmi/calculator
 */

/**
 * 计算 BMI（保留 1 位小数）
 * @param {number} weightKg 体重（公斤）
 * @param {number} heightCm 身高（厘米）
 * @returns {number}
 */
export function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

/**
 * 成人身体状态判定：min 闭区间、max 开区间（[min, max)），按数组顺序返回首个命中
 * @param {number} bmi
 * @param {Array} adultData - bmi.json 的 adult 数组
 * @returns {Object|null} 命中档（含 name/color）
 */
export function findAdultStatus(bmi, adultData) {
  return adultData.find(c => bmi >= (c.min ?? -Infinity) && bmi < (c.max ?? Infinity)) || null
}

/**
 * 跑者层级判定：
 * - 正常层级（第 2 项起）按数组顺序遍历，min/max 闭区间命中即返回（重叠取更高级）
 * - 均未命中且 bmi < 首档.max（严格小于）时返回首档（需注意身体健康，兜底档）
 * @param {number} bmi
 * @param {string} gender - '男' | '女'
 * @param {Object} runnerData - bmi.json 的 runnerLevels
 * @returns {Object|null}
 */
export function findRunnerLevel(bmi, gender, runnerData) {
  const levels = runnerData[gender] || []
  if (!levels.length) return null
  for (let i = 1; i < levels.length; i++) {
    const lv = levels[i]
    if (bmi >= (lv.min ?? -Infinity) && bmi <= (lv.max ?? Infinity)) return lv
  }
  const first = levels[0]
  if (first.max !== null && bmi < first.max) return first
  return first
}

/**
 * 各颜色交界点的临界 BMI 与对应体重（交界 = 上一档 max）
 * @param {number} heightCm 身高（厘米）
 * @param {Array} categories 分类数组（显示顺序）
 * @returns {Array<{bmi: number, weightKg: number}>}
 */
export function getBoundaryWeights(heightCm, categories) {
  const h = heightCm / 100
  const result = []
  for (let i = 1; i < categories.length; i++) {
    const bmi = categories[i - 1].max
    if (bmi === null) continue
    result.push({ bmi, weightKg: Math.round(bmi * h * h) })
  }
  return result
}

/**
 * 当前 BMI 在坐标轴上的位置百分比（0~100，越界 clamp）
 * @param {number} bmi
 * @param {number} axisMin
 * @param {number} axisMax
 * @returns {number}
 */
export function getMarkerPosition(bmi, axisMin, axisMax) {
  const pct = ((bmi - axisMin) / (axisMax - axisMin)) * 100
  return Math.min(100, Math.max(0, pct))
}

/**
 * 有效分段（颜色交界）：每段视觉区间 [start, end]，供横轴按占比渲染
 * @param {Array} categories 分类数组（显示顺序）
 * @param {number} axisMin
 * @param {number} axisMax
 * @returns {Array<{cat: Object, start: number, end: number}>}
 */
export function getSegments(categories, axisMin, axisMax) {
  return categories.map((cat, i) => {
    const start = i === 0 ? axisMin : (categories[i - 1].max ?? axisMin)
    const end = cat.max ?? axisMax
    return { cat, start, end }
  })
}
