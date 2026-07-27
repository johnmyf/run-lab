/**
 * 心率计算模块 — 计算函数
 * @module logic/heart-rate/calculator
 */

import { AGE_MIN, AGE_MAX } from './constants'

/**
 * 验证年龄输入是否有效
 * @param {number|string} age
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAge(age) {
  const num = Number(age)
  if (age === '' || age === null || age === undefined) {
    return { valid: false, message: '请输入年龄' }
  }
  if (!Number.isInteger(num) || num < AGE_MIN || num > AGE_MAX) {
    return { valid: false, message: `年龄需在 ${AGE_MIN}-${AGE_MAX} 岁之间` }
  }
  return { valid: true }
}

/**
 * 计算三种最大心率估算值
 * @param {number} age - 年龄 (10-99)
 * @param {'男'|'女'} gender - 性别
 * @returns {Array<{name: string, formula: string, value: number}>}
 */
export function calcHeartRates(age, gender) {
  return [
    {
      name: '传统公式',
      formula: '220 - 年龄',
      value: Math.round(220 - age)
    },
    {
      name: 'Tanaka公式',
      formula: '208 - 0.7×年龄',
      value: Math.round(208 - 0.7 * age)
    },
    {
      name: 'Gulati公式',
      formula: gender === '男' ? '208 - 0.7×年龄' : '206 - 0.88×年龄',
      value: Math.round(gender === '男' ? 208 - 0.7 * age : 206 - 0.88 * age)
    }
  ]
}

/**
 * 根据最大心率计算指定区间的范围
 * @param {number} maxHR - 最大心率
 * @param {number} lower - 下限百分比 (如 0.5)
 * @param {number} upper - 上限百分比 (如 0.6)
 * @returns {{ from: number, to: number }}
 */
export function calcZoneRange(maxHR, lower, upper) {
  return {
    from: Math.round(maxHR * lower),
    to: Math.round(maxHR * upper)
  }
}
