/**
 * 配速计算器 — 常量配置
 * @module logic/pace-calculator/constants
 */

/** 距离配置 */
export const DISTANCE_CONFIGS = [
  { key: '5k',        label: '5公里',        km: 5 },
  { key: '10k',      label: '10公里',       km: 10 },
  { key: '15k',      label: '15公里',       km: 15 },
  { key: 'half',     label: '半程马拉松',    km: 21.0975 },
  { key: 'marathon', label: '马拉松',       km: 42.195 },
]

/** 显示间隔选项 */
export const INTERVAL_OPTIONS = [
  { value: 1, label: '1公里' },
  { value: 5, label: '5公里' },
]

/** 配速策略配置 */
export const STRATEGY_CONFIG = {
  SEGMENTS: 5,    // 固定分 5 段
  MIN: -10,       // 前慢后快最大值
  MAX: 10,        // 前快后慢最大值
  STEP: 1,        // 步长
}

/** 时间选择器范围（字符串格式，uni-app picker 要求） */
export const HOUR_RANGE = Array.from({ length: 7 }, (_, i) => String(i))                    // "0"-"6"
export const MIN_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')) // "00"-"59"
