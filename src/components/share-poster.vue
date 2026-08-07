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
  /** 兼容旧写法：简单内容行 [{ label, value, highlight?, note?, valueSize?, valueColor? }] */
  content: { type: Array, default: () => [] },
  /**
   * 横轴热力图列表（可选），每项在内容区渲染一个彩色分段条。
   * 每项：{ title?, axis:[min,max], segments:[{cat:{name,color},start,end}],
   *         boundaries:[{bmi,weightKg}], markerBmi, legend:'labels'|'table' }
   */
  heatmaps: { type: Array, default: () => [] },
  /**
   * 结构化海报块（可选，推荐）。按顺序渲染，类型：
   * - hero:   { type:'hero', title?, value, unit?, sub?, style:'gradient'|'tint'|'plain', color, colors?, bgColor?, valueSize? }
   * - card:   { type:'card', title?, subtitle?, color?, highlightBg?, rows:[{label?, value, valueSize?, valueColor?, highlight?, note?}] }
   * - table:  { type:'table', title?, headerBg?, headers:[{text,align?}], colWidths?, rows:[{cells[],highlight?,color?}], highlightLast?, highlightBg?, rowH?, rowColor?, fontSize?, maxRows? }
   * - text:   { type:'text', text, fontSize?, color?, bold?, align? }
   * - divider:{ type:'divider', color?, thickness?, margin? }
   */
  blocks: { type: Array, default: () => [] },
})

const instance = getCurrentInstance()
const sysInfo = uni.getSystemInfoSync()
const winWidth = sysInfo.windowWidth || 375
const px = (rpx) => Math.round((rpx * winWidth) / 750)

// 布局参数（rpx）
const TITLE_H = 160 // 顶部标题色带高度
const PAD = 40 // 内容区左右留白
const ROW_H = 52 // 内容行高度
const FOOTER_H = 420 // 底部品牌区高度
const QR_SIZE = 220 // 二维码边长
const BLOCK_GAP = 28 // 块与块之间的间距

// 热力图布局参数（rpx）
const HM_TITLE_H = 40
const HM_BOUNDARY_H = 52
const HM_TRIANGLE_H = 14
const HM_MARKER_GAP = 8
const HM_BAR_H = 36
const HM_LABEL_H = 32
const HM_LEGEND_ROW_H = 42
const HM_GAP = 28

// ==================== 归一化：content/heatmaps/blocks → 统一块序列 ====================

const posterBlocks = computed(() => {
  const blocks = []
  props.content.forEach(row => blocks.push({ type: 'row', ...row }))
  props.heatmaps.forEach(hm => blocks.push({ type: 'heatmap', ...hm }))
  props.blocks.forEach(b => blocks.push(b))
  return blocks
})

const posterH = computed(() => {
  let total = TITLE_H + PAD * 2 + FOOTER_H
  posterBlocks.value.forEach(b => { total += blockH(b) })
  return total
})
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

// ==================== 文本测量（确定性字符宽度估算，不用 measureText） ====================

function charUnit(c) {
  if (c >= '0' && c <= '9') return 0.62
  if (c === ' ') return 0.3
  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) return 0.58
  const code = c.charCodeAt(0)
  if (code >= 0x4E00 && code <= 0x9FFF) return 1 // CJK
  if ('·/-.:…'.includes(c)) return 0.45
  return 0.9
}
function textWidth(text, sizePx) {
  return [...String(text)].reduce((s, c) => s + charUnit(c), 0) * sizePx
}

/** 按最大宽度换行，返回行数组（宽度用字符估算） */
function wrapLines(text, sizePx, maxWidthPx) {
  const out = []
  for (const para of String(text).split('\n')) {
    if (!para) { out.push(''); continue }
    let line = ''
    for (const ch of para) {
      if (line && textWidth(line + ch, sizePx) > maxWidthPx) { out.push(line); line = ch }
      else line += ch
    }
    out.push(line)
  }
  return out
}

/** 长文本：先缩字号再截断加省略号 */
function fitValue(text, sizePx, maxWidthPx, minSizePx) {
  let s = sizePx
  while (s > minSizePx && textWidth(text, s) > maxWidthPx) s -= 2
  let t = String(text)
  while (t.length > 1 && textWidth(t + '…', s) > maxWidthPx) t = t.slice(0, -1)
  const overflow = textWidth(text, s) > maxWidthPx
  return { text: overflow ? t + '…' : text, size: s }
}

/** hex → rgba */
function hexA(hex, alpha) {
  const h = String(hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ==================== 圆角矩形路径 ====================

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (typeof ctx.arcTo === 'function') {
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + radius, radius)
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
    ctx.arcTo(x, y + h, x, y + h - radius, radius)
    ctx.arcTo(x, y, x + radius, y, radius)
  } else {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
  }
  ctx.closePath()
}

// ==================== 各块布局高度（rpx，与绘制同源） ====================

function heroLayout(b) {
  const titleH = b.title ? 34 : 0
  const valueH = (b.valueSize || 64) + 14
  const subH = b.sub ? 30 : 0
  return { titleH, valueH, subH, blockH: 30 + titleH + valueH + subH + 30 }
}
function cardLayout(b) {
  const titleH = b.title ? 52 : 0
  const subH = b.subtitle ? 34 : 0
  const pad = 24
  const rowsH = (b.rows || []).reduce((s, r) => s + ROW_H + (r.note ? 26 : 0), 0)
  return { titleH, subH, pad, rowsH, blockH: titleH + subH + pad * 2 + rowsH }
}
function capRows(b) {
  const max = b.maxRows || 20
  const rows = b.rows || []
  if (rows.length <= max) return rows
  const n = (b.headers || []).length || (rows[0]?.cells?.length || 1)
  const out = rows.slice(0, max - 2)
  out.push({ cells: Array(n).fill('…'), dim: true })
  out.push(rows[rows.length - 1])
  return out
}
function tableLayout(b) {
  const titleH = b.title ? 52 : 0
  const headH = 44
  const bodyH = capRows(b).length * (b.rowH || 48)
  return { titleH, headH, bodyH, blockH: titleH + headH + bodyH }
}
function textLayout(b) {
  const fontSize = b.fontSize || 26
  const maxWidth = 750 - PAD * 2
  const lines = wrapLines(b.text || '', fontSize, maxWidth)
  const lineH = fontSize * 1.35
  return { lines, lineH, blockH: Math.ceil(lines.length * lineH) }
}
function dividerLayout(b) {
  return { blockH: (b.thickness || 2) + (b.margin || 24) * 2 }
}

/** 每个块的布局高度（rpx） */
function blockH(b) {
  switch (b.type) {
    case 'hero': return heroLayout(b).blockH + BLOCK_GAP
    case 'card': return cardLayout(b).blockH + BLOCK_GAP
    case 'table': return tableLayout(b).blockH + BLOCK_GAP
    case 'text': return textLayout(b).blockH + BLOCK_GAP
    case 'divider': return dividerLayout(b).blockH
    case 'heatmap': return heatmapH(b)
    default: return ROW_H + BLOCK_GAP // row
  }
}

// ==================== 绘制：各块 ====================

function drawHero(ctx, w, y, b, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const cw = x1 - x0
  const { titleH, valueH, subH, blockH: bh } = heroLayout(b)
  // 背景（渐变 / 浅底 / 纯色）
  if (b.style === 'gradient' && b.colors) {
    try {
      const g = ctx.createLinearGradient(x0, y, x0, y + bh * u)
      g.addColorStop(0, b.colors[0])
      g.addColorStop(1, b.colors[1])
      ctx.setFillStyle(g)
    } catch (e) {
      ctx.setFillStyle(b.colors[0])
    }
  } else if (b.style === 'tint') {
    ctx.setFillStyle(b.bgColor || hexA(b.color, 0.08))
  } else {
    ctx.setFillStyle(b.color || '#2C3E50')
  }
  roundRectPath(ctx, x0, y, cw, bh * u, 16 * u)
  ctx.fill()

  let ly = y + 30 * u
  const onGradient = b.style === 'gradient'
  if (b.title) {
    ctx.setFillStyle(onGradient ? 'rgba(255,255,255,0.9)' : '#7F8C8D')
    ctx.setFontSize(Math.round(26 * u))
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.title, w / 2, ly + (titleH / 2) * u)
    ly += titleH * u
  }
  const valueSize = (b.valueSize || 64) * u
  const fit = fitValue(b.value, valueSize, cw * 0.8, valueSize * 0.6)
  ctx.setFillStyle(onGradient ? '#FFFFFF' : (b.color || '#2C3E50'))
  ctx.setFontSize(Math.round(fit.size))
  ctx.setTextAlign('center')
  ctx.setTextBaseline('middle')
  ctx.fillText(fit.text, w / 2, ly + (valueH / 2) * u)
  if (b.unit) {
    ctx.setFillStyle(onGradient ? 'rgba(255,255,255,0.85)' : '#95A5A6')
    ctx.setFontSize(Math.round(valueSize * 0.4))
    ctx.setTextAlign('left')
    ctx.fillText(b.unit, w / 2 + textWidth(fit.text, fit.size) / 2 + 6 * u, ly + (valueH / 2) * u + valueSize * 0.18)
  }
  ly += valueH * u
  if (b.sub) {
    ctx.setFillStyle(onGradient ? 'rgba(255,255,255,0.85)' : '#7F8C8D')
    ctx.setFontSize(Math.round(22 * u))
    ctx.setTextAlign('center')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.sub, w / 2, ly + (subH / 2) * u)
    ly += subH * u
  }
  return y + (bh + BLOCK_GAP) * u
}

function drawCard(ctx, w, y, b, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const cw = x1 - x0
  const { titleH, subH, pad, rowsH, blockH: bh } = cardLayout(b)
  const padPx = pad * u
  // 白底圆角 + 阴影
  ctx.setShadow(0, 2 * u, 8 * u, 'rgba(0,0,0,0.06)')
  ctx.setFillStyle('#FFFFFF')
  roundRectPath(ctx, x0, y, cw, bh * u, 16 * u)
  ctx.fill()
  ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

  let ly = y + padPx
  if (b.title) {
    ctx.setFillStyle(b.color || '#2C3E50')
    ctx.fillRect(x0 + 12 * u, ly + 12 * u, 6 * u, 26 * u)
    ctx.setFillStyle('#2C3E50')
    ctx.setFontSize(Math.round(28 * u))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.title, x0 + 28 * u, ly + (titleH / 2) * u)
    ly += titleH * u
  }
  if (b.subtitle) {
    ctx.setFillStyle('#999999')
    ctx.setFontSize(Math.round(22 * u))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.subtitle, x0 + padPx, ly + (subH / 2) * u)
    ly += subH * u
  }
  const rows = b.rows || []
  rows.forEach((row, i) => {
    const rowH = (ROW_H + (row.note ? 26 : 0)) * u
    const cy = ly + (ROW_H / 2) * u
    if (row.highlight) {
      ctx.setFillStyle(b.highlightBg || hexA(b.color, 0.08))
      roundRectPath(ctx, x0 + 10 * u, ly + 5 * u, cw - 20 * u, rowH - 10 * u, 12 * u)
      ctx.fill()
    }
    if (row.label) {
      ctx.setFillStyle('#7F8C8D')
      ctx.setFontSize(Math.round(26 * u))
      ctx.setTextAlign('left')
      ctx.setTextBaseline('middle')
      ctx.fillText(row.label, x0 + padPx, cy)
      const fit = fitValue(row.value, (row.valueSize || 28) * u, (cw - padPx * 2) * 0.55, 20 * u)
      ctx.setFillStyle(row.valueColor || '#2C3E50')
      ctx.setFontSize(Math.round(fit.size))
      ctx.setTextAlign('right')
      ctx.fillText(fit.text, x1 - padPx, cy)
    } else {
      ctx.setFillStyle(row.valueColor || '#2C3E50')
      ctx.setFontSize(Math.round(row.valueSize || 28) * u)
      ctx.setTextAlign('left')
      ctx.setTextBaseline('middle')
      ctx.fillText(row.value || '', x0 + padPx, cy)
    }
    if (row.note) {
      ctx.setFillStyle('#999999')
      ctx.setFontSize(Math.round(20 * u))
      ctx.setTextAlign('right')
      ctx.setTextBaseline('middle')
      ctx.fillText(row.note, x1 - padPx, ly + ROW_H * u + 12 * u)
    }
    if (i < rows.length - 1) {
      ctx.setStrokeStyle('#F0F0F0')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(x0 + padPx, ly + ROW_H * u)
      ctx.lineTo(x1 - padPx, ly + ROW_H * u)
      ctx.stroke()
    }
    ly += rowH
  })
  return y + (bh + BLOCK_GAP) * u
}

function colPositions(b, x0, cw) {
  const n = (b.headers || []).length || (b.rows?.[0]?.cells?.length || 1)
  const ws = b.colWidths || Array(n).fill(100 / n)
  let acc = 0
  return ws.map((pct) => {
    const wpx = cw * pct / 100
    const x = x0 + acc
    acc += wpx
    return { x, wpx }
  })
}

function drawTable(ctx, w, y, b, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const cw = x1 - x0
  const { titleH, headH, bodyH, blockH: bh } = tableLayout(b)
  const rows = capRows(b)
  const cols = colPositions(b, x0, cw)
  ctx.setShadow(0, 2 * u, 8 * u, 'rgba(0,0,0,0.06)')
  ctx.setFillStyle('#FFFFFF')
  roundRectPath(ctx, x0, y, cw, bh * u, 16 * u)
  ctx.fill()
  ctx.setShadow(0, 0, 0, 'rgba(0,0,0,0)')

  let ly = y
  if (b.title) {
    ctx.setFillStyle('#2C3E50')
    ctx.setFontSize(Math.round(28 * u))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.title, x0 + 24 * u, ly + (titleH / 2) * u)
    ly += titleH * u
  }
  // 表头
  ctx.setFillStyle(b.headerBg || props.color)
  ctx.fillRect(x0, ly, cw, headH * u)
  ctx.setFillStyle('#FFFFFF')
  ctx.setFontSize(Math.round(26 * u))
  ctx.setTextBaseline('middle')
  ;(b.headers || []).forEach((h, i) => {
    const col = cols[i]
    if (!col) return
    const align = h.align || 'left'
    if (align === 'center') { ctx.setTextAlign('center'); ctx.fillText(h.text, col.x + col.wpx / 2, ly + (headH / 2) * u) }
    else if (align === 'right') { ctx.setTextAlign('right'); ctx.fillText(h.text, col.x + col.wpx - 12 * u, ly + (headH / 2) * u) }
    else { ctx.setTextAlign('left'); ctx.fillText(h.text, col.x + 12 * u, ly + (headH / 2) * u) }
  })
  ly += headH * u
  // 数据行
  rows.forEach((row, i) => {
    const rowH = (b.rowH || 48) * u
    const isLast = i === rows.length - 1
    const hl = (b.highlightLast && isLast) || row.highlight
    if (hl) {
      ctx.setFillStyle(row.highlightBg || b.highlightBg || hexA(b.color, 0.08))
      ctx.fillRect(x0, ly, cw, rowH)
    }
    if (!isLast && !row.dim) {
      ctx.setStrokeStyle('#F0F0F0')
      ctx.setLineWidth(1)
      ctx.beginPath()
      ctx.moveTo(x0, ly + rowH)
      ctx.lineTo(x1, ly + rowH)
      ctx.stroke()
    }
    ctx.setFillStyle(row.color || (row.dim ? '#BBBBBB' : (b.rowColor || '#2C3E50')))
    ctx.setFontSize(Math.round(b.fontSize || 26) * u)
    ctx.setTextBaseline('middle')
    ;(row.cells || []).forEach((cell, ci) => {
      const col = cols[ci]
      if (!col) return
      const align = b.headers?.[ci]?.align || (ci === 0 ? 'left' : 'center')
      const fit = fitValue(cell, (b.fontSize || 26) * u, col.wpx * 0.9, 18 * u)
      ctx.setFontSize(Math.round(fit.size))
      if (align === 'center') { ctx.setTextAlign('center'); ctx.fillText(fit.text, col.x + col.wpx / 2, ly + rowH / 2) }
      else if (align === 'right') { ctx.setTextAlign('right'); ctx.fillText(fit.text, col.x + col.wpx - 10 * u, ly + rowH / 2) }
      else { ctx.setTextAlign('left'); ctx.fillText(fit.text, col.x + 10 * u, ly + rowH / 2) }
    })
    ly += rowH
  })
  return y + (bh + BLOCK_GAP) * u
}

function drawText(ctx, w, y, b, u) {
  const { lines, lineH, blockH: bh } = textLayout(b)
  const x0 = PAD * u
  const fontSize = (b.fontSize || 26) * u
  ctx.setFillStyle(b.color || '#2C3E50')
  ctx.setFontSize(Math.round(fontSize))
  ctx.setTextBaseline('top')
  const align = b.align || 'left'
  ctx.setTextAlign(align)
  lines.forEach((line, i) => {
    const tx = align === 'center' ? w / 2 : x0
    const ty = y + i * lineH * u
    if (b.bold) {
      ctx.fillText(line, tx + 1, ty)
      ctx.fillText(line, tx - 1, ty)
      ctx.fillText(line, tx, ty)
    } else {
      ctx.fillText(line, tx, ty)
    }
  })
  return y + (bh + BLOCK_GAP) * u
}

function drawDivider(ctx, w, y, b, u) {
  const { blockH: bh } = dividerLayout(b)
  const x0 = PAD * u
  const x1 = w - PAD * u
  const cy = y + (b.margin || 24) * u + ((b.thickness || 2) / 2) * u
  ctx.setStrokeStyle(b.color || '#ECECEC')
  ctx.setLineWidth(b.thickness || 2)
  ctx.beginPath()
  ctx.moveTo(x0, cy)
  ctx.lineTo(x1, cy)
  ctx.stroke()
  return y + bh * u
}

function drawRow(ctx, w, y, b, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const cy = y + (ROW_H / 2) * u
  if (b.label) {
    ctx.setFillStyle('#7F8C8D')
    ctx.setFontSize(Math.round(26 * u))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.label, x0, cy)
    const fit = fitValue(b.value, 28 * u, (x1 - x0) * 0.55, 20 * u)
    ctx.setFillStyle(b.valueColor || '#2C3E50')
    ctx.setFontSize(Math.round(fit.size))
    ctx.setTextAlign('right')
    ctx.fillText(fit.text, x1, cy)
  } else {
    ctx.setFillStyle(b.valueColor || '#2C3E50')
    ctx.setFontSize(Math.round(b.valueSize || 28) * u)
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(b.value || '', x0, cy)
  }
  return y + (ROW_H + BLOCK_GAP) * u
}

function drawBlock(ctx, w, y, b, u) {
  switch (b.type) {
    case 'hero': return drawHero(ctx, w, y, b, u)
    case 'card': return drawCard(ctx, w, y, b, u)
    case 'table': return drawTable(ctx, w, y, b, u)
    case 'text': return drawText(ctx, w, y, b, u)
    case 'divider': return drawDivider(ctx, w, y, b, u)
    case 'heatmap': return drawHeatmap(ctx, w, y, b, u)
    default: return drawRow(ctx, w, y, b, u)
  }
}

// ==================== 热力图（BMI 用，现有实现） ====================

/** 数值在横轴上的位置百分比（0~100，越界 clamp） */
function markerPos(value, axisMin, axisMax) {
  const pct = ((value - axisMin) / (axisMax - axisMin)) * 100
  return Math.min(100, Math.max(0, pct))
}

/** 单个热力图高度（rpx，含末尾间距） */
function heatmapH(hm) {
  const legendH = hm.legend === 'table'
    ? HM_LEGEND_ROW_H * Math.ceil(hm.segments.length / 2)
    : HM_LABEL_H
  return (hm.title ? HM_TITLE_H : 0) + HM_BOUNDARY_H + HM_TRIANGLE_H + HM_MARKER_GAP + HM_BAR_H + legendH + HM_GAP
}

function drawHeatmap(ctx, w, y, hm, u) {
  const x0 = PAD * u
  const x1 = w - PAD * u
  const barW = x1 - x0
  const axisMin = hm.axis[0]
  const axisMax = hm.axis[1]
  const span = axisMax - axisMin

  if (hm.title) {
    ctx.setFillStyle('#2C3E50')
    ctx.setFontSize(Math.round(HM_TITLE_H * u * 0.7))
    ctx.setTextAlign('left')
    ctx.setTextBaseline('middle')
    ctx.fillText(hm.title, x0, y + (HM_TITLE_H / 2) * u)
    y += HM_TITLE_H * u
  }

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

  if (hm.legend === 'table') {
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

// ==================== 海报主体 ====================

/** 绘制海报主体（标题色带 + 内容区块 + 品牌区），不含二维码本体 */
function draw(ctx, w, h) {
  const u = w / 750

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

  // 3. 内容区块（逐块推进 y）
  let y = (TITLE_H + PAD) * u
  for (const b of posterBlocks.value) {
    y = drawBlock(ctx, w, y, b, u)
  }

  // 4. 底部品牌区
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
  // 组件内 getImageInfo 对 /static/ 路径解析会出错，改用文件系统 API 复制到用户目录再绘制临时路径。
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
  setTimeout(done, 3000)
  // #endif

  // #ifndef MP-WEIXIN
  // 其他小程序端：网页二维码（纯 JS 生成矩阵，逐模块绘制）
  const qr = QRCode.create(HOME_SITE, { errorCorrectionLevel: 'H' })
  const m = qr.modules.size
  const cell = qrPx / (m + 4)
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
