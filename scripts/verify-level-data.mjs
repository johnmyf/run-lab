/**
 * 校验 src/data/level.json 结构完整性
 * 用法: node scripts/verify-level-data.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(path.join(root, 'src/data/level.json'), 'utf8'))

const PROJECTS = ['马拉松', '半程马拉松']
const GENDERS = ['男子', '女子']
const AGE_GROUPS = ['34岁以下', '35～39岁', '40～44岁', '45～49岁', '50～54岁', '55～59岁', '60～64岁', '65岁以上']
const MASS_LEVELS = ['大众二级', '大众一级', '大众精英']
const PRO_LEVELS = ['三级运动员', '二级运动员', '一级运动员', '运动健将', '国际健将']

const TIME_RE = /^\d{1,2}:\d{2}:\d{2}$/
const toSec = (s) => {
  const [h, m, sec] = s.split(':').map(Number)
  return h * 3600 + m * 60 + sec
}

const errors = []

for (const project of PROJECTS) {
  for (const gender of GENDERS) {
    const gd = data[project]?.[gender]
    if (!gd) { errors.push(`缺少 ${project}/${gender}`); continue }

    // 大众：逐级别逐年龄组，时间合法
    for (const level of MASS_LEVELS) {
      const byAge = gd['大众']?.[level]
      if (!byAge) { errors.push(`缺少 ${project}/${gender}/大众/${level}`); continue }
      for (const age of AGE_GROUPS) {
        const t = byAge[age]
        if (!t || !TIME_RE.test(t)) errors.push(`非法时间 ${project}/${gender}/${level}/${age}: ${t}`)
      }
    }

    // 专业：时间合法
    for (const level of PRO_LEVELS) {
      const t = gd['专业']?.[level]
      if (!t || !TIME_RE.test(t)) errors.push(`非法时间 ${project}/${gender}/专业/${level}: ${t}`)
    }

    // 大众同年龄组单调：大众二级 ≥ 大众一级 ≥ 大众精英（秒）
    for (const age of AGE_GROUPS) {
      const d2 = toSec(gd['大众']['大众二级']?.[age])
      const d1 = toSec(gd['大众']['大众一级']?.[age])
      const de = toSec(gd['大众']['大众精英']?.[age])
      if (!(d2 >= d1 && d1 >= de)) errors.push(`大众不单调 ${project}/${gender}/${age}: ${d2}/${d1}/${de}`)
    }

    // 大众跨年龄组单调：同级别下年龄越大秒数越不小于前一组
    for (const level of MASS_LEVELS) {
      const secs = AGE_GROUPS.map(a => toSec(gd['大众'][level]?.[a]))
      for (let i = 1; i < secs.length; i++) {
        if (secs[i] < secs[i - 1]) errors.push(`大众年龄组不单调 ${project}/${gender}/${level}: ${AGE_GROUPS[i - 1]}(${secs[i - 1]}) > ${AGE_GROUPS[i]}(${secs[i]})`)
      }
    }

    // 专业严格单调：三级 > 二级 > 一级 > 运动健将 > 国际健将（秒数递减 = 成绩更好）
    const proSecs = PRO_LEVELS.map(l => toSec(gd['专业']?.[l]))
    for (let i = 1; i < proSecs.length; i++) {
      if (!(proSecs[i] < proSecs[i - 1])) {
        errors.push(`专业不单调 ${project}/${gender}: ${PRO_LEVELS[i - 1]}(${proSecs[i - 1]}) <= ${PRO_LEVELS[i]}(${proSecs[i]})`)
      }
    }
  }
}

if (errors.length) {
  console.error('校验失败:')
  errors.forEach(e => console.error(' - ' + e))
  process.exit(1)
}
console.log('✅ level.json 校验通过')
