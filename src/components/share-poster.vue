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

/** 跑研匠官网地址（除微信外的小程序端分享二维码） */
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
  /**
   * 横轴热力图列表（可选），每项在内容行与底部品牌区之间渲染一个彩色分段条。
   * 每项结构：
   *   { title?, axis: [min,max], segments: [{cat:{name,color},start,end}],
   *     boundaries: [{bmi,weightKg}], markerBmi, legend: 'labels'|'table' }
   * 由业务页面（如 BMI）预先计算后传入，组件仅负责绘制。
   */
  heatmaps: { type: Array, default: () => [] },
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

// 热力图布局参数（rpx）
const HM_TITLE_H = 40 // 热力图标题
const HM_BOUNDARY_H = 52 // 交界值标签（两行小字）
const HM_TRIANGLE_H = 14 // 当前值黑色三角形高度
const HM_MARKER_GAP = 8 // 三角形与分段条间距
const HM_BAR_H = 36 // 彩色分段条高度
const HM_LABEL_H = 32 // labels 图例（分段名）高度
const HM_LEGEND_ROW_H = 42 // table 图例每行高度
const HM_GAP = 28 // 热力图块与下一块/品牌的间距

/** 单个热力图高度（rpx） */
function heatmapH(hm) {
  const legendH = hm.legend === 'table'
    ? HM_LEGEND_ROW_H * Math.ceil(hm.segments.length / 2)
    : HM_LABEL_H
  return (hm.title ? HM_TITLE_H : 0) + HM_BOUNDARY_H + HM_TRIANGLE_H + HM_MARKER_GAP + HM_BAR_H + legendH + HM_GAP
}

const heatmapsTotalH = computed(() =>
  props.heatmaps.reduce((sum, hm) => sum + heatmapH(hm), 0)
)

const posterH = computed(() =>
  TITLE_H + PAD * 2 + props.content.length * ROW_H + heatmapsTotalH.value + FOOTER_H
)
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

/** 数值在横轴上的位置百分比（0~100，越界 clamp），与 bmi 逻辑 getMarkerPosition 一致 */
function markerPos(value, axisMin, axisMax) {
  const pct = ((value - axisMin) / (axisMax - axisMin)) * 100
  return Math.min(100, Math.max(0, pct))
}

/** 绘制单个横轴热力图，返回绘制结束后的 y 坐标（px） */
function drawHeatmap(ctx, w, y, hm, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const barW = x1 - x0
  const axisMin = hm.axis[0]
  const axisMax = hm.axis[1]
  const span = axisMax - axisMin

  // 1. 标题
  if (hm.title) {
    ctx.setFillStyle('#2C3E50')
    ctx.setFontSize(Math.round(HM_TITLE_H * u * 0.7))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(hm.title, x0, y + (HM_TITLE_H / 2) * u)
    y += HM_TITLE_H * u
  }

  // 2. 交界值标签（临界 BMI + 体重两行小字）
  const boundaryH = HM_BOUNDARY_H * u
  ctx.setTextAlign('center')
  for (const b of hm.boundaries) {
    const bx = x0 + barW * (markerPos(b.bmi, axisMin, axisMax) / 100)
    ctx.setFillStyle('#555555')
    ctx.setFontSize(Math.round(20 * u))
    ctx.fillText(String(b.bmi), bx, y + boundaryH * 0.3)
    ctx.setFillStyle('#999999')
    ctx.setFontSize(Math.round(16 * u))
    ctx.fillText(`${b.weightKg}kg`, bx, y + boundaryH * 0.66)
  }
  y += boundaryH

  // 3. 当前值黑色三角形
  const mx = x0 + barW * (markerPos(hm.markerBmi, axisMin, axisMax) / 100)
  const triH = HM_TRIANGLE_H * u
  const triW = triH * 0.7
  ctx.setFillStyle('#000000')
  ctx.beginPath()
  ctx.moveTo(mx, y + triH)
  ctx.lineTo(mx - triW, y)
  ctx.lineTo(mx + triW, y)
  ctx.closePath()
  ctx.fill()
  y += triH + HM_MARKER_GAP * u

  // 4. 彩色分段条
  const barH = HM_BAR_H * u
  for (const seg of hm.segments) {
    const sx = x0 + barW * ((seg.start - axisMin) / span)
    const ex = x0 + barW * ((seg.end - axisMin) / span)
    const segX = Math.max(sx, x0)
    const segW = Math.max(ex, segX + 1) - segX
    ctx.setFillStyle(seg.cat.color)
    ctx.fillRect(segX, y, segW, barH)
  }
  y += barH

  // 5. 图例
  if (hm.legend === 'table') {
    // 两列网格：色块 + 完整名称
    const rows = Math.ceil(hm.segments.length / 2)
    const rowH = HM_LEGEND_ROW_H * u
    const colW = barW / 2
    ctx.setFontSize(Math.round(20 * u))
    ctx.setTextAlign('left')
    hm.segments.forEach((seg, i) => {
      const col = Math.floor(i / rows)
      const row = i % rows
      const lx = x0 + col * colW
      const ly = y + row * rowH + rowH / 2
      const swatch = rowH * 0.42
      ctx.setFillStyle(seg.cat.color)
      ctx.fillRect(lx, ly - swatch / 2, swatch, swatch)
      ctx.setFillStyle('#555555')
      ctx.fillText(seg.cat.name, lx + swatch * 1.4, ly)
    })
    y += rows * rowH
  } else {
    // 分段名标签：每段名称居中于段内
    ctx.setFillStyle('#555555')
    ctx.setFontSize(Math.round(20 * u))
    ctx.setTextAlign('center')
    for (const seg of hm.segments) {
      const mid = seg.start + (seg.end - seg.start) / 2
      const cx = x0 + barW * ((mid - axisMin) / span)
      ctx.fillText(seg.cat.name, cx, y + HM_LABEL_H * u * 0.6)
    }
    y += HM_LABEL_H * u
  }

  return y + HM_GAP * u
}

/** 绘制海报主体（标题色带 + 内容行 + 热力图 + 品牌区），不含二维码本体 */
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

  // 4. 横轴热力图（每个占一块，绘制后推进 y）
  let y = (TITLE_H + PAD + props.content.length * ROW_H + PAD) * u
  for (const hm of props.heatmaps) {
    y = drawHeatmap(ctx, w, y, hm, u)
  }

  // 5. 底部品牌区
  const footerY = h - FOOTER_H * u
  ctx.setStrokeStyle('#ECECEC')
  ctx.setLineWidth(1)
  ctx.beginPath()
  ctx.moveTo(PAD * u, footerY)
  ctx.lineTo(w - PAD * u, footerY)
  ctx.stroke()

  ctx.setTextAlign('center')
  ctx.setTextBaseline('middle')
  ctx.setFillStyle('#2C3E50')
  ctx.setFontSize(Math.round(34 * u))
  ctx.fillText('跑研匠', w / 2, footerY + 60 * u)

  ctx.setFillStyle('#95A5A6')
  ctx.setFontSize(Math.round(22 * u))
  ctx.fillText('专业的跑步计算工具', w / 2, footerY + 96 * u)

  // 二维码白底（本体由 drawQr 绘制）
  const qrPx = QR_SIZE * u
  const qrX = w / 2 - qrPx / 2
  const qrY = footerY + 140 * u
  ctx.setFillStyle('#FFFFFF')
  ctx.fillRect(qrX, qrY, qrPx, qrPx)

  ctx.setFillStyle('#999999')
  ctx.setFontSize(Math.round(22 * u))
  ctx.fillText('扫码访问跑研匠', w / 2, qrY + qrPx + 34 * u)
}

/** 绘制二维码本体（微信端用小程序码图片，其他端用网页二维码矩阵），完成后回调 cb */
function drawQr(ctx, w, h, cb) {
  const u = w / 750
  const qrPx = QR_SIZE * u
  const qrX = w / 2 - qrPx / 2
  const qrY = h - FOOTER_H * u + 140 * u

  // #ifdef MP-WEIXIN
  // 微信端：使用微信小程序码图片（仅微信分享需要微信专属码）
  // 注意：组件内 getImageInfo 对 /static/ 的路径解析会出错（转成 /components/static/）。
  // 改用文件系统 API：把代码包内的小程序码复制到用户目录（临时路径），再 drawImage 临时路径，
  // 临时路径不走 uni-app 的路径转换，最可靠。
  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    cb()
  }
  try {
    const fs = uni.getFileSystemManager()
    const dest = `${uni.env.USER_DATA_PATH}/mp-weixin-qrcode.jpg`
    fs.copyFile({
      srcPath: '/static/mp-weixin-qrcode.jpg',
      destPath: dest,
      success: () => {
        try {
          ctx.drawImage(dest, qrX, qrY, qrPx, qrPx)
        } catch (e) {
          console.warn('微信小程序码绘制失败:', e)
        }
        done()
      },
      fail: (err) => {
        console.warn('微信小程序码复制失败:', err)
        done()
      },
    })
  } catch (e) {
    console.warn('getFileSystemManager 不可用:', e)
    done()
  }
  // 兜底：3 秒内未回调也继续，避免 loading 一直转
  setTimeout(done, 3000)
  // #endif

  // #ifndef MP-WEIXIN
  // 其他小程序端：网页二维码（纯 JS 生成矩阵，逐模块绘制）
  const qr = QRCode.create(HOME_SITE, { errorCorrectionLevel: 'H' })
  const m = qr.modules.size
  const cell = qrPx / (m + 4) // 四周留 2 模块白边
  ctx.setFillStyle('#000000')
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      if (qr.modules.get(r, c)) {
        ctx.fillRect(qrX + (c + 2) * cell, qrY + (r + 2) * cell, cell, cell)
      }
    }
  }
  cb()
  // #endif
}

/** 绘制并导出临时图片路径 */
function generate() {
  return new Promise((resolve, reject) => {
    const w = winWidth
    const h = posterPxH.value
    const ctx = uni.createCanvasContext(props.canvasId, instance.proxy)
    try {
      draw(ctx, w, h)
      drawQr(ctx, w, h, () => {
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
    } catch (e) {
      reject(e)
      return
    }
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
