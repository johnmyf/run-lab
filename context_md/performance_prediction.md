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

##成绩预测
获取sheet5-1.json数据, 赋值为二元数组 vdot_map[vdot][subject]
vdot为{全局变量VDOT}, 为[跑力值计算]的结果.
取得的vdot_map[vdot][subject], 就是该项目的预测成绩

##补充sheet5-1.json
把文件 "data-resources/表5-1, 与常见距离的比赛时间相对应的 VDOT 值.md"  的表格转换为 "sheet5-1.json"
这里 .md文件包含了不同subject, 但sheet5-1.json只少量包含了几个subject, 需补充全sheet5-1.json内所有subject的数据. 
subject="1500米" / "3公里" 可以直接从新的sheet5-1.json获取






