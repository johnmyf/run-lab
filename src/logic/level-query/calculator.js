/**
 * 等级查询模块 — 查询算法
 * @module logic/level-query/calculator
 */
import { parseTimeToSeconds } from '@/utils/time'
import { getAgeGroup, LEVELS_LOW_TO_HIGH, MASS_LEVELS } from './constants'

/**
 * 查询用户当前等级：成绩严格小于标准线才算达标，取达标中级别最高者
 * @param {Object} params
 * @param {string} params.project - 项目：'马拉松' | '半程马拉松'
 * @param {string} params.gender - 性别：'男子' | '女子'
 * @param {number} params.age - 年龄 18~100
 * @param {number} params.totalSeconds - 最好成绩（总秒数，>0）
 * @param {Object} levelData - level.json 数据（页面从 @/data/level.json 导入传入）
 * @returns {string|null} 级别 key；全不达标返回 null
 */
export function queryLevel(params, levelData) {
  const { project, gender, age, totalSeconds } = params
  const genderData = levelData?.[project]?.[gender]
  if (!genderData || !totalSeconds || totalSeconds <= 0) return null

  const ageGroup = getAgeGroup(age)
  let result = null

  // 由低到高遍历；达标则覆盖 result，最终 result 为最高达标级别
  for (const level of LEVELS_LOW_TO_HIGH) {
    let standardStr
    if (MASS_LEVELS.includes(level)) {
      standardStr = genderData['大众']?.[level]?.[ageGroup]
    } else {
      standardStr = genderData['专业']?.[level]
    }
    if (!standardStr) continue

    const standardSeconds = parseTimeToSeconds(standardStr)
    if (totalSeconds < standardSeconds) {
      result = level
    }
  }
  return result
}
