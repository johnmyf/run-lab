/**
 * 校验 src/data/bmi.json 结构完整性
 * 用法: node scripts/verify-bmi.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(path.join(root, 'src/data/bmi.json'), 'utf8'))

const errors = []
function assert(cond, msg) { if (!cond) errors.push(msg) }

const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const lists = [
  ['adult', data.adult],
  ['runnerLevels.男', data.runnerLevels?.['男']],
  ['runnerLevels.女', data.runnerLevels?.['女']],
]

for (const [label, list] of lists) {
  if (!Array.isArray(list) || list.length === 0) { errors.push(`${label} 应为非空数组`); continue }
  list.forEach((cat, i) => {
    assert(cat && typeof cat.name === 'string' && cat.name, `${label}[${i}].name 缺失`)
    assert(cat && typeof cat.color === 'string' && HEX_RE.test(cat.color), `${label}[${i}].color 非法: ${cat?.color}`)
    assert(cat && (cat.visible === undefined || typeof cat.visible === 'boolean'), `${label}[${i}].visible 应为 boolean 或省略`)
    for (const k of ['min', 'max']) {
      assert(cat && (cat[k] === null || typeof cat[k] === 'number'), `${label}[${i}].${k} 应为 number 或 null`)
    }
    if (cat && cat.min !== null && cat.max !== null) {
      assert(cat.min < cat.max, `${label}[${i}] min(${cat.min}) 应小于 max(${cat.max})`)
    }
  })
  // 首项 min 为 null（低于最低的兜底档），末项 max 为 null（无上界）
  assert(list[0]?.min === null, `${label} 首项 min 应为 null`)
  assert(list[list.length - 1]?.max === null, `${label} 末项 max 应为 null`)
  // 相邻档无缺口：下档 min <= 上档 max（允许重叠，不允许缺口）
  for (let i = 1; i < list.length; i++) {
    const prevMax = list[i - 1].max
    if (prevMax === null) continue
    assert(list[i].min <= prevMax, `${label} 第${i}档 min(${list[i].min}) 应 <= 第${i - 1}档 max(${prevMax})（无缺口）`)
  }
}

// adult 半开语义的交接检查：除首档外，各档 min 即上一档 max（成人相邻不重叠）
for (let i = 1; i < data.adult.length; i++) {
  assert(data.adult[i].min === data.adult[i - 1].max, `adult 第${i}档 min 应等于第${i-1}档 max`)
}

if (errors.length) {
  console.error('校验失败:')
  errors.forEach(e => console.error(' - ' + e))
  process.exit(1)
}
console.log('✅ bmi.json 结构校验通过')
