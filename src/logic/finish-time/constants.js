/**
 * 完赛时间计算 — 常量配置
 * @module logic/finish-time/constants
 */

/** 配速 - 分钟范围（0~15） */
export const PACE_MIN_RANGE = Array.from({ length: 16 }, (_, i) => String(i))

/** 配速 - 秒范围（00~59） */
export const PACE_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
