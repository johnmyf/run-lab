#[成绩预测]页面需求规格

##界面
{title}

你的跑力值VDOT为: {全局变量VDOT}

近期成绩预测
{subject["1500米"]}[跑步]成绩预测: {performance["1500米"]}
{subject["5公里"]}[跑步]成绩预测: {performance["5公里"]}
... 枚举所有subjcet, 查看后面subject枚举

训练配速建议
{TrainingPaceRecommendations}

按钮[分享]
按钮[返回首页]
按钮[重新评估]

##subject枚举
- 1500米
- 3 公里
- 5 公里
- 10 公里
- 15 公里
- 半程马拉松
- 马拉松

##[跑步]字样的显示规则
*subject="半程马拉松" 或 "马拉松" , 不显示"跑步", 其余subject枚举都紧接着"跑步"*

##训练配速建议模块
TrainingPaceRecommendations:
建设中, 稍后补充

##[分享]按钮
本页生成图片.png, 并长按下载

##[返回首页]
返回到首页

##[重新评估]
退回到[跑力值计算]页面










