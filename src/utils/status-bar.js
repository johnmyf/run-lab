/**
 * 状态栏工具 — 获取系统状态栏高度（px）
 * 用于自定义导航栏页面预留顶部安全区域（含 iOS 刘海），避免与系统时间/信号/电量重叠。
 * 说明：uni-app 编译期写死的 var(--status-bar-height) 为固定 25px，真机（尤其刘海屏）不准，
 * 故用 JS 实时读取。
 */
const info = uni.getSystemInfoSync()

/** 系统状态栏高度（px），获取失败时兜底 0 */
export const statusBarHeight = (info && info.statusBarHeight) || 0
