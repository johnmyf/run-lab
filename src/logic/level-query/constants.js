/**
 * 等级查询模块 — 常量配置
 * @module logic/level-query/constants
 */

/** 项目 */
export const PROJECTS = ['马拉松', '半程马拉松']

/** 性别 */
export const GENDERS = ['男子', '女子']

/** 年龄组（与 level.json 键完全对应，含全角 ～） */
export const AGE_GROUPS = [
  '34岁以下', '35～39岁', '40～44岁', '45～49岁',
  '50～54岁', '55～59岁', '60～64岁', '65岁以上'
]

/** 大众级别（按年龄组分档），由低到高 */
export const MASS_LEVELS = ['大众二级', '大众一级', '大众精英']

/** 专业级别（固定值，不分年龄），由低到高 */
export const PRO_LEVELS = ['三级运动员', '二级运动员', '一级运动员', '运动健将', '国际健将']

/** 全部级别由低到高（查询遍历顺序） */
export const LEVELS_LOW_TO_HIGH = [...MASS_LEVELS, ...PRO_LEVELS]

/** 全不达标时的提示文案 */
export const NO_LEVEL_TEXT = '未达标任何级别,请继续努力'

/** 结果区显示名映射：专业等级加"(专业)"前缀，国际健将→国家健将 */
const LEVEL_DISPLAY_NAMES = {
  '三级运动员': '(专业)三级运动员',
  '二级运动员': '(专业)二级运动员',
  '一级运动员': '(专业)一级运动员',
  '运动健将': '运动健将',
  '国际健将': '国家健将'
}

/**
 * 级别显示名（表格用数据名，结果区用此映射后的名字）
 * @param {string} level - 级别 key（如 '国际健将'）
 * @returns {string} 如 '国家健将' 或 '(专业)三级运动员'
 */
export function getLevelDisplayName(level) {
  if (!level) return ''
  return LEVEL_DISPLAY_NAMES[level] || level
}

/**
 * 年龄 → 年龄组
 * @param {number} age - 18~100
 * @returns {string} 年龄组 key
 */
export function getAgeGroup(age) {
  if (age <= 34) return '34岁以下'
  if (age <= 39) return '35～39岁'
  if (age <= 44) return '40～44岁'
  if (age <= 49) return '45～49岁'
  if (age <= 54) return '50～54岁'
  if (age <= 59) return '55～59岁'
  if (age <= 64) return '60～64岁'
  return '65岁以上'
}

/** 时间选择器：时 0~6 */
export const HOUR_RANGE = Array.from({ length: 7 }, (_, i) => String(i))

/** 分/秒选择器：00~59 */
export const MIN_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 年龄选择器：18~100 */
export const AGE_RANGE = Array.from({ length: 83 }, (_, i) => String(i + 18))
