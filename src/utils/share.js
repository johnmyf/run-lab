/**
 * 分享工具函数 — 截图 + 底部二维码合成
 * @module utils/share
 */

// #ifdef H5
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

/** 跑研匠官网地址 */
export const HOME_SITE = 'https://run-lab.pages.dev/'

/**
 * 生成分享图片（截图 + 顶部标题色带 + 底部二维码），触发下载
 * @param {Element} pageEl - 页面容器 DOM 元素
 * @param {object} options
 * @param {string} options.prefix - 文件名前缀，如 "成绩预测"
 * @param {number} [options.qrSize=200] - 二维码尺寸 (px)
 * @param {number} [options.scale=2] - canvas 缩放倍率
 * @param {string} [options.title] - 页面顶部标题（系统导航栏不在截图 DOM 内，需手动合成色带）
 * @param {string} [options.color] - 标题色带背景色（与导航栏主题色一致）
 * @returns {Promise<boolean>} 是否成功
 */
export async function captureAndShare(pageEl, { prefix, qrSize = 200, scale = 2, title, color }) {
  try {
    // 1. 截图页面内容
    const canvasA = await html2canvas(pageEl, {
      scale,
      useCORS: true,
      backgroundColor: '#f5f5f5',
    })

    // 1.1 顶部标题色带高度（按 160rpx 等比换算到 canvas 像素）
    const headerH = title ? Math.round((160 / 750) * canvasA.width) : 0
    const titleFontSize = title ? Math.round((40 / 750) * canvasA.width) : 0

    // 2. QR 区域尺寸计算
    const padding = 40 * scale
    const textGap = 16 * scale
    const textHeight = 24 * scale
    const qrAreaHeight = padding + qrSize + textGap + textHeight + padding

    // 3. 创建合成 canvas
    const canvasB = document.createElement('canvas')
    canvasB.width = canvasA.width
    canvasB.height = headerH + canvasA.height + qrAreaHeight
    const ctx = canvasB.getContext('2d')

    // 4. 绘制顶部标题色带
    if (title && color) {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvasB.width, headerH)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = `bold ${titleFontSize}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(title, canvasB.width / 2, headerH / 2)
    }

    // 5. 绘制页面截图
    ctx.drawImage(canvasA, 0, headerH)

    // 6. 绘制二维码区域（白底）
    const qrAreaY = headerH + canvasA.height
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

    // 9. 绘制 "扫码访问跑研匠" 文字
    const fontSize = Math.round(24 * scale)
    ctx.fillStyle = '#999999'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const textY = qrY + qrSize + textGap
    ctx.fillText('扫码访问跑研匠', canvasB.width / 2, textY)

    // 10. 触发下载
    const link = document.createElement('a')
    link.download = `${prefix}.png`
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
