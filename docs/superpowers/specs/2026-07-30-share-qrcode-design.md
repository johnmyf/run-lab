# 分享功能增加二维码 — 设计文档

## 概述

为现有的 H5 分享截图功能增加二维码：在生成的分享图片底部追加二维码，扫码可访问跑研社官网（HOME_SITE = "https://run-lab.pages.dev/"）。

## 涉及页面

4 个已有分享按钮的 H5 页面：

| 页面 | 路径 |
|---|---|
| 成绩预测 | `src/pages/performance-prediction/index.vue` |
| 心率计算 | `src/pages/heart-rate/index.vue` |
| 配速计算器 | `src/pages/pace-calculator/index.vue` |
| 完赛时间计算 | `src/pages/finish-time/index.vue` |

## 架构变更

### 新增文件

- **`src/utils/share.js`** — 共享分享工具函数，包含：
  - `HOME_SITE` 常量
  - `captureAndShare(pageEl, options)` 异步函数

### 新增依赖

- **`qrcode`** npm 包 — 用于在 canvas 上生成二维码

### 修改文件

- **`package.json`** — 添加 `qrcode` 依赖
- 上述 4 个页面的 `index.vue` — `shareResult()` 改为调用 `captureAndShare()`

## captureAndShare() 函数设计

### 签名

```js
/**
 * 生成分享图片（截图 + 底部二维码），并触发下载
 * @param {Element} pageEl - 页面容器 DOM 元素
 * @param {object} options
 * @param {string} options.prefix - 文件名前缀，如 "成绩预测"
 * @param {number} [options.qrSize=200] - 二维码尺寸 (px)
 * @param {number} [options.scale=2] - canvas 缩放倍率
 * @returns {Promise<boolean>} 是否成功
 */
async function captureAndShare(pageEl, { prefix, qrSize = 200, scale = 2 })
```

### 流程图

```
captureAndShare(pageEl, { prefix })
  │
  ├─ 1. html2canvas(pageEl, { scale, useCORS: true }) → canvasA
  │
  ├─ 2. 计算 QR 区高度：
  │      paddingTop(40) + qrSize(200) + gap(16) + textHeight(24) + paddingBottom(40) = 320
  │
  ├─ 3. 创建 canvasB，宽 = canvasA.width，高 = canvasA.height + 320
  │
  ├─ 4. 将 canvasA 绘制到 canvasB 的 (0, 0)
  │
  ├─ 5. 绘制底部 QR 区域：
  │     ├─ 白色背景填充 (0, canvasA.height) 到右下角
  │     ├─ 用 qrcode.toCanvas() 在居中位置生成二维码（中间留空位）
  │     │    位置: x = (canvasB.width - qrSize) / 2
  │     │          y = canvasA.height + 40
  │     ├─ 加载 run-lab-icon.png，绘制到二维码中心（缩放至 40×40）
  │     └─ 在二维码下方绘制 "扫码访问跑研社" 文字
  │
  └─ 6. 触发下载：canvasB.toDataURL('image/png')
```

### 错误策略

- 整体 try-catch，任何步骤失败 → return false
- 图标加载失败 → 跳过图标绘制，二维码仍正常生成（不阻塞）
- 调用方根据返回值决定是否显示 toast

## 跨平台

- 仅 H5 平台生效（与现有 `html2canvas` 行为一致）
- `qrcode` 库仅在 `#ifdef H5` 中 import
- 小程序端不受影响

## 各页面改动

每个页面原有的 `shareResult()` 简化如下（以成绩预测页为例）：

```js
// 原：~40 行内联代码
// 改为：
import { captureAndShare } from '@/utils/share'
// ...
async function shareResult() {
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中打开使用分享功能', icon: 'none' })
  return
  // #endif
  try {
    uni.showLoading({ title: '生成分享图片...' })
    sharing.value = true
    await new Promise(resolve => setTimeout(resolve, 100))
    const pageEl = document.querySelector('.page-container')
    if (!pageEl) { /* 容错处理 */ return }
    const ok = await captureAndShare(pageEl, { prefix: '成绩预测' })
    if (!ok) throw new Error('share failed')
    uni.showToast({ title: '图片已生成', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  } finally {
    sharing.value = false
    uni.hideLoading()
  }
}
```

## 影响范围

- 不改动现有页面布局和样式
- 不影响小程序端
- 生成的图片文件大小增加约 10-30KB（二维码区域）
