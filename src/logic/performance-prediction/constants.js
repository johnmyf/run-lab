/**
 * 成绩预测模块 — 常量配置
 * @module logic/performance-prediction/constants
 */

/** 需要显示的7个 subject：与 sheet5-1.json 中的 key 完全对应 */
export const SUBJECTS = ['1500米', '3公里', '5公里', '10公里', '15公里', '半程马拉松', '马拉松']

/** 各 subject 对应的距离（公里），用于配速计算 */
export const DISTANCE_KM = {
  '1500米': 1.5,
  '3公里': 3,
  '5公里': 5,
  '10公里': 10,
  '15公里': 15,
  '半程马拉松': 21.0975,
  '马拉松': 42.195
}

/** 训练配速类型配置：顺序、标题、对应字段 */
export const TRAINING_CONFIG = [
  { type: 'easy', label: '轻松跑配速范围', field: 'EL1KMPace', isRange: true },
  { type: 'long', label: '长距离慢跑配速范围', field: 'EL1KMPace', isRange: true },
  { type: 'marathon', label: '马拉松配速跑配速', field: 'M1KMPace' },
  { type: 'threshold', label: '乳酸门槛跑配速', field: 'T1KMPace' },
  // 间歇跑系列
  { type: 'i400', label: '400米间歇跑用时', field: 'I400MPace' },
  { type: 'i800', label: '800米间歇跑用时', field: 'I1KMPace', formatter: 'i800' },
  { type: 'i1000', label: '1000米间歇跑用时及配速', field: 'I1KMPace' },
  { type: 'i1200', label: '1200米间歇跑用时', field: 'I1200MPace', formatter: 'i1200' },
  { type: 'i1600', label: '1.6公里间歇跑用时', field: 'I1.6KMPace', formatter: 'i1600' }
]

/** 重复跑优先级（从高到低） */
export const REPEAT_PRIORITY = [
  { type: 'repeat', key: 'R800MPace', label: '800米重复跑用时', distance: 800 },
  { type: 'repeat', key: 'R600MPace', label: '600米重复跑用时', distance: 600 },
  { type: 'repeat', key: 'R400MPace', label: '400米重复跑用时', distance: 400 },
  { type: 'repeat', key: 'R200MPace', label: '200米重复跑用时', distance: 200 }
]

/** 训练说明数据 */
export const README_CONTENT = {
  easy: { title: '轻松跑', text: '又叫E跑，日常有氧慢跑。体感轻松，呼吸均匀，可以边跑边聊天，能连续说出15字以上的句子，打有氧基础用。' },
  long: { title: '长距离慢跑', text: '又叫L跑或LSD，有氧跑的进阶，时间控制在90~150分钟，其它要求跟轻松跑一致，作用：让身体习惯长时间运动，增强耐力，同时磨炼心理。' },
  marathon: { title: '马拉松配速跑', text: '又叫节奏跑或M跑，比赛前模拟比赛节奏，熟悉比赛时的速度和体感，帮自己建立信心。训练作用不大，但赛前练几次很有必要。' },
  threshold: { title: '乳酸门槛跑', text: '又叫T跑，作用是提高身体清除乳酸的能力，让你在较快速度下坚持更久，腿不容易酸胀。体感是"舒适的难受"，比轻松跑累很多，但还能勉强说几个词，不能完整聊天。每次跑20~40分钟。' },
  interval: { title: '间歇跑', text: '又叫I跑，作用是大幅提升最大摄氧量，让你跑得更快、肺活量更大。做法：快跑几分钟（如3分钟），然后慢跑或走同样时间休息，重复多组。体感非常喘，基本说不出话。' },
  repeat: { title: '重复跑', text: '又叫R跑，作用是提高速度、步频和跑步效率，让你跑起来更省力。做法：短距离冲刺（如200米或400米），用最快速度跑完，然后完全休息（走路或站住直到心跳平复），再跑下一组。体感是全力爆发，但休息时间长，不会太痛苦。' }
}

/**
 * 生成成绩项目的显示标签
 * "[跑步]" 规则：半程马拉松和马拉松不显示，其余显示
 * @param {string} subject
 * @returns {string} 如 "1500米跑步" 或 "半程马拉松"
 */
export function getSubjectLabel(subject) {
  return subject + (subject !== '半程马拉松' && subject !== '马拉松' ? '跑步' : '')
}
