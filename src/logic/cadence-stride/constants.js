/**
 * 步频步幅计算模块 — 常量配置
 * @module logic/cadence-stride/constants
 */

/** 计算项（三选一） */
export const MODE_OPTIONS = [
  { key: 'pace', label: '由步频和步幅计算配速' },
  { key: 'cadence', label: '由配速和步幅计算步频' },
  { key: 'stride', label: '由配速和步频计算步幅' },
]

/** 步频数值选择器：130~260，间隔 1（默认 180） */
export const CADENCE_RANGE = Array.from({ length: 131 }, (_, i) => String(130 + i))

/** 步幅数值选择器：整数部分 0~2 */
export const STRIDE_WHOLE_RANGE = ['0', '1', '2']

/** 步幅数值选择器：百分位小数，按整数部分动态限定（0→30~99，1→00~99，2→00~29） */
export const STRIDE_DECI_RANGES = {
  '0': Array.from({ length: 70 }, (_, i) => String(30 + i).padStart(2, '0')),
  '1': Array.from({ length: 100 }, (_, i) => String(i).padStart(2, '0')),
  '2': Array.from({ length: 30 }, (_, i) => String(i).padStart(2, '0')),
}

/** 默认步频：180 / 默认步幅：1.00（整数部分 1、百分位 00） */
export const DEFAULT_CADENCE = '180'
export const DEFAULT_STRIDE = [1, 0]

/** 配速 picker：分 2~19（2'00"~19'59"） */
export const PACE_MIN_RANGE = Array.from({ length: 18 }, (_, i) => String(i + 2))

/** 配速 picker：秒 00~59（最小间隔 1 秒） */
export const PACE_SEC_RANGE = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

/** 默认配速：6'00" */
export const DEFAULT_PACE = [6, 0]

/** 单位 */
export const CADENCE_UNIT = '步/分钟'
export const STRIDE_UNIT = '米'
export const PACE_UNIT = '/公里'

/** 输入提示语 */
export const HINT_TEXT = '输入完成后，直接出计算结果，无需点击按钮'

/** 附录内容（转录自 context_md/StrideLength_RunCadence_Pace.md，编号修正为 1/2/3） */
export const APPENDIX = [
  {
    title: '1. 步频（Cadence）',
    lines: [
      '定义：跑步时每分钟双脚落地的次数（通常计单脚或双脚？常见指双脚合计步数，即每分钟迈出的总步数，单位：步/分钟）。',
      '理想范围：多数优秀长跑运动员的步频在 170～190 步/分钟，新手常低于160。',
      '作用：高步频能减少垂直振幅，降低关节冲击，提高跑步经济性。但过高可能导致心率上升过快；过低则容易形成“跨步跑”，增加受伤风险。',
    ],
  },
  {
    title: '2. 步幅（Stride Length）',
    lines: [
      '定义：跑步时每迈出一步，两只脚落地之间的距离（单位：米）。更精确地说是同一只脚两次着地间的距离，但常用单步步长。',
      '影响因素：身高、腿部力量、髋关节灵活性、技术（如送髋、后蹬角度）。',
      '误区：并非越大越好。过度增大步幅往往导致“刹车效应”（脚落在身体前方），损伤膝盖和髋部。合理的步幅应与步频协调，由地面反作用力和推进效率决定。',
    ],
  },
  {
    title: '3. 配速（Pace）',
    lines: [
      '定义：完成单位距离所用的时间，通常表示为 分钟/公里 或 分钟/英里。例如“5分30秒/公里”。',
      '用途：衡量跑步强度、规划比赛策略、控制体能分配。',
      '与速度的关系：配速的倒数即为速度（公里/小时）。例如配速5分/公里对应12公里/小时。',
    ],
  },
  {
    title: '三者关系',
    lines: [
      '配速 = 1000 ÷（步频 × 步幅）（单位统一为米和分钟）',
      '相同配速下，不同跑者可能采用不同的步频-步幅组合（低步频大步幅 vs 高步频小步幅）。',
      '提升配速有两种途径：保持步频不变增大步幅，或保持步幅不变提高步频。通常建议优先优化步频至合理区间，再逐步增加步幅。',
    ],
  },
  {
    title: '训练建议',
    lines: [
      '新手：先稳定步频到170以上，避免跨步。',
      '进阶：通过力量训练（如臀腿爆发力）和柔韧性练习（如髋屈肌拉伸）自然增大步幅。',
      '配速训练：结合间歇跑、节奏跑等专项练习，找到个人最优的步频-步幅平衡点。',
    ],
  },
]
