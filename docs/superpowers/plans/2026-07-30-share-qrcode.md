# 分享二维码功能 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已有分享截图功能（html2canvas）的 4 个 H5 页面的分享图片底部，增加指向 HOME_SITE 的二维码，中间嵌入 run-lab-icon.png。

**Architecture:** 新增 `src/utils/share.js` 共享函数，封装截图→合成二维码→下载的全流程；各页面原有的 `shareResult()` 简化为调用该函数。

**Tech Stack:** uni-app (Vue3), Vite 5.2, html2canvas ^1.4.1, qrcode (新增)

## Global Constraints

- 仅 H5 平台生效，小程序端不受影响
- `html2canvas` 和 `qrcode` 的 import 必须包裹在 `#ifdef H5` 条件编译中
- 所有页面现有的 `#ifndef H5` 分享提示保持不变
- `run-lab-icon.png` 位于 `src/static/run-lab-icon.png`
- `HOME_SITE = 'https://run-lab.pages.dev/'`

---

### Task 1: 安装 qrcode 依赖

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `qrcode` 包可用

- [ ] **Step 1: 安装 qrcode 包**

```bash
npm install qrcode
```

- [ ] **Step 2: 验证安装成功**

```bash
node -e "require('qrcode'); console.log('ok')"
```
Expected: 输出 `ok`

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add qrcode dependency for share QR code"
```

---

### Task 2: 创建共享分享工具函数

**Files:**
- Create: `src/utils/share.js`

**Interfaces:**
- Produces:
  - `export const HOME_SITE = 'https://run-lab.pages.dev/'`
  - `export async function captureAndShare(pageEl, { prefix, qrSize = 200, scale = 2 })` → `Promise<boolean>`

- [ ] **Step 1: 创建 `src/utils/share.js`**

```js
/**
 * 分享工具函数 — 截图 + 底部二维码合成
 * @module utils/share
 */

// #ifdef H5
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

/** 跑研社官网地址 */
export const HOME_SITE = 'https://run-lab.pages.dev/'

/**
 * 生成分享图片（截图 + 底部二维码），触发下载
 * @param {Element} pageEl - 页面容器 DOM 元素
 * @param {object} options
 * @param {string} options.prefix - 文件名前缀，如 "成绩预测"
 * @param {number} [options.qrSize=200] - 二维码尺寸 (px)
 * @param {number} [options.scale=2] - canvas 缩放倍率
 * @returns {Promise<boolean>} 是否成功
 */
export async function captureAndShare(pageEl, { prefix, qrSize = 200, scale = 2 }) {
  try {
    // 1. 截图页面内容
    const canvasA = await html2canvas(pageEl, {
      scale,
      useCORS: true,
      backgroundColor: '#f5f5f5',
    })

    // 2. QR 区域尺寸计算
    const padding = 40 * scale
    const textGap = 16 * scale
    const textHeight = 24 * scale
    const qrAreaHeight = padding + qrSize + textGap + textHeight + padding

    // 3. 创建合成 canvas
    const canvasB = document.createElement('canvas')
    canvasB.width = canvasA.width
    canvasB.height = canvasA.height + qrAreaHeight
    const ctx = canvasB.getContext('2d')

    // 4. 绘制页面截图
    ctx.drawImage(canvasA, 0, 0)

    // 5. 绘制二维码区域（白底）
    const qrAreaY = canvasA.height
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, qrAreaY, canvasB.width, qrAreaHeight)

    // 6. 生成二维码到临时 canvas
    const qrCanvas = document.createElement('canvas')
    qrCanvas.width = qrSize
    qrCanvas.height = qrSize

    await QRCode.toCanvas(qrCanvas, HOME_SITE, {
      width: qrSize,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H', // 高纠错，容纳中间图标
    })

    // 7. 将二维码绘制到合成画布
    const qrX = (canvasB.width - qrSize) / 2
    const qrY = qrAreaY + padding
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

    // 8. 加载图标并绘制到二维码中心
    try {
      const img = await loadImage('/static/run-lab-icon.png')
      const iconSize = Math.round(qrSize * 0.22) // 约 22% 的二维码尺寸
      const iconX = qrX + (qrSize - iconSize) / 2
      const iconY = qrY + (qrSize - iconSize) / 2
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize)
    } catch {
      // 图标加载失败 → 跳过，不阻塞分享
    }

    // 9. 绘制 "扫码访问跑研社" 文字
    const fontSize = Math.round(24 * scale)
    ctx.fillStyle = '#999999'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const textY = qrY + qrSize + textGap
    ctx.fillText('扫码访问跑研社', canvasB.width / 2, textY)

    // 10. 触发下载
    const link = document.createElement('a')
    link.download = `${prefix}_VDOT.png`
    link.href = canvasB.toDataURL('image/png')
    link.click()

    return true
  } catch (e) {
    console.error('captureAndShare 失败:', e)
    return false
  }
}

/**
 * 加载图片
 * @param {string} src - 图片 URL
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
// #endif
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/share.js
git commit -m "feat: create share utility with QR code compositing"
```

---

### Task 3: 改造成绩预测页面的 shareResult()

**Files:**
- Modify: `src/pages/performance-prediction/index.vue`

**Interfaces:**
- Consumes: `captureAndShare` from `@/utils/share`

- [ ] **Step 1: 修改 script 部分**

替换 import 部分，在 `html2canvas` import 之后（或替换它）增加：

```js
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
```

同时移除 `html2canvas` 的 import（它已被移到 share.js 中）。

替换整个 `shareResult()` 函数（原 202-246 行）：

```js
// 分享成绩（生成图片并下载）
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
    if (!pageEl) {
      uni.hideLoading()
      uni.showToast({ title: '页面元素未找到', icon: 'none' })
      return
    }

    const ok = await captureAndShare(pageEl, { prefix: `成绩预测_VDOT${vdotValue.value}` })
    if (ok) {
      uni.showToast({ title: '图片已生成', icon: 'success' })
    } else {
      throw new Error('captureAndShare returned false')
    }
  } catch (e) {
    console.error('分享失败:', e)
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  } finally {
    sharing.value = false
    uni.hideLoading()
  }
}
```

移除 `html2canvas` 的 import 行。

- [ ] **Step 2: 提交**

```bash
git add src/pages/performance-prediction/index.vue
git commit -m "refactor: use shared captureAndShare in performance-prediction page"
```

---

### Task 4: 改造心率计算页面的 shareResult()

**Files:**
- Modify: `src/pages/heart-rate/index.vue`

- [ ] **Step 1: 修改 script 部分**

替换 `html2canvas` import 为 `captureAndShare`：

```js
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
```

替换整个 `shareResult()` 函数（原 192-234 行）：

```js
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
    if (!pageEl) {
      uni.hideLoading()
      uni.showToast({ title: '页面元素未找到', icon: 'none' })
      return
    }

    const ok = await captureAndShare(pageEl, { prefix: '心率计算' })
    if (ok) {
      uni.showToast({ title: '图片已生成', icon: 'success' })
    } else {
      throw new Error('captureAndShare returned false')
    }
  } catch (e) {
    console.error('分享失败:', e)
    uni.showToast({ title: '分享生成失败', icon: 'none' })
  } finally {
    sharing.value = false
    uni.hideLoading()
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/heart-rate/index.vue
git commit -m "refactor: use shared captureAndShare in heart-rate page"
```

---

### Task 5: 改造配速计算器页面的 shareResult()

**Files:**
- Modify: `src/pages/pace-calculator/index.vue`

- [ ] **Step 1: 修改 script 部分**

替换 `html2canvas` import 为 `captureAndShare`：

```js
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
```

替换整个 `shareResult()` 函数（原 303-326 行）：

```js
// 分享（H5 截图 + 二维码）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '配速计划' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/pace-calculator/index.vue
git commit -m "refactor: use shared captureAndShare in pace-calculator page"
```

---

### Task 6: 改造完赛时间计算页面的 shareResult()

**Files:**
- Modify: `src/pages/finish-time/index.vue`

- [ ] **Step 1: 修改 script 部分**

替换 `html2canvas` import 为 `captureAndShare`：

```js
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
```

替换整个 `shareResult()` 函数（原 309-331 行）：

```js
// 分享（H5 截图 + 二维码）
async function shareResult() {
  // #ifdef H5
  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '完赛计划' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
  // #endif
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/finish-time/index.vue
git commit -m "refactor: use shared captureAndShare in finish-time page"
```

---

### Task 7: 验证 H5 构建通过

- [ ] **Step 1: 构建 H5 产物**

```bash
npm run build:h5
```

Expected: 构建成功，无错误

- [ ] **Step 2: 检查构建产物是否包含 share.js**

```bash
grep -r "captureAndShare\|扫码访问跑研社" dist/build/h5/ --include="*.js" | head -5
```

Expected: 找到至少一条匹配结果

- [ ] **Step 3: 提交最终构建（如果构建产物理应被跟踪）或仅确认**

```bash
git log --oneline -5
```
