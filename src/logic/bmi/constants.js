/**
 * 体重建议模块 — 常量配置
 * @module logic/bmi/constants
 */

/** 性别选项 */
export const GENDERS = ['男', '女']

/** 输入默认值 */
export const DEFAULT_WEIGHT = 65
export const DEFAULT_HEIGHT = 170
export const DEFAULT_GENDER = '男'

/** 单位 */
export const WEIGHT_UNIT = 'kg'
export const HEIGHT_UNIT = 'cm'
export const BMI_UNIT = 'kg/m²'

/** 横轴坐标轴范围 [min, max] */
export const ADULT_AXIS = [14, 32]
export const RUNNER_AXIS = [14, 30]

/** 页面标题 */
export const PAGE_TITLE = '体重建议'

/** 分享文件名前缀 */
export const SHARE_PREFIX = '体重建议'

/** BMI 说明文案（含 **加粗** 标记，由 parseBold 解析） */
export const BMI_INTRO = '说明: BMI（英文全称Body Mass Index，中文名称**身体质量指数**）：是衡量人体胖瘦程度以及是否健康的一个常用指标。'

/** 说明页链接文案 */
export const UNDERSTANDING_LINK_TEXT = '跑者如何理解 BMI（身体质量指数）'
