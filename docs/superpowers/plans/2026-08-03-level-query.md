# [等级查询] 模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在跑研社新增[等级查询]模块：输入 项目/性别/最好成绩/年龄，按"成绩严格小于标准线"规则判定用户当前等级，并展示对应等级标准表。

**Architecture:** 数据层 `src/data/level.json`（项目→性别→{大众[分年龄组], 专业[固定值]}）；逻辑层 `src/logic/level-query/`（constants.js 常量与映射 + calculator.js 查询算法）；页面层 `src/pages/level-query/index.vue`；入口接入 `pages.json` 路由与首页九宫格。

**Tech Stack:** uni-app 3.0（Vue 3 Composition API, `<script setup>`）、Vite 5.2、微信小程序 + H5 双平台、html2canvas（H5 分享截图）。

## Global Constraints

- **达标规则（已确认）**：成绩**严格小于**标准线才算达到该级别；取所有达标级别中的**最高**者；全不达标时结果区显示 `"未达标任何级别,请继续努力!"`（存于常量 `NO_LEVEL_TEXT`）
- **级别枚举（由低到高）**：大众二级 → 大众一级 → 大众精英 → 三级运动员 → 二级运动员 → 一级运动员 → 运动健将 → 国际健将
- **显示名映射**：结果区 三级/二级/一级运动员 显示为 "(专业)三级运动员/(专业)二级运动员/(专业)一级运动员"，国际健将 显示为 "国家健将"；表格区用数据名
- **年龄组**（与 level.json 键完全一致，含全角 `～`）：`34岁以下, 35～39岁, 40～44岁, 45～49岁, 50～54岁, 55～59岁, 60～64岁, 65岁以上`；年龄 18~100
- **时间选择器范围**：时 0~6、分 00~59、秒 00~59；年龄选择器 18~100
- **数据来源**：`context_md/level-data.md` 全文转录，无换算无推导
- **页面规范**：顶部自定义 header 橙 `#F39C12`；CSS 单位 rpx；用 `<view>`/`<text>`；避免 `:hover`/`cursor:pointer`；表格区无论是否查询都显示，跟随所选 项目+性别
- **分享**：H5 条件编译 + `@/utils/share` 的 `captureAndShare`，分享时隐藏操作按钮（`v-show="!sharing"`）并展开表格（`.table-body-expand`）；非 H5 toast "请在浏览器中打开使用分享功能"
- **入口**：九宫格插入在 [跑步课表] **之前**；新增 `colorClass: 'orange'`（背景 `#F39C12`）

---
## 文件结构

| 文件 | 职责 |
| --- | --- |
| `src/data/level.json` | 等级数据（唯一数据源） |
| `scripts/verify-level-data.mjs` | 数据完整性自动化校验（Node 直跑，无需测试框架） |
| `src/logic/level-query/constants.js` | 常量、年龄组映射、显示名映射、picker 范围 |
| `src/logic/level-query/calculator.js` | `queryLevel()` 查询算法（数据作参数传入，参照 vdot.js 的 `getVDOT(subject, pbs, vdotMap)` 模式） |
| `src/pages/level-query/index.vue` | 等级查询页面 |
| `src/pages.json` | 注册路由 |
| `src/pages/index/index.vue` | 首页九宫格入口 |

> **测试说明**：项目无测试框架（package.json 无 test script、无 vitest/jest 配置），且现有逻辑模块用 `@/` 别名与 extensionless 导入、无法被 Node 直接加载。因此逻辑验证采用：数据层用 Node 脚本自动化校验，查询逻辑用 dev-server 手动验收（与 pace-calculator/finish-time 等现有模块一致）。

---

## Task 1: 等级数据文件 + 数据校验脚本

**Files:**
- Create: `src/data/level.json`
- Create: `scripts/verify-level-data.mjs`

**Interfaces:**
- Produces: `level.json` 结构 — `{ [项目]: { [性别]: { '大众': { [级别]: { [年龄组]: "H:MM:SS" } }, '专业': { [级别]: "H:MM:SS" } } } }`。后续 calculator.js 与页面均直接消费此结构。

- [ ] **Step 1: 创建 `src/data/level.json`**

数据全文转录自 `context_md/level-data.md`（年龄组键含全角 `～`，勿改动）：

```json
{
  "马拉松": {
    "男子": {
      "大众": {
        "大众二级": {
          "34岁以下": "4:00:00", "35～39岁": "4:10:00", "40～44岁": "4:15:00", "45～49岁": "4:20:00",
          "50～54岁": "4:30:00", "55～59岁": "4:40:00", "60～64岁": "4:50:00", "65岁以上": "5:00:00"
        },
        "大众一级": {
          "34岁以下": "3:30:00", "35～39岁": "3:40:00", "40～44岁": "3:45:00", "45～49岁": "3:50:00",
          "50～54岁": "4:00:00", "55～59岁": "4:10:00", "60～64岁": "4:20:00", "65岁以上": "4:30:00"
        },
        "大众精英": {
          "34岁以下": "3:00:00", "35～39岁": "3:10:00", "40～44岁": "3:15:00", "45～49岁": "3:20:00",
          "50～54岁": "3:30:00", "55～59岁": "3:40:00", "60～64岁": "3:50:00", "65岁以上": "4:00:00"
        }
      },
      "专业": {
        "三级运动员": "3:00:00", "二级运动员": "2:51:30", "一级运动员": "2:31:10",
        "运动健将": "2:19:20", "国际健将": "2:12:50"
      }
    },
    "女子": {
      "大众": {
        "大众二级": {
          "34岁以下": "4:20:00", "35～39岁": "4:30:00", "40～44岁": "4:35:00", "45～49岁": "4:40:00",
          "50～54岁": "4:50:00", "55～59岁": "5:00:00", "60～64岁": "5:20:00", "65岁以上": "5:30:00"
        },
        "大众一级": {
          "34岁以下": "3:50:00", "35～39岁": "4:00:00", "40～44岁": "4:05:00", "45～49岁": "4:10:00",
          "50～54岁": "4:20:00", "55～59岁": "4:30:00", "60～64岁": "4:50:00", "65岁以上": "5:00:00"
        },
        "大众精英": {
          "34岁以下": "3:20:00", "35～39岁": "3:30:00", "40～44岁": "3:35:00", "45～49岁": "3:40:00",
          "50～54岁": "3:50:00", "55～59岁": "4:00:00", "60～64岁": "4:20:00", "65岁以上": "4:30:00"
        }
      },
      "专业": {
        "三级运动员": "3:32:50", "二级运动员": "3:20:40", "一级运动员": "3:08:40",
        "运动健将": "2:39:20", "国际健将": "2:33:20"
      }
    }
  },
  "半程马拉松": {
    "男子": {
      "大众": {
        "大众二级": {
          "34岁以下": "1:55:00", "35～39岁": "2:00:00", "40～44岁": "2:02:00", "45～49岁": "2:05:00",
          "50～54岁": "2:10:00", "55～59岁": "2:15:00", "60～64岁": "2:20:00", "65岁以上": "2:25:00"
        },
        "大众一级": {
          "34岁以下": "1:35:00", "35～39岁": "1:40:00", "40～44岁": "1:42:00", "45～49岁": "1:45:00",
          "50～54岁": "1:50:00", "55～59岁": "1:55:00", "60～64岁": "2:00:00", "65岁以上": "2:05:00"
        },
        "大众精英": {
          "34岁以下": "1:25:00", "35～39岁": "1:30:00", "40～44岁": "1:32:00", "45～49岁": "1:35:00",
          "50～54岁": "1:40:00", "55～59岁": "1:45:00", "60～64岁": "1:50:00", "65岁以上": "1:55:00"
        }
      },
      "专业": {
        "三级运动员": "1:21:30", "二级运动员": "1:17:30", "一级运动员": "1:11:30",
        "运动健将": "1:06:00", "国际健将": "1:02:50"
      }
    },
    "女子": {
      "大众": {
        "大众二级": {
          "34岁以下": "2:05:00", "35～39岁": "2:10:00", "40～44岁": "2:12:00", "45～49岁": "2:15:00",
          "50～54岁": "2:20:00", "55～59岁": "2:25:00", "60～64岁": "2:35:00", "65岁以上": "2:40:00"
        },
        "大众一级": {
          "34岁以下": "1:40:00", "35～39岁": "1:50:00", "40～44岁": "1:52:00", "45～49岁": "1:55:00",
          "50～54岁": "2:00:00", "55～59岁": "2:05:00", "60～64岁": "2:15:00", "65岁以上": "2:20:00"
        },
        "大众精英": {
          "34岁以下": "1:35:00", "35～39岁": "1:40:00", "40～44岁": "1:42:00", "45～49岁": "1:45:00",
          "50～54岁": "1:50:00", "55～59岁": "1:55:00", "60～64岁": "2:05:00", "65岁以上": "2:10:00"
        }
      },
      "专业": {
        "三级运动员": "1:38:25", "二级运动员": "1:33:35", "一级运动员": "1:30:05",
        "运动健将": "1:15:35", "国际健将": "1:12:15"
      }
    }
  }
}
```

- [ ] **Step 2: 创建 `scripts/verify-level-data.mjs`**

校验：结构键齐全、时间格式合法、大众级别随年龄单调不增（年龄越大成绩越慢=秒数越大）、专业级别严格由三级→国际健将递减、大众跨年龄组秒数单调不减。

```js
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
```

- [ ] **Step 3: 运行校验脚本，确认通过**

Run: `node scripts/verify-level-data.mjs`
Expected: 输出 `✅ level.json 校验通过`，退出码 0。

- [ ] **Step 4: 提交**

```bash
git add src/data/level.json scripts/verify-level-data.mjs
git commit -m "feat: 新增等级查询数据表 level.json 与数据校验脚本"
```

---

## Task 2: 等级查询常量与查询算法

**Files:**
- Create: `src/logic/level-query/constants.js`
- Create: `src/logic/level-query/calculator.js`

**Interfaces:**
- Consumes: `level.json` 结构（Task 1）
- Produces:
  - `getAgeGroup(age: number): string` — 年龄 → 年龄组 key
  - `getLevelDisplayName(level: string): string` — 级别 key → 显示名（含 "(专业)" 前缀与 国际健将→国家健将）
  - `queryLevel({ project, gender, age, totalSeconds }, levelData): string|null` — 返回最高达标级别 key，全不达标返回 `null`

- [ ] **Step 1: 创建 `src/logic/level-query/constants.js`**

```js
/**
 * 等级查询模块 — 常量配置
 * @module logic/level-query/constants
 */

/** 项目 */
export const PROJECTS = ['马拉松', '半程马拉松']

/** 性别 */
export const GENDERS = ['男子', '女子']

/** 年龄组（与 level.json 键完全对应，含全角 ～） */
export const AGE_GROUPS = [
  '34岁以下', '35～39岁', '40～44岁', '45～49岁',
  '50～54岁', '55～59岁', '60～64岁', '65岁以上'
]

/** 大众级别（按年龄组分档），由低到高 */
export const MASS_LEVELS = ['大众二级', '大众一级', '大众精英']

/** 专业级别（固定值，不分年龄），由低到高 */
export const PRO_LEVELS = ['三级运动员', '二级运动员', '一级运动员', '运动健将', '国际健将']

/** 全部级别由低到高（查询遍历顺序） */
export const LEVELS_LOW_TO_HIGH = [...MASS_LEVELS, ...PRO_LEVELS]

/** 全不达标时的提示文案 */
export const NO_LEVEL_TEXT = '未达标任何级别,请继续努力!'

/** 结果区显示名映射：专业等级加"(专业)"前缀，国际健将→国家健将 */
const LEVEL_DISPLAY_NAMES = {
  '三级运动员': '(专业)三级运动员',
  '二级运动员': '(专业)二级运动员',
  '一级运动员': '(专业)一级运动员',
  '运动健将': '运动健将',
  '国际健将': '国家健将'
}

/**
 * 级别显示名（表格用数据名，结果区用此映射后的名字）
 * @param {string} level - 级别 key（如 '国际健将'）
 * @returns {string} 如 '国家健将' 或 '(专业)三级运动员'
 */
export function getLevelDisplayName(level) {
  if (!level) return ''
  return LEVEL_DISPLAY_NAMES[level] || level
}

/**
 * 年龄 → 年龄组
 * @param {number} age - 18~100
 * @returns {string} 年龄组 key
 */
export function getAgeGroup(age) {
  if (age <= 34) return '34岁以下'
  if (age <= 39) return '35～39岁'
  if (age <= 44) return '40～44岁'
  if (age <= 49) return '45～49岁'
  if (age <= 54) return '50～54岁'
  if (age <= 59) return '55～59岁'
  if (age <= 64) return '60～64岁'
  return '65岁以上'
}

/** 时间选择器：时 0~6 */
export const HOUR_RANGE = Array.from({ length: 7 }, (_, i) => String(i))

/** 分/秒选择器：00~59 */
export const MIN_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 年龄选择器：18~100 */
export const AGE_RANGE = Array.from({ length: 83 }, (_, i) => String(i + 18))
```

- [ ] **Step 2: 创建 `src/logic/level-query/calculator.js`**

```js
/**
 * 等级查询模块 — 查询算法
 * @module logic/level-query/calculator
 */
import { parseTimeToSeconds } from '@/utils/time'
import { getAgeGroup, LEVELS_LOW_TO_HIGH, MASS_LEVELS } from './constants'

/**
 * 查询用户当前等级：成绩严格小于标准线才算达标，取达标中级别最高者
 * @param {Object} params
 * @param {string} params.project - 项目：'马拉松' | '半程马拉松'
 * @param {string} params.gender - 性别：'男子' | '女子'
 * @param {number} params.age - 年龄 18~100
 * @param {number} params.totalSeconds - 最好成绩（总秒数，>0）
 * @param {Object} levelData - level.json 数据（页面从 @/data/level.json 导入传入）
 * @returns {string|null} 级别 key；全不达标返回 null
 */
export function queryLevel(params, levelData) {
  const { project, gender, age, totalSeconds } = params
  const genderData = levelData?.[project]?.[gender]
  if (!genderData || !totalSeconds || totalSeconds <= 0) return null

  const ageGroup = getAgeGroup(age)
  let result = null

  // 由低到高遍历；达标则覆盖 result，最终 result 为最高达标级别
  for (const level of LEVELS_LOW_TO_HIGH) {
    let standardStr
    if (MASS_LEVELS.includes(level)) {
      standardStr = genderData['大众']?.[level]?.[ageGroup]
    } else {
      standardStr = genderData['专业']?.[level]
    }
    if (!standardStr) continue

    const standardSeconds = parseTimeToSeconds(standardStr)
    if (totalSeconds < standardSeconds) {
      result = level
    }
  }
  return result
}
```

- [ ] **Step 3: 逻辑复核（对照规格三用例，人工推演）**

在提交前逐行确认 calculator.js 逻辑与以下推演一致（无需运行，代码路径即上述实现）：

| 输入 | 推演 | 期望返回 |
| --- | --- | --- |
| 马拉松/男子/33岁/2:59:59(=10799s) | 大众精英 3:00:00(10800)→10799<10800 ✓；专业三级 3:00:00→✓；专业二级 2:51:30(10290)→10799<10290 ✗ | `'三级运动员'` |
| 马拉松/男子/33岁/3:00:00(=10800s) | 大众精英 3:00:00→10800<10800 ✗；专业三级 3:00:00→✗；大众一级 3:30:00(12600)→10800<12600 ✓；专业二级→✗ | `'大众一级'` |
| 马拉松/男子/65岁/5:59:59(=21599s) | 最高大众二级标准 5:00:00(18000)→21599<18000 ✗；其余全 ✗ | `null` |

- [ ] **Step 4: 提交**

```bash
git add src/logic/level-query/constants.js src/logic/level-query/calculator.js
git commit -m "feat: 新增等级查询常量与查询算法"
```

---

## Task 3: 等级查询页面 + 路由 + 九宫格入口

**Files:**
- Create: `src/pages/level-query/index.vue`
- Modify: `src/pages.json`（新增路由）
- Modify: `src/pages/index/index.vue`（插入九宫格项 + 新增 orange 配色）

**Interfaces:**
- Consumes: Task 1 `level.json`、Task 2 `PROJECTS/GENDERS/AGE_GROUPS/AGE_RANGE/HOUR_RANGE/MIN_SEC_RANGE/getAgeGroup/getLevelDisplayName/queryLevel/NO_LEVEL_TEXT`
- Produces: 可在 H5 与微信小程序中打开的 `/pages/level-query/index` 页面

- [ ] **Step 1: 创建 `src/pages/level-query/index.vue`**

完整页面（橙 `#F39C12` 主题，分享/返回首页/重新录入齐全）：

```vue
<template>
  <view class="page-container">
    <!-- 顶部 Header #F39C12 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack">
        <text>←</text>
      </view>
      <text class="header-title">等级查询</text>
    </view>

    <view class="content-wrapper">
      <!-- 项目 -->
      <view class="section">
        <text class="section-label">项目</text>
        <view class="chip-options">
          <view
            v-for="p in PROJECTS"
            :key="p"
            class="chip"
            :class="{ active: project === p }"
            @click="selectProject(p)"
          >
            <text>{{ p }}</text>
          </view>
        </view>
      </view>

      <!-- 性别 -->
      <view class="section">
        <text class="section-label">性别</text>
        <view class="chip-options">
          <view
            v-for="g in GENDERS"
            :key="g"
            class="chip"
            :class="{ active: gender === g }"
            @click="selectGender(g)"
          >
            <text>{{ g }}</text>
          </view>
        </view>
      </view>

      <!-- 最好成绩 -->
      <view class="section">
        <text class="section-label">最好成绩</text>
        <picker
          mode="multiSelector"
          :range="timePicker.ranges"
          :value="timePicker.selected"
          @columnchange="onColumnChange"
          @change="onTimeChange"
        >
          <view class="time-display">
            <text>{{ timePicker.ranges[0][timePicker.selected[0]] }}时</text>
            <text>{{ timePicker.ranges[1][timePicker.selected[1]] }}分</text>
            <text>{{ timePicker.ranges[2][timePicker.selected[2]] }}秒</text>
          </view>
        </picker>
      </view>

      <!-- 年龄 -->
      <view class="section">
        <text class="section-label">年龄</text>
        <picker mode="selector" :range="AGE_RANGE" :value="ageIndex" @change="onAgeChange">
          <view class="age-display">
            <text>{{ AGE_RANGE[ageIndex] }}岁</text>
          </view>
        </picker>
      </view>

      <button class="query-btn" @click="query">查询</button>

      <!-- 结果区（查询后显示） -->
      <view v-if="hasQuery" class="result-card">
        <text class="result-label">你的级别</text>
        <text class="result-value">{{ resultDisplay }}</text>
        <text v-if="!resultLevel" class="result-encourage">{{ NO_LEVEL_TEXT }}</text>
      </view>

      <!-- 表格区（无论是否查询都显示，跟随所选 项目+性别） -->
      <view class="table-card">
        <text class="table-title">专业运动员等级标准</text>
        <view class="table-header-row">
          <text class="col-level">级别</text>
          <text class="col-time">成绩</text>
        </view>
        <view :class="['table-body', { 'table-body-expand': sharing }]">
          <view class="table-row" v-for="row in proTable" :key="row.level">
            <text class="col-level">{{ row.displayName }}</text>
            <text class="col-time">{{ row.time }}</text>
          </view>
        </view>
      </view>

      <view class="table-card">
        <text class="table-title">大众等级标准</text>
        <view class="table-header-row">
          <text class="col-age">年龄组</text>
          <text class="col-level-time">大众精英</text>
          <text class="col-level-time">大众一级</text>
          <text class="col-level-time">大众二级</text>
        </view>
        <view :class="['table-body', { 'table-body-expand': sharing }]">
          <view class="table-row" v-for="ageGroup in AGE_GROUPS" :key="ageGroup">
            <text class="col-age">{{ ageGroup }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众精英') }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众一级') }}</text>
            <text class="col-level-time">{{ massTime(ageGroup, '大众二级') }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons" v-show="!sharing">
        <button class="btn btn-share" @click="shareResult">分享</button>
        <button class="btn btn-home" @click="goHome">返回首页</button>
        <button class="btn btn-reset" @click="resetInputs">重新录入</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
// #ifdef H5
import { captureAndShare } from '@/utils/share'
// #endif
import levelData from '@/data/level.json'
import {
  PROJECTS, GENDERS, AGE_GROUPS, AGE_RANGE,
  HOUR_RANGE, MIN_SEC_RANGE, NO_LEVEL_TEXT,
  getLevelDisplayName,
} from '@/logic/level-query/constants'
import { queryLevel } from '@/logic/level-query/calculator'

// ==================== 选择器状态 ====================

const project = ref('马拉松')
const gender = ref('男子')

const timePicker = reactive({
  ranges: [HOUR_RANGE, MIN_SEC_RANGE, MIN_SEC_RANGE],
  selected: [3, 0, 0], // 默认 3:00:00
})

const ageIndex = ref(AGE_RANGE.indexOf('30')) // 默认 30 岁
const sharing = ref(false)

// ==================== 查询状态 ====================

const resultLevel = ref(null) // 达标级别 key；null 表示无达标
const hasQuery = ref(false)

const resultDisplay = computed(() =>
  resultLevel.value ? getLevelDisplayName(resultLevel.value) : NO_LEVEL_TEXT
)

// ==================== 表格数据 ====================

/** 专业表：由高到低显示（国际健将 → 三级运动员） */
const proTable = computed(() => {
  const pro = levelData[project.value]?.[gender.value]?.['专业'] || {}
  const order = ['国际健将', '运动健将', '一级运动员', '二级运动员', '三级运动员']
  return order.map(level => ({
    level,
    displayName: getLevelDisplayName(level),
    time: pro[level] || '—'
  }))
})

function massTime(ageGroup, level) {
  return levelData[project.value]?.[gender.value]?.['大众']?.[level]?.[ageGroup] || '—'
}

// ==================== 方法 ====================

function selectProject(p) {
  project.value = p
  resultLevel.value = null
  hasQuery.value = false
}

function selectGender(g) {
  gender.value = g
  resultLevel.value = null
  hasQuery.value = false
}

function onColumnChange(e) {
  const { column, value } = e.detail
  timePicker.selected[column] = value
}

function onTimeChange(e) {
  timePicker.selected = e.detail.value
}

function onAgeChange(e) {
  ageIndex.value = e.detail.value
}

function query() {
  const [h, m, s] = timePicker.selected
  const totalSeconds = h * 3600 + m * 60 + s
  if (totalSeconds <= 0) {
    uni.showToast({ title: '请设置有效成绩', icon: 'none' })
    return
  }
  const age = Number(AGE_RANGE[ageIndex.value])
  resultLevel.value = queryLevel(
    { project: project.value, gender: gender.value, age, totalSeconds },
    levelData
  )
  hasQuery.value = true
}

function resetInputs() {
  project.value = '马拉松'
  gender.value = '男子'
  timePicker.selected = [3, 0, 0]
  ageIndex.value = AGE_RANGE.indexOf('30')
  resultLevel.value = null
  hasQuery.value = false
  uni.pageScrollTo({ scrollTop: 0, duration: 300 })
}

function navigateBack() {
  uni.navigateBack()
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

// 分享（H5 截图 + 二维码）
async function shareResult() {
  // #ifndef H5
  uni.showToast({ title: '请在浏览器中打开使用分享功能', icon: 'none' })
  return
  // #endif

  sharing.value = true
  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  try {
    const el = document.querySelector('.page-container')
    const ok = await captureAndShare(el, { prefix: '等级查询' })
    if (!ok) throw new Error('captureAndShare failed')
  } catch (e) {
    uni.showToast({ title: '分享失败', icon: 'none' })
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
}
.content-wrapper {
  padding: 30rpx;
}

/* 顶栏 */
.header {
  height: 160rpx;
  background: #F39C12;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  position: relative;
}
.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}
.back-btn text {
  color: #FFF;
  font-size: 40rpx;
}
.header-title {
  color: #FFF;
  font-size: 40rpx;
  font-weight: bold;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* 卡片区 */
.section {
  background: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
.section-label {
  font-size: 28rpx;
  color: #2C3E50;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

/* chips */
.chip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.chip {
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  border: 2rpx solid #BDC3C7;
  font-size: 26rpx;
  color: #7F8C8D;
}
.chip.active {
  background: #F39C12;
  border-color: #F39C12;
  color: #FFF;
}

/* 时间/年龄显示 */
.time-display,
.age-display {
  display: flex;
  justify-content: center;
  gap: 30rpx;
  padding: 28rpx 50rpx;
  background: #FFF7EB;
  border-radius: 16rpx;
  border: 2rpx solid #E8D8C0;
}
.time-display text,
.age-display text {
  font-size: 40rpx;
  font-weight: bold;
  color: #2C3E50;
}

/* 查询按钮 */
.query-btn {
  width: 100%;
  height: 88rpx;
  background: #F39C12;
  color: #FFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(243, 156, 18, 0.4);
}

/* 结果卡 */
.result-card {
  background: linear-gradient(135deg, #F39C12, #E67E22);
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(243, 156, 18, 0.3);
}
.result-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26rpx;
  display: block;
  margin-bottom: 12rpx;
}
.result-value {
  color: #FFF;
  font-size: 48rpx;
  font-weight: bold;
  display: block;
}
.result-encourage {
  color: rgba(255, 255, 255, 0.95);
  font-size: 26rpx;
  display: block;
  margin-top: 12rpx;
  line-height: 1.6;
}

/* 表格卡 */
.table-card {
  background: #FFF;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 30rpx;
}
.table-title {
  font-size: 30rpx;
  color: #2C3E50;
  font-weight: bold;
  padding: 24rpx 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
  display: block;
}
.table-header-row {
  display: flex;
  padding: 18rpx 30rpx;
  background: #F39C12;
  color: #FFF;
  font-size: 26rpx;
  font-weight: bold;
}
.table-body {
  max-height: 700rpx;
  overflow-y: auto;
}
.table-body-expand {
  max-height: none;
  overflow-y: visible;
}
.table-row {
  display: flex;
  padding: 18rpx 30rpx;
  border-bottom: 2rpx solid #F0F0F0;
  font-size: 26rpx;
  color: #2C3E50;
}
.table-row:last-child {
  border-bottom: none;
}
.col-level {
  width: 50%;
}
.col-time {
  width: 50%;
  text-align: right;
}
.col-age {
  width: 40%;
}
.col-level-time {
  width: 20%;
  text-align: center;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 30rpx 0 60rpx;
}
.action-buttons .btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-share {
  background: #F39C12;
  color: #FFF;
}
.btn-home {
  background: #2C3E50;
  color: #FFF;
}
.btn-reset {
  background: #ECF0F1;
  color: #2C3E50;
}
</style>
```

- [ ] **Step 2: 在 `src/pages.json` 注册路由**

在 `pages/pace-calculator/index` 路由项之后、`pages/finish-time/index` 路由项之前插入（保持与九宫格顺序一致）：

```json
    {
      "path": "pages/level-query/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
```

即 `pages` 数组变为：`... pages/pace-calculator/index, pages/level-query/index, pages/finish-time/index, ...`。

- [ ] **Step 3: 在 `src/pages/index/index.vue` 插入九宫格入口**

将 `menuItems` 数组改为（等级查询插在[跑步课表]之前，跑步课表 id 由 6 改为 7）：

```js
const menuItems = [
  { id: 1, title: '跑力值计算', icon: '⚡', colorClass: 'blue', path: '/pages/running-power/index' },
  { id: 2, title: '成绩预测', icon: '🏆', colorClass: 'red', path: '/pages/performance-prediction/index' },
  { id: 3, title: '心率计算', icon: '❤️', colorClass: 'green', path: '/pages/heart-rate/index' },
  { id: 4, title: '配速计算器', icon: '⏱️', colorClass: 'cyan', path: '/pages/pace-calculator/index' },
  { id: 5, title: '完赛时间计算', icon: '🏁', colorClass: 'pink', path: '/pages/finish-time/index' },
  { id: 6, title: '等级查询', icon: '🥇', colorClass: 'orange', path: '/pages/level-query/index' },
  { id: 7, title: '跑步课表', icon: '📅', colorClass: 'purple', path: '/pages/training-schedule/index' },
  { id: 8, title: '成就体系', icon: '🏅', colorClass: 'teal', path: '/pages/achievement/index' },
  { id: 9, title: '待开发', icon: '🔜', colorClass: 'gray', path: '' }
]
```

在 `.grid-item.teal { background: #1ABC9C; }` 之后新增一行：

```css
.grid-item.orange { background: #F39C12; }
```

- [ ] **Step 4: dev-server 手动验收**

Run: `npm run dev:h5`（终端会输出访问 URL，浏览器打开首页 → 点击[等级查询]）。

逐项确认：

1. 首页九宫格：新增[等级查询]在第2行第3列（跑步课表移至第3行第1列），橙色卡片，点击进入等级查询页
2. 页面默认值：项目=马拉松、性别=男子、成绩=3时0分0秒、年龄=30岁；结果区**不显示**
3. 表格区始终显示：专业表 5 行（国际健将 2:12:50 → 三级运动员 3:00:00）+ 大众表 8 行（年龄组 × 大众精英/大众一级/大众二级），数值与 level.json 一致
4. 用例1：项目=马拉松、性别=男子、成绩=2:59:59、年龄=33 → 点击[查询] → 结果区显示 **你的级别 (专业)三级运动员**
5. 用例2：成绩=3:00:00 → 点击[查询] → 显示 **你的级别 大众一级**
6. 用例3：年龄=65、成绩=5:59:59 → 显示 **你的级别 未达标任何级别,请继续努力!**
7. 切换 性别=女子 → 专业表/大众表数值与 level.json 女子列一致；再次查询结果按女子标准
8. [重新录入]：输入重置为默认、结果区隐藏、页面滚回顶部
9. [返回首页]：回到首页（tabBar switchTab）
10. [分享]：触发浏览器下载 `等级查询.png`（截图含结果区与完整展开表格）
11. 修改 项目/性别 时结果区自动隐藏（未重新查询前不显示旧结果）

- [ ] **Step 5: 提交**

```bash
git add src/pages/level-query/index.vue src/pages.json src/pages/index/index.vue
git commit -m "feat: 新增等级查询页面、路由与九宫格入口"
```

---

## Task 4: 双平台构建验证

**Files:**
- 无改动（仅验证）

- [ ] **Step 1: H5 生产构建**

Run: `npm run build:h5`
Expected: 构建成功，`dist/build/h5` 生成，无报错（如无 `dist` 目录说明构建输出到默认路径，以实际为准）。

- [ ] **Step 2: 微信小程序生产构建**

Run: `npm run build:mp-weixin`
Expected: 构建成功，`dist/build/mp-weixin` 生成，无报错。

- [ ] **Step 3: 确认 `scripts/prepare-deploy.sh` 生成的部署产物（如适用）**

`postbuild:h5` 会自动运行 `scripts/prepare-deploy.sh`；若构建通过且无报错即可。若该脚本依赖特定文件，按脚本自身逻辑处理。

---

## Self-Review 结论（编写时已核对）

- **规格覆盖**：数据文件（Task1）、逻辑（Task2）、页面/路由/入口（Task3）、构建（Task4）逐一对应设计文档第 3~6 节；无达标文案、显示名映射、严格小于规则、表格常显、分享、返回首页、重新录入均落在 Task3 验收清单
- **占位符扫描**：无 TBD/TODO，所有代码步骤含完整实现
- **类型一致性**：`queryLevel(params, levelData)` 参数顺序在全计划一致（params 在前、levelData 在后）；`getAgeGroup`/`getLevelDisplayName` 签名在 Task2 定义、Task3 消费一致；`level.json` 键（含全角 `～`）在 Task1/constants.js/页面三处保持一致
