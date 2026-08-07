<template>
  <!-- 小程序端分享海报画布（H5 不编译此节点，走 html2canvas 截图） -->
  <!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
  <canvas
    :canvas-id="canvasId"
    :id="canvasId"
    class="share-poster"
    :style="canvasStyle"
  />
  <!-- #endif -->
</template>

<script setup>
import { computed, getCurrentInstance, nextTick } from 'vue'
import QRCode from 'qrcode'

/** 跑研匠官网地址（与 H5 分享二维码同源） */
const HOME_SITE = 'https://run-lab.pages.dev/'

const props = defineProps({
  /** canvas-id，同一页面内需唯一 */
  canvasId: { type: String, default: 'sharePoster' },
  /** 页面顶部标题（与导航栏标题一致） */
  title: { type: String, default: '' },
  /** 标题色带背景色（与导航栏主题色一致） */
  color: { type: String, default: '#2C3E50' },
  /** 海报内容行 [{ label, value }] */
  content: { type: Array, default: () => [] },
})

const instance = getCurrentInstance()
const sysInfo = uni.getSystemInfoSync()
const winWidth = sysInfo.windowWidth || 375
const px = (rpx) => Math.round((rpx * winWidth) / 750)

// 布局参数（rpx）
const TITLE_H = 160 // 顶部标题色带高度
const PAD = 40 // 内容区左右/上下留白
const ROW_H = 52 // 每个内容行高度
const FOOTER_H = 420 // 底部品牌区高度
const QR_SIZE = 220 // 二维码边长

const posterH = computed(() => TITLE_H + PAD * 2 + props.content.length * ROW_H + FOOTER_H)
const posterPxH = computed(() => Math.round((posterH.value * winWidth) / 750))

const canvasStyle = computed(() => ({
  position: 'fixed',
  left: '0',
  top: '0',
  zIndex: '-999',
  opacity: '0.01',
  pointerEvents: 'none',
  width: winWidth + 'px',
  height: posterPxH.value + 'px',
}))

/** 绘制海报 */
function draw(ctx, w, h) {
  const u = w / 750 // 1rpx 对应的 px

  // 1. 顶部标题色带
  ctx.setFillStyle(props.color)
  ctx.fillRect(0, 0, w, TITLE_H * u)
  if (props.title) {
    ctx.setFillStyle('#FFFFFF')
    ctx.setFontSize(Math.round(40 * u))
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(props.title, w / 2, (TITLE_H / 2) * u)
  }

  // 2. 白色内容区背景
  ctx.setFillStyle('#FFFFFF')
  ctx.fillRect(0, TITLE_H * u, w, h - TITLE_H * u)

  // 3. 内容行（左标签 + 右数值；label 为空时整行左对齐纯文本）
  props.content.forEach((row, i) => {
    const cy = (TITLE_H + PAD + i * ROW_H + ROW_H / 2) * u
    if (row.label) {
      ctx.setTextAlign('left')
      ctx.setFillStyle('#7F8C8D')
      ctx.setFontSize(Math.round(26 * u))
      ctx.fillText(row.label, PAD * u, cy)
      ctx.setTextAlign('right')
      ctx.setFillStyle('#2C3E50')
      ctx.setFontSize(Math.round(28 * u))
      ctx.fillText(row.value, w - PAD * u, cy)
    } else {
      ctx.setTextAlign('left')
      ctx.setFillStyle('#2C3E50')
      ctx.setFontSize(Math.round(28 * u))
      ctx.fillText(row.value, PAD * u, cy)
    }
  })

  // 4. 底部品牌区
  const footerY = h - FOOTER_H * u
  ctx.setStrokeStyle('#ECECEC')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(PAD * u, footerY)
  ctx.lineTo(w - PAD * u, footerY)
  ctx.stroke()

  ctx.setTextAlign('center')
  ctx.setFillStyle('#2C3E50')
  ctx.setFontSize(Math.round(34 * u))
  ctx.fillText('跑研匠 RunLab', w / 2, footerY + 60 * u)

  ctx.setFillStyle('#95A5A6')
  ctx.setFontSize(Math.round(22 * u))
  ctx.fillText('专业的跑步计算工具', w / 2, footerY + 96 * u)

  // 5. 首页二维码（纯 JS 生成矩阵，逐模块绘制）
  const qrPx = QR_SIZE * u
  const qrX = w / 2 - qrPx / 2
  const qrY = footerY + 140 * u
  const qr = QRCode.create(HOME_SITE, { errorCorrectionLevel: 'H' })
  const m = qr.modules.size
  const cell = qrPx / (m + 4) // 四周留 2 模块白边
  ctx.setFillStyle('#FFFFFF')
  ctx.fillRect(qrX, qrY, qrPx, qrPx)
  ctx.setFillStyle('#000000')
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      if (qr.modules.get(r, c)) {
        ctx.fillRect(qrX + (c + 2) * cell, qrY + (r + 2) * cell, cell, cell)
      }
    }
  }
  ctx.setFillStyle('#999999')
  ctx.setFontSize(Math.round(22 * u))
  ctx.fillText('扫码访问跑研匠', w / 2, qrY + qrPx + 34 * u)
}

/** 绘制并导出临时图片路径 */
function generate() {
  return new Promise((resolve, reject) => {
    const w = winWidth
    const h = posterPxH.value
    const ctx = uni.createCanvasContext(props.canvasId, instance.proxy)
    try {
      draw(ctx, w, h)
    } catch (e) {
      reject(e)
      return
    }
    ctx.draw(false, () => {
      // 等绘制刷新到画布缓冲后再导出
      setTimeout(() => {
        uni.canvasToTempFilePath(
          {
            canvasId: props.canvasId,
            fileType: 'png',
            success: (res) => resolve(res.tempFilePath),
            fail: reject,
          },
          instance.proxy
        )
      }, 200)
    })
  })
}

/** 保存到相册（处理相册授权） */
function saveToAlbum(filePath) {
  return new Promise((resolve) => {
    uni.saveImageToPhotosAlbum({
      filePath,
      success: () => resolve(true),
      fail: (err) => {
        const msg = (err && err.errMsg) || ''
        if (msg.includes('auth') || msg.includes('authorize')) {
          uni.showModal({
            title: '需要相册权限',
            content: '生成分享海报需要保存图片到相册，请在设置中授权。',
            confirmText: '去设置',
            success: (r) => {
              if (r.confirm) {
                uni.openSetting({ success: () => resolve(false), fail: () => resolve(false) })
              } else {
                resolve(false)
              }
            },
          })
        } else {
          uni.showToast({ title: '保存失败', icon: 'none' })
          resolve(false)
        }
      },
    })
  })
}

/** 生成海报并保存到相册 */
async function share() {
  uni.showLoading({ title: '生成海报...' })
  try {
    await nextTick()
    const filePath = await generate()
    const ok = await saveToAlbum(filePath)
    if (ok) {
      uni.showToast({ title: '海报已保存', icon: 'success' })
    }
    return ok
  } catch (e) {
    console.error('海报生成失败:', e)
    uni.showToast({ title: '海报生成失败', icon: 'none' })
    return false
  } finally {
    uni.hideLoading()
  }
}

defineExpose({ share, generate })
</script>
