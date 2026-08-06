# 多平台打包支持:抖音 / QQ / 快手小程序

- 日期:2026-08-06
- 状态:已确认(用户逐节审阅通过)

## 背景与目标

跑研匠(RunLab)是 uni-app 3.0(Vue 3)构建的跑步工具,当前支持 **H5 + 微信小程序** 双平台。目标是为**整套系统**增加抖音小程序、QQ小程序、快手小程序三个平台的打包支持,并做到**体验对齐微信**(完整适配)。

## 调研结论(已核实)

| 能力 | 微信 | 抖音 | QQ | 快手 |
|---|---|---|---|---|
| `onShareAppMessage` 分享 | ✓ | ✓ | ✓ | ✓ |
| `tabBar.custom` 自定义 tabBar | ✓ | ✓ | ✗ | ✗ |
| `navigationStyle: custom` | ✓ | ✓ | ✓ | ✓ |
| `uni.hideTabBar()` | — | — | ✓ | ✓ |
| `@dcloudio/uni-mp-xxx` 编译包 | 已装 | 存在(同版本) | 存在(同版本) | 存在(同版本) |

关键结论:
- 三个平台编译包 `@dcloudio/uni-mp-toutiao` / `uni-mp-qq` / `uni-mp-kuaishou` 均存在,且与项目当前版本 `3.0.0-5010420260703001` 完全一致。
- `onShareAppMessage` 四端全部支持 → 分享可统一开启。
- `navigationStyle: custom` 三平台支持 → 现有自定义导航栏方案无需改动。
- 分歧点仅有**底部 tabBar**:微信/抖音支持 `tabBar.custom`,QQ/快手不支持 → 采用运行时 `uni.hideTabBar()` 隐藏原生栏,四端统一自定义 tabBar(方案 A,用户已确认)。

## 用户约束

- 适配深度:**完整适配,体验对齐微信**。
- AppID:三个平台**先用占位符**(`__UNI__XXXXXX`),后续用户在各平台开发者后台注册后自行替换。

## 改动明细

### 1. 构建基础设施

**1a. `package.json` — 新增 3 个平台编译依赖**

```json
"@dcloudio/uni-mp-toutiao": "3.0.0-5010420260703001",
"@dcloudio/uni-mp-qq": "3.0.0-5010420260703001",
"@dcloudio/uni-mp-kuaishou": "3.0.0-5010420260703001"
```

**1b. `package.json` — 新增 6 个 npm scripts**(与微信的 `uni -p` 模式一致)

```json
"dev:mp-toutiao": "uni -p mp-toutiao",
"dev:mp-qq": "uni -p mp-qq",
"dev:mp-kuaishou": "uni -p mp-kuaishou",
"build:mp-toutiao": "uni build -p mp-toutiao",
"build:mp-qq": "uni build -p mp-qq",
"build:mp-kuaishou": "uni build -p mp-kuaishou"
```

**1c. `src/manifest.json` — 新增 3 段平台配置**(appid 占位,结构与微信段对齐,去掉微信特有的 `lazyCodeLoading` / `usingComponents`)

```json
"mp-toutiao": {
  "appid": "__UNI__XXXXXX",
  "setting": { "urlCheck": true, "es6": true, "postcss": true, "minified": true }
},
"mp-qq": {
  "appid": "__UNI__XXXXXX",
  "setting": { "es6": true, "postcss": true, "minified": true }
},
"mp-kuaishou": {
  "appid": "__UNI__XXXXXX",
  "setting": { "es6": true, "postcss": true, "minified": true }
}
```

### 2. 分享功能(`onShareAppMessage`)

以下 **7 个页面**中的 `// #ifdef MP-WEIXIN` → `// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU`,`#endif` 保留:

- `src/pages/performance-prediction/index.vue` — 成绩预测
- `src/pages/bmi/index.vue` — 体重建议
- `src/pages/bmi/understanding/index.vue` — 理解 BMI
- `src/pages/cadence-stride/index.vue` — 步频步幅
- `src/pages/finish-time/index.vue` — 完赛时间
- `src/pages/level-query/index.vue` — 等级查询
- `src/pages/pace-calculator/index.vue` — 配速计算器

平台差异(无需改代码,知晓即可):
- QQ:`path` 参数不受支持,分享卡片默认打开分享者当前页 → 行为正确。
- 抖音:分享权限需在抖音开发者后台开通,占位 appid 阶段不影响编译。

不在范围:跑力值计算、心率计算两页微信端本就没有分享,保持与微信一致(不加)。

### 3. tabBar 统一自定义(方案 A)

**3a. `src/pages.json` — `custom` 字段扩展到抖音**(微信/抖音两平台官方支持,隐藏原生栏):

```json
"tabBar": {
  /* #ifdef MP-WEIXIN || MP-TOUTIAO */
  "custom": true,
  /* #endif */
  "color": "#7F8C8D",
  "selectedColor": "#FFFFFF",
  "backgroundColor": "#2C3E50",
  "borderStyle": "black",
  "list": [ ... 保持不变 ... ]
}
```

**3b. 两个 tabBar 页面**(`src/pages/index/index.vue`、`src/pages/achievement/index.vue`):`CustomTabBar` 的**引入 + 渲染**两处条件编译,由 `MP-WEIXIN` 扩展为四端:

```html
<!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
<CustomTabBar active-index="0" />
<!-- #endif -->
```

```js
// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
import CustomTabBar from '@/custom-tab-bar/index.vue'
// #endif
```

**3c. 新增工具函数 `src/utils/hide-native-tab-bar.js`**(QQ/快手专属,其他平台编译时整文件为空):

```js
// #ifdef MP-QQ || MP-KUAISHOU
export function hideNativeTabBar() {
  uni.hideTabBar({ animation: false })
}
// #endif
```

**3d. 两个 tabBar 页面 `onShow` 中调用**(QQ/快手不支持 `custom`,需在每次页面显示时隐藏原生栏,避免切换 tab 后原生栏重现):

```js
// #ifdef MP-QQ || MP-KUAISHOU
import { onShow } from '@dcloudio/uni-app'
import { hideNativeTabBar } from '@/utils/hide-native-tab-bar'
onShow(() => { hideNativeTabBar() })
// #endif
```

结果:四端只显示自定义 tabBar(放大字号、深色底),视觉一致;微信/抖音走 `custom:true` 机制,QQ/快手走运行时隐藏。

已知风险:QQ/快手首帧原生栏可能闪现一瞬;需在对应开发者工具确认,若明显可调整(如 `onLoad` 提前触发)。

### 4. 平台已知坑(构建时重点核对)

1. **抖音 "true" 文本 bug**:抖音在 `navigationStyle: custom` 且未设标题时,导航栏中间显示 "true"。项目 `globalStyle` 已设 `navigationBarTitleText: "跑研匠-RunLab"`,预计不触发;若出现,给对应页面补 `"navigationBarTitleText": ""`。
2. **QQ 分享**:忽略 `path` 参数,默认打开分享者当前页 → 行为正确,无需处理。
3. **微信/抖音 custom:true 双渲染**:现有微信构建中 `custom:true` 自动注入 + 页面手动渲染 `custom-tab-bar`,两组件重叠(视觉像一条)。抖音若同机制则一致;构建后检查产物确认无异常。
4. **CSS/安全区**:自定义 tabBar 的 `env(safe-area-inset-bottom)` 已在组件内,四端通用,无需改动。

### 5. 验证方式

1. `npm install` 安装新依赖。
2. 逐个跑 `npm run build:mp-toutiao`、`npm run build:mp-qq`、`npm run build:mp-kuaishou`,确认三端构建均无报错。
3. 检查 `dist/build/mp-xxx/` 产物:
   - `app.json` 的 pages 列表齐全(含 bmi 等所有页面)。
   - 抖音产物 tabBar 含 `custom: true`;QQ/快手产物**不含** `custom`,且编译产物含 `hideTabBar` 调用。
   - `onShareAppMessage` 已编译进各页面。
4. 回归验证 `npm run build:mp-weixin` 与 `npm run build:h5` 仍正常。
5. 真机/开发者工具验证(需用户操作):在各平台开发者工具导入 `dist/build/mp-xxx`,重点确认底部 tabBar 显示与切换、右上角分享、各计算功能。

### 6. 文档更新

更新 `CLAUDE.md` 与 README(如有)的"常用命令"与"支持平台"说明,补充三平台构建命令。

## 范围边界(明确不做)

- 跑力值计算、心率计算两页**不加** `onShareAppMessage`(与微信现状一致)。
- 不接入各平台的登录/支付/广告等平台能力(本项目为纯工具,无此类需求)。
- 不为抖音后台/QQ 后台/快手后台代填真实 appid(用户自行注册填写)。
- H5 的 html2canvas 截图分享不受影响,不改动。

## 参考资料

- uni-app pages.json tabBar 文档:https://uniapp.dcloud.net.cn/collocation/pages.html
- uni-app 分享文档:https://uniapp.dcloud.net.cn/api/plugins/share
- 自定义 tabBar:https://uniapp.dcloud.io/component/custom-tab-bar
