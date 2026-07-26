#跑力值计算页面需求规格

##界面示意图
{title}
{description}
5公里最好成绩: input: {mm:ss}, mm为分钟选择器, 选择范围为0~59; ss为秒选择器,选择范围为0~59 
10公里最好成绩: input: {h:mm:ss} , 其中h表示小时, 选择范围为: 0~1
15公里最好成绩: input: {h:mm:ss} , 其中h表示小时, 选择范围为: 0~2
半程马拉松最好成绩: input: {h:mm:ss} , 其中h表示小时, 选择范围为: 0~3
马拉松最好成绩: input: {h:mm:ss} , 其中h表示小时, 选择范围为: 0~6
"重置"按钮 / "确定"按钮

##界面定义
- 1. tile = "跑力值计算"
- 2. desc = "输入近期(最好是3个月内) 5公里、10公里、15公里、半程马拉松、马拉松 各项的最快跑步成绩(输入越多越准), 从而推算出你的跑力值(VDOT), 我们再据此推算出你近期可达到的理论成绩, 以及训练要求."
- 3. 用户点击"确定"按钮后, 需检查输入有效性: 5公里最好成绩 / 15公里最好成绩 / 半程马拉松最好成绩 / 马拉松最好成绩 4项数值至少输入一项, 如果都不输入, 弹出提示框: "请输入最少一项的有效成绩" 按钮: 1. 按钮"好的", 2. 按钮:填入全马破三.  如果符合输入要求, 则进入[VDOT推算]
- 4. 点击"重置"按钮: 则所有输入全部置空
- 5. 点击:"好的"按钮: 继续输入
- 6. 点击:"填入全马破三"按钮: 填入全马成绩"2:58:47", 进入[VDOT推算]

##子任务1: VDOT计算表
把文件 data-resources/表5-1, 与常见距离的比赛时间相对应的 VDOT 值.md 的表格转换为 "sheet5-1.json", 可以由js加载.  其中, 值为时间, 格式为"hh:mm:ss" hh代表小时, mm代表分钟, ss代表秒. 如果出现如: 86:22, 表述86分钟22秒, 需按要求转换为: "1:26:22"

##[VDOT推算]
- 1. 获取sheet5-1.json数据, 赋值为二元数组 vdot_map[vdot][subject]. 
- 2. 把用户输入的成绩转换为数组如: performances=
{
  "pbs": [
    {
    "subject": "5公里",
    "performance": "29:04"
    },
    {
    "subject": "10公里",
    "performance": "58:50"
    },
    {
    "subject": "15公里",
    "performance": "1:30:40"
    },
    {
    "subject": "半程马拉松",
    "performance": "2:10:25"
    },
    {
    "subject": "马拉松",
    "performance": "4:10:20"
    }
  ]
}

其中, subject的取值范围为: "5公里" / "10公里" / "15公里" / "半程马拉松" / "马拉松"
如果用户值输入10公里和15公里的成绩, 侧数据为 performances=
 {
  "pbs": [
    {
    "subject": "10公里",
    "performance": "54:00"
    },
    {
    "subject": "15公里",
    "performance": "1:26:21"
    }
  ]
 }
- 3. 计算performances数组的vdot值.  计算办法: 取performances.pbs每一subject项, 计算每一subject项的vdot值, 比如计算 subject="5公里" 的vdot, 伪代码如下:
vdot = getVDOT("5公里");
fun getVDOT(var subject){
    var total_seconds = getSeconds(getSubjectValue(performances.pbs, subject)); // 比如"29:04", 表示29分4秒, 总共29*60+4=1744秒;
    const MIN_VDOT=30, MAXVDOT=85;
    for(vdot = MIN_VDOT; vdot <=MAXVDOT; ++vdot){
        var base_seconds = getSeconds(vdot_map[vdot][subject])
        if(total_seconds > base_seconds){
            return max(vdot-1, MIN_VDOT);
        }
    }
    return MAXVDOT; 
}

例如performances=
{
  "pbs": [
    {
    "subject": "5公里",
    "performance": "29:04"
    },
    {
    "subject": "10公里",
    "performance": "58:50"
    },
    {
    "subject": "15公里",
    "performance": "1:30:40"
    },
    {
    "subject": "半程马拉松",
    "performance": "2:10:25"
    },
    {
    "subject": "马拉松",
    "performance": "4:10:20"
    }
  ]
}

循环调用getVDOT取得数组
vdots={
    "vdots": [
        {
            "subject" : "5公里",
            "vdot" : 32
        },
        {
            "subject" : "10公里",
            "vdot" : 33
        },
                {
            "subject" : "15公里",
            "vdot" : 33
        },
                {
            "subject" : "半程马拉松",
            "vdot" : 33
        },
                {
            "subject" : "马拉松",
            "vdot" : 35
        },
    ]
}
此时, 这个用户performances数组的vdot值, 即final_vdot=vdots数组里所有vdot的最大值, 即35.
- 4. 根据上一步技术的结果, 设置全局变量VDOT;  弹出界面, 界面: 
{title}
*{result}* (加粗加大字体)
- 5. title="计算出你的跑力值(VDOT)", result="{final_vdot}"
