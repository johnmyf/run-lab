/**
 * 跑力值计算模块 — 常量配置
 * @module logic/running-power/constants
 */

/** Pick er 选择器的 60 分钟/秒 范围 00-59 */
export const RANGE_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** Pick er 选择器的小时范围 */
export const RANGE_HOURS = {
  /** 0-1（10公里用） */
  H2: ['0', '1'],
  /** 0-2（15公里用） */
  H3: ['0', '1', '2'],
  /** 0-3（半程马拉松用） */
  H4: ['0', '1', '2', '3'],
  /** 0-6（马拉松用） */
  H7: ['0', '1', '2', '3', '4', '5', '6']
}

/** 距离配置项：key（对应 sheet5-1.json subject）、label、picker 列数 */
export const DISTANCE_CONFIGS = [
  { key: '5公里', label: '5公里最佳成绩:', rangeCount: 2 },
  { key: '10公里', label: '10公里最佳成绩:', rangeCount: 3 },
  { key: '15公里', label: '15公里最佳成绩:', rangeCount: 3 },
  { key: '半程马拉松', label: '半程马拉松最佳成绩:', rangeCount: 3 },
  { key: '马拉松', label: '马拉松最佳成绩:', rangeCount: 3 }
]

/**
 * 根据距离配置取 picker range 数组
 * @param {number} rangeCount - 2 或 3
 * @returns {string[][]} picker 列数据
 */
export function getPickerRanges(rangeCount) {
  return rangeCount === 2
    ? [[...RANGE_60], [...RANGE_60]]
    : [[...RANGE_HOURS[`H${rangeCount}`]], [...RANGE_60], [...RANGE_60]]
}

/**
 * 格式化 picker 选中值为时间字符串
 * @param {string[][]} ranges - picker 列数据
 * @param {number[]} indices - 每列选中项索引
 * @returns {string} 如 "36:40" 或 "1:31:35"
 */
export function formatPickerTime(ranges, indices) {
  return indices.map((i, idx) => ranges[idx][i]).join(':')
}

/** 全马破三的 target 时间：2:58:47 */
export const MARATHON_303_TIME = [2, 58, 47]
