/**
 * 校验 src/data/bmi.json 结构完整性
 * 用法: node scripts/verify-bmi.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  calcBMI, findAdultStatus, findRunnerLevel,
  getBoundaryWeights, getMarkerPosition, getSegments
} from '../src/logic/bmi/calculator.js'

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

// ===================== 算法测试 =====================
function eq(actual, expected, msg) {
  assert(actual === expected, `${msg}: 期望 ${expected}, 实际 ${actual}`)
}
function eqName(actual, expected, msg) {
  assert(actual?.name === expected, `${msg}: 期望 ${expected}, 实际 ${actual?.name}`)
}

// calcBMI
eq(calcBMI(65, 170), 22.5, 'calcBMI(65,170)')
eq(calcBMI(50, 160), 19.5, 'calcBMI(50,160)')
eq(calcBMI(70, 175), 22.9, 'calcBMI(70,175)')

// findAdultStatus（min 闭 / max 开）
eqName(findAdultStatus(16.0, data.adult), '偏瘦', '成人 16.0')
eqName(findAdultStatus(18.4, data.adult), '偏瘦', '成人 18.4')
eqName(findAdultStatus(18.5, data.adult), '正常', '成人 18.5（交界归下档）')
eqName(findAdultStatus(23.9, data.adult), '正常', '成人 23.9')
eqName(findAdultStatus(24.0, data.adult), '偏胖', '成人 24.0（交界归下档）')
eqName(findAdultStatus(28.0, data.adult), '肥胖', '成人 28.0（交界归下档）')
eqName(findAdultStatus(32.0, data.adult), '肥胖', '成人 32.0')

// findRunnerLevel（闭区间 + 重叠取高级 + 首档严格小于兜底）
const male = data.runnerLevels['男']
const female = data.runnerLevels['女']
eqName(findRunnerLevel(16.9, '男', data.runnerLevels), '需注意身体健康', '男 16.9')
eqName(findRunnerLevel(17.0, '男', data.runnerLevels), '世界顶尖精英', '男 17.0（17 归精英）')
eqName(findRunnerLevel(19.0, '男', data.runnerLevels), '世界顶尖精英', '男 19.0（重叠取更高级）')
eqName(findRunnerLevel(21.0, '男', data.runnerLevels), '大众精英/严肃跑者', '男 21.0（重叠取更高级）')
eqName(findRunnerLevel(21.5, '男', data.runnerLevels), '大众精英/严肃跑者', '男 21.5（大众含上界）')
eqName(findRunnerLevel(23.2, '男', data.runnerLevels), '健康完赛跑者', '男 23.2')
eqName(findRunnerLevel(23.5, '男', data.runnerLevels), '健康完赛跑者', '男 23.5（健康含上界）')
eqName(findRunnerLevel(26.0, '男', data.runnerLevels), '新手/健身跑者', '男 26.0')
eqName(findRunnerLevel(16.4, '女', data.runnerLevels), '需注意身体健康', '女 16.4')
eqName(findRunnerLevel(16.5, '女', data.runnerLevels), '世界顶尖精英', '女 16.5')
eqName(findRunnerLevel(18.5, '女', data.runnerLevels), '世界顶尖精英', '女 18.5（世界含上界）')
eqName(findRunnerLevel(20.3, '女', data.runnerLevels), '大众精英/严肃跑者', '女 20.3（重叠取更高级）')
eqName(findRunnerLevel(20.5, '女', data.runnerLevels), '大众精英/严肃跑者', '女 20.5')
eqName(findRunnerLevel(22.5, '女', data.runnerLevels), '健康完赛跑者', '女 22.5（健康含上界）')
eqName(findRunnerLevel(22.6, '女', data.runnerLevels), '新手/健身跑者', '女 22.6')

// getBoundaryWeights（170cm，h²=2.89）
const bw = getBoundaryWeights(170, data.adult)
assert(JSON.stringify(bw) === JSON.stringify([
  { bmi: 18.5, weightKg: 53 }, { bmi: 24.0, weightKg: 69 }, { bmi: 28.0, weightKg: 81 }
]), `getBoundaryWeights(170, adult): ${JSON.stringify(bw)}`)

// getMarkerPosition
eq(getMarkerPosition(18.5, 14, 32), 25, 'marker 18.5 on [14,32]')
eq(getMarkerPosition(40, 14, 32), 100, 'marker 越界 clamp 到 100')
eq(getMarkerPosition(10, 14, 32), 0, 'marker 越界 clamp 到 0')

// getSegments
const segsAdult = getSegments(data.adult, 14, 32)
assert(segsAdult.length === 4, 'adult 应有 4 段')
assert(segsAdult[0].start === 14 && segsAdult[0].end === 18.5, 'adult seg0 [14,18.5]')
assert(segsAdult[3].start === 28 && segsAdult[3].end === 32, 'adult seg3 [28,32]')
const segsMale = getSegments(male, 14, 30)
// getSegments 为通用函数，不按 visible 过滤（过滤由 HeatmapBar 组件负责），故全量数组为 5 段
assert(segsMale.length === 5, '跑者男应有 5 段')
assert(segsMale[0].start === 14 && segsMale[0].end === 17, '男 seg0 [14,17]')
assert(segsMale[3].start === 21.5 && segsMale[3].end === 23.5, '男 seg3 [21.5,23.5]')
assert(segsMale[4].start === 23.5 && segsMale[4].end === 30, '男 seg4 [23.5,30]')

if (errors.length) {
  console.error('校验失败:')
  errors.forEach(e => console.error(' - ' + e))
  process.exit(1)
}
console.log('✅ bmi.json 结构校验通过')
