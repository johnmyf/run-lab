# 心率计算功能 — 设计规格

## 概述

为跑研社 (RunLab) 心率计算页面实现完整的最大心率估算与训练心率区间计算功能。用户输入年龄和性别，系统通过三种公式计算最大心率，并基于选中的最大心率展示五个训练心率区间。

## 文件结构

```
src/
├── logic/
│   └── heart-rate/
│       ├── constants.js      # 三种公式定义、训练区间配置、说明文案
│       └── calculator.js     # 计算函数（根据年龄/性别计算三种最大心率）
│
├── pages/
│   └── heart-rate/
│       └── index.vue         # 页面组件（UI + 状态管理）
```

遵循项目现有模式（`running-power` 也使用 `logic/running-power/` 分离业务逻辑）。

## 页面 UI 布局

采用项目统一模板：**绿色 header（#2ECC71）** + 可滚动内容区。

内容区从上到下四个区域：

### 区域 1 — 输入卡片
- 年龄输入框（数字键盘，限制 10-99 岁）
- 性别单选框：`男` / `女`（默认选中"男"）
- `[计算]` 按钮

### 区域 2 — 估算结果卡片（初始隐藏，计算后显示）
以 radio 单选框组展示三种公式计算结果，第一个默认选中：
- `传统公式: 最大心率 xxx 次/分钟`
- `Tanaka公式: 最大心率 xxx 次/分钟`
- `Gulati公式: 最大心率 xxx 次/分钟`

### 区域 3 — 心率训练区间卡片（初始隐藏，计算后显示）
五个区间按百分比从低到高排列，呈现为五个小卡片/行：

| 名称 | 百分比 | 说明 | 对应训练 | 心率范围（重点显示） |
|-----|--------|------|---------|----------------|
| 热身区 | 50-60% | 用于热身和恢复, 如快走。 | 轻松跑(E跑)的下限、跑前热身、跑后放松。 | from-to 次/分钟 |
| 燃脂区 | 60-70% | 基础有氧训练, 高效燃烧脂肪 如慢跑。 | 轻松跑(E跑)的主体区间。 | from-to 次/分钟 |
| 有氧耐力区 | 70-80% | 锻炼心肺功能, 提高肌肉使用氧气的能力。 | 长距离慢跑(L跑/LSD)、马拉松配速跑(M跑)。 | from-to 次/分钟 |
| 乳酸阈区 | 80-90% | 提高乳酸阈值, 增大最大摄氧量, 增强速度。 | 乳酸门槛跑(T跑)。 | from-to 次/分钟 |
| 无氧区 | 90-100% | 短时间高强度运动, 提高爆发力。 | 间歇跑(I跑)、重复跑(R跑)。 | from-to 次/分钟 |

- 范围计算公式：`from = Math.round(currentMaxHR × 下限%)`、`to = Math.round(currentMaxHR × 上限%)`
- 切换区域 2 的 radio 选择 → 区域 3 所有区间实时重算

### 区域 4 — 计算方法说明（始终可见）
带 `---` 分隔线的三个公式介绍块：
- **传统公式**: `220-年龄`，最常用的简单公式，适用于一般人群。
- **Tanaka公式**: `208-0.7×年龄`，研究表明更适合成年人，特别是老年人。
- **Gulati公式**: `208-0.7×年龄(男性)` / `206-0.88×年龄(女性)`，考虑性别差异，尤其适合女性。

## 数据流

```
用户输入年龄(10-99) + 选择性别
        ↓ 点击[计算]按钮
calcHeartRates(age, gender) → 三种最大心率
        ↓
显示区域2（radio组，默认选中"传统公式"）
        ↓
currentMaxHR = 选中的估算结果值
        ↓
五个训练区间按百分比计算 from/to
        ↓
切换 radio → currentMaxHR 更新 → 区间范围实时重算
```

## 状态管理

```js
// 响应式状态
const age = ref(null)              // 用户年龄，number
const gender = ref('男')           // 性别
const calculated = ref(false)      // 是否已计算（控制区域2/3的显示/隐藏）
const selectedIndex = ref(0)       // 选中的估算方法索引

// 派生计算
const maxHRResults: computed → [
  { name: '传统公式', formula: '220 - 年龄',        value: 220 - age },
  { name: 'Tanaka公式',  formula: '208 - 0.7×年龄',  value: round(208 - 0.7×age) },
  { name: 'Gulati公式',  formula: /* 性别相关 */,    value: /* 性别相关计算 */ },
]
const currentMaxHR: computed → maxHRResults[selectedIndex].value
```

## 公式详细定义（calculator.js）

```js
/**
 * 计算三种最大心率
 * @param {number} age - 年龄 (10-99)
 * @param {'男'|'女'} gender - 性别
 * @returns {Array<{name:string, formula:string, value:number}>}
 */
function calcHeartRates(age, gender) {
  return [
    { name: '传统公式',  formula: '220 - 年龄',           value: 220 - age },
    { name: 'Tanaka公式', formula: '208 - 0.7×年龄',       value: Math.round(208 - 0.7 * age) },
    { name: 'Gulati公式', formula: '208 - 0.7×年龄(男)/206 - 0.88×年龄(女)',
      value: Math.round(gender === '男' ? 208 - 0.7 * age : 206 - 0.88 * age) },
  ]
}
```

## 训练区间配置（constants.js）

```js
export const TRAINING_ZONES = [
  { name: '热身区',    range: [0.5, 0.6], desc: '用于热身和恢复, 如快走。',  training: '轻松跑(E跑)的下限、跑前热身、跑后放松。' },
  { name: '燃脂区',    range: [0.6, 0.7], desc: '基础有氧训练, 高效燃烧脂肪 如慢跑。', training: '轻松跑(E跑)的主体区间。' },
  { name: '有氧耐力区', range: [0.7, 0.8], desc: '锻炼心肺功能, 提高肌肉使用氧气的能力。', training: '长距离慢跑(L跑/LSD)、马拉松配速跑(M跑)。' },
  { name: '乳酸阈区',   range: [0.8, 0.9], desc: '提高乳酸阈值, 增大最大摄氧量, 增强速度。', training: '乳酸门槛跑(T跑)。' },
  { name: '无氧区',    range: [0.9, 1.0], desc: '短时间高强度运动, 提高爆发力。', training: '间歇跑(I跑)、重复跑(R跑)。' },
]
```

## 边缘情况处理

- **年龄超出 10-99**: 输入时做校验，超出显示 toast 提示，阻止计算
- **年龄为空**: 点击计算时校验，提示"请输入年龄"
- **计算值取整**: 使用 `Math.round()` 四舍五入
- **区间范围计算**: from/to 均使用 `Math.round()` 取整

## 遵循的项目约定

- 使用 uni-app 跨平台组件（`<view>`、`<text>`、`<input>`、`<radio>`）
- 使用 `rpx` 单位
- 页面导航使用 `uni.navigateTo`（来自九宫格）/ `uni.navigateBack`（返回按钮）
- 绿色 header 与九宫格色值一致（`#2ECC71`）
- `navigationStyle: "custom"` 已在 pages.json 中配置
