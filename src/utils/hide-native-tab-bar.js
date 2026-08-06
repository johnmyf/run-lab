/**
 * 隐藏原生 tabBar — QQ/快手小程序不支持 pages.json 的 tabBar.custom,
 * 需在 tabBar 页面每次显示(onShow)时调用 uni.hideTabBar 隐藏原生栏,
 * 以配合自定义 tabBar 组件。
 * 注意:本文件仅 QQ/快手编译,其他平台条件编译后为空文件,勿在其他平台 import。
 */
// #ifdef MP-QQ || MP-KUAISHOU
export function hideNativeTabBar() {
  uni.hideTabBar({
    animation: false,
    fail: () => {},
  })
}
// #endif
