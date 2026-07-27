/**
 * 心率计算模块 — 常量配置
 * @module logic/heart-rate/constants
 */

/** 训练心率区间配置 */
export const TRAINING_ZONES = [
  {
    name: '热身区',
    range: [0.5, 0.6],
    desc: '用于热身和恢复, 如快走。',
    training: '轻松跑(E跑)的下限、跑前热身、跑后放松。'
  },
  {
    name: '燃脂区',
    range: [0.6, 0.7],
    desc: '基础有氧训练, 高效燃烧脂肪 如慢跑。',
    training: '轻松跑(E跑)的主体区间。'
  },
  {
    name: '有氧耐力区',
    range: [0.7, 0.8],
    desc: '锻炼心肺功能, 提高肌肉使用氧气的能力。',
    training: '长距离慢跑(L跑/LSD)、马拉松配速跑(M跑)。'
  },
  {
    name: '乳酸阈区',
    range: [0.8, 0.9],
    desc: '提高乳酸阈值, 增大最大摄氧量, 增强速度。',
    training: '乳酸门槛跑(T跑)。'
  },
  {
    name: '无氧区',
    range: [0.9, 1.0],
    desc: '短时间高强度运动, 提高爆发力。',
    training: '间歇跑(I跑)、重复跑(R跑)。'
  }
]

/** 三种估算方法的名称、说明文案、公式模板 */
export const METHODS = [
  {
    name: '传统公式',
    formula: '220 - 年龄',
    desc: '最常用的简单公式, 适用于一般人群。'
  },
  {
    name: 'Tanaka公式',
    formula: '208 - 0.7×年龄',
    desc: '研究表明更适合成年人, 特别是老年人。'
  },
  {
    name: 'Gulati公式',
    formula: '208 - 0.7×年龄(男性) / 206 - 0.88×年龄(女性)',
    desc: '考虑性别差异, 尤其适合女性。'
  }
]

/** 年龄输入限制 */
export const AGE_MIN = 10
export const AGE_MAX = 99
