# 多平台打包支持(抖音 / QQ / 快手)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为跑研匠(uni-app 3.0)新增抖音、QQ、快手三个小程序平台的打包支持,体验对齐微信(自定义 tabBar + 分享菜单)。

**Architecture:** 基于 uni-app 条件编译扩展现有微信/H5 双平台配置。新增三个平台编译依赖与 npm 脚本;manifest.json 增加平台段(占位 appid);`onShareAppMessage` 从 `#ifdef MP-WEIXIN` 扩展为四端;tabBar 采用"微信/抖音走 `tabBar.custom`、QQ/快手走运行时 `uni.hideTabBar()`"的统一自定义方案。所有逻辑改动均为条件编译扩展,不触碰核心计算代码。

**Tech Stack:** uni-app 3.0 (Vue 3 `<script setup>`)、Vite 5.2、`uni build -p <platform>`、条件编译宏 `MP-TOUTIAO` / `MP-QQ` / `MP-KUAISHOU`。

## Global Constraints

- 三个编译依赖版本**必须**与现有微信包一致:`3.0.0-5010420260703001`(已核实 npm 上存在)。
- AppID 一律用占位符 `__UNI__XXXXXX`,**不要**替换真实值(用户后续自行填写)。
- 条件编译平台宏:抖音=`MP-TOUTIAO`、QQ=`MP-QQ`、快手=`MP-KUAISHOU`。
- 分享(`onShareAppMessage`)只扩展现有 7 个页面;**不要**给跑力值计算、心率计算两页新增分享。
- 不改动 H5 的 html2canvas 截图分享(`#ifdef H5` 块)。
- 核心计算逻辑(`src/logic/`、`src/data/`)一律不改。
- 提交只加源码文件,`dist/` 已在 `.gitignore`,不提交构建产物。
- 所有注释、文档、提交信息使用中文。

参考规格:`docs/superpowers/specs/2026-08-06-multi-platform-build-design.md`

---

### Task 1: 构建基础设施(依赖 + 脚本 + manifest 平台段)

**Files:**
- Modify: `package.json`
- Modify: `src/manifest.json`

**Interfaces:**
- Produces: `npm run build:mp-toutiao` / `build:mp-qq` / `build:mp-kuaishou` / `dev:mp-toutiao` / `dev:mp-qq` / `dev:mp-kuaishou` 六个可用命令;`src/manifest.json` 含 `mp-toutiao` / `mp-qq` / `mp-kuaishou` 三段配置。后续 Task 2-4 依赖此基础设施做构建验证。

- [ ] **Step 1: package.json 添加 3 个编译依赖**

在 `dependencies` 中、`"@dcloudio/uni-mp-weixin"` 行之后插入三行(保持字典序一致):

```json
"dependencies": {
  "@dcloudio/uni-app": "3.0.0-5010420260703001",
  "@dcloudio/uni-components": "3.0.0-5010420260703001",
  "@dcloudio/uni-h5": "3.0.0-5010420260703001",
  "@dcloudio/uni-mp-weixin": "3.0.0-5010420260703001",
  "@dcloudio/uni-mp-toutiao": "3.0.0-5010420260703001",
  "@dcloudio/uni-mp-qq": "3.0.0-5010420260703001",
  "@dcloudio/uni-mp-kuaishou": "3.0.0-5010420260703001",
  "html2canvas": "^1.4.1",
  "qrcode": "^1.5.4",
  "vue": "^3.4.21"
}
```

- [ ] **Step 2: package.json 添加 6 个 npm scripts**

在 `scripts` 中、`"build:h5"` 行之后插入(`postbuild:h5` 之前):

```json
"scripts": {
  "dev:mp-weixin": "uni -p mp-weixin",
  "dev:h5": "uni",
  "dev:mp-toutiao": "uni -p mp-toutiao",
  "dev:mp-qq": "uni -p mp-qq",
  "dev:mp-kuaishou": "uni -p mp-kuaishou",
  "build:mp-weixin": "uni build -p mp-weixin",
  "build:h5": "uni build",
  "build:mp-toutiao": "uni build -p mp-toutiao",
  "build:mp-qq": "uni build -p mp-qq",
  "build:mp-kuaishou": "uni build -p mp-kuaishou",
  "postbuild:h5": "bash scripts/prepare-deploy.sh"
}
```

- [ ] **Step 3: src/manifest.json 添加 3 段平台配置**

在 `"mp-weixin": { ... }` 对象(`lazyCodeLoading` 行 `}`)之后、`"h5":` 之前插入:

```json
  "mp-toutiao": {
    "appid": "__UNI__XXXXXX",
    "setting": {
      "urlCheck": true,
      "es6": true,
      "postcss": true,
      "minified": true
    }
  },
  "mp-qq": {
    "appid": "__UNI__XXXXXX",
    "setting": {
      "es6": true,
      "postcss": true,
      "minified": true
    }
  },
  "mp-kuaishou": {
    "appid": "__UNI__XXXXXX",
    "setting": {
      "es6": true,
      "postcss": true,
      "minified": true
    }
  },
```

- [ ] **Step 4: 安装依赖**

Run: `npm install`
Expected: 成功,无 ERR。`node_modules/@dcloudio/` 下出现 `uni-mp-toutiao` / `uni-mp-qq` / `uni-mp-kuaishou` 三个目录:
`ls node_modules/@dcloudio/ | grep -E "uni-mp-(toutiao|qq|kuaishou)"`

- [ ] **Step 5: 三平台构建验证**

Run:
```bash
npm run build:mp-toutiao
npm run build:mp-qq
npm run build:mp-kuaishou
```
Expected: 三命令均以 exit code 0 结束(允许占位 appid 相关 WARN,不允许 ERROR)。产物目录存在:
```bash
ls dist/build/mp-toutiao/ dist/build/mp-qq/ dist/build/mp-kuaishou/
```
每个目录应含 `app.json`、`app.js`、`app.wxss`、`pages/`、`static/` 等。检查 `dist/build/mp-toutiao/app.json` 的 `pages` 数组含全部 12 个页面(含 `pages/bmi/index`、`pages/bmi/understanding/index`)。

- [ ] **Step 6: 提交**

```bash
git add package.json src/manifest.json
git commit -m "feat: 新增抖音/QQ/快手小程序构建基础设施(依赖、脚本、manifest 平台段)"
```

---

### Task 2: 分享功能扩展四端(`onShareAppMessage`)

**Files:**
- Modify: `src/pages/performance-prediction/index.vue`
- Modify: `src/pages/bmi/index.vue`
- Modify: `src/pages/bmi/understanding/index.vue`
- Modify: `src/pages/cadence-stride/index.vue`
- Modify: `src/pages/finish-time/index.vue`
- Modify: `src/pages/level-query/index.vue`
- Modify: `src/pages/pace-calculator/index.vue`

**Interfaces:**
- Consumes: Task 1 的构建命令(`npm run build:mp-xxx`)。
- Produces: 7 个页面在四端(微信/抖音/QQ/快手)均编译 `onShareAppMessage`,使右上角分享菜单可用。

- [ ] **Step 1: 替换 7 个页面的条件编译**

对以下 7 个文件,将包裹 `onShareAppMessage(() => ({ ... }))` 的 `// #ifdef MP-WEIXIN` 替换为四端条件。每个文件**恰好只有一处** `// #ifdef MP-WEIXIN`(可用 `grep -n "#ifdef MP-WEIXIN" 文件` 确认唯一),`// #endif` 保留不动。

| 文件 | 分享标题 |
|---|---|
| `src/pages/performance-prediction/index.vue` | 成绩预测 — 跑研匠 |
| `src/pages/bmi/index.vue` | 体重建议 — 跑研匠 |
| `src/pages/bmi/understanding/index.vue` | 跑者如何理解 BMI — 跑研匠 |
| `src/pages/cadence-stride/index.vue` | 步频步幅计算 — 跑研匠 |
| `src/pages/finish-time/index.vue` | 完赛时间计算 — 跑研匠 |
| `src/pages/level-query/index.vue` | 等级查询 — 跑研匠 |
| `src/pages/pace-calculator/index.vue` | 配速计算器 — 跑研匠 |

旧行(每个文件均相同):
```js
// #ifdef MP-WEIXIN
```
新行:
```js
// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
```

- [ ] **Step 2: 重新构建并验证三平台产物含分享**

Run:
```bash
npm run build:mp-toutiao && npm run build:mp-qq && npm run build:mp-kuaishou
```

Run(在编译产物中搜索分享代码,标识符 `onShareAppMessage` 在产物中保留):
```bash
grep -rl "onShareAppMessage" dist/build/mp-toutiao/pages/performance-prediction/ dist/build/mp-qq/pages/bmi/ dist/build/mp-kuaishou/pages/level-query/
```
Expected: 三平台各至少输出 1 个匹配的 `.js` 文件。

再抽查 7 页全部编译到位(路径与 `src/pages/` 结构一一对应):
```bash
for p in performance-prediction bmi bmi/understanding cadence-stride finish-time level-query pace-calculator; do echo "== $p =="; grep -rl "onShareAppMessage" dist/build/mp-toutiao/pages/$p/; done
```
Expected: 输出 7 个 `== <path> ==` 组,每组下方各列出 1 个匹配的 `.js` 文件。

- [ ] **Step 3: 微信端回归**

Run: `npm run build:mp-weixin`
Expected: exit 0。`grep -rl "onShareAppMessage" dist/build/mp-weixin/pages/performance-prediction/` 仍有匹配(微信分享不回退)。

- [ ] **Step 4: 提交**

```bash
git add src/pages/performance-prediction/index.vue src/pages/bmi/index.vue src/pages/bmi/understanding/index.vue src/pages/cadence-stride/index.vue src/pages/finish-time/index.vue src/pages/level-query/index.vue src/pages/pace-calculator/index.vue
git commit -m "feat: 分享功能(onShareAppMessage)扩展至抖音/QQ/快手三端"
```

---

### Task 3: tabBar 自定义扩展到抖音 + 四端渲染

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/achievement/index.vue`

**Interfaces:**
- Consumes: Task 1 构建命令。
- Produces: 抖音产物 `app.json` tabBar 含 `"custom": true`;微信/抖音/QQ/快手四端 tabBar 页面都渲染 `<CustomTabBar>` 组件。QQ/快手原生栏的运行时隐藏由 Task 4 补齐。

- [ ] **Step 1: pages.json 的 tabBar custom 扩展到抖音**

`src/pages.json` tabBar 段,将:

```json
  "tabBar": {
    /* #ifdef MP-WEIXIN */
    "custom": true,
    /* #endif */
```

改为:

```json
  "tabBar": {
    /* #ifdef MP-WEIXIN || MP-TOUTIAO */
    "custom": true,
    /* #endif */
```

其余 tabBar 字段(颜色、list 等)不动。

- [ ] **Step 2: 首页 index.vue 的 CustomTabBar 扩展到四端**

`src/pages/index/index.vue` 模板中:

```html
    <!-- #ifdef MP-WEIXIN -->
    <CustomTabBar active-index="0" />
    <!-- #endif -->
```
改为:
```html
    <!-- #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU -->
    <CustomTabBar active-index="0" />
    <!-- #endif -->
```

脚本中 import 处:
```js
// #ifdef MP-WEIXIN
import CustomTabBar from '@/custom-tab-bar/index.vue'
// #endif
```
改为:
```js
// #ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU
import CustomTabBar from '@/custom-tab-bar/index.vue'
// #endif
```

- [ ] **Step 3: 成就页 achievement/index.vue 的 CustomTabBar 扩展到四端**

`src/pages/achievement/index.vue`,同样的两处替换(模板 `active-index="1"`、脚本 import),`#ifdef MP-WEIXIN` → `#ifdef MP-WEIXIN || MP-TOUTIAO || MP-QQ || MP-KUAISHOU`。

- [ ] **Step 4: 验证抖音产物含 custom:true**

Run: `npm run build:mp-toutiao`

Run:
```bash
grep -A3 '"tabBar"' dist/build/mp-toutiao/app.json
```
Expected: 输出包含 `"custom": true`。

- [ ] **Step 5: 验证 QQ/快手产物不含 custom**

Run: `npm run build:mp-qq && npm run build:mp-kuaishou`

Run:
```bash
grep -c '"custom"' dist/build/mp-qq/app.json; grep -c '"custom"' dist/build/mp-kuaishou/app.json
```
Expected: 两个输出均为 `0`(QQ/快手不支持 custom,构建后不应出现该字段)。

- [ ] **Step 6: 微信端回归**

Run: `npm run build:mp-weixin`
Expected: exit 0,`grep -A3 '"tabBar"' dist/build/mp-weixin/app.json` 仍含 `"custom": true`。

- [ ] **Step 7: 提交**

```bash
git add src/pages.json src/pages/index/index.vue src/pages/achievement/index.vue
git commit -m "feat: tabBar 自定义扩展至抖音并四端渲染 CustomTabBar"
```

---

### Task 4: QQ/快手运行时隐藏原生 tabBar

**Files:**
- Create: `src/utils/hide-native-tab-bar.js`
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/achievement/index.vue`

**Interfaces:**
- Consumes: 由 Task 3 引入的 `CustomTabBar` 四端渲染。
- Produces: 导出 `hideNativeTabBar()`;QQ/快手两平台 tabBar 页每次 `onShow` 时调用 `uni.hideTabBar({ animation: false })`,隐藏原生栏;微信/抖音/H5 编译产物中**不含**该工具与调用。

- [ ] **Step 1: 创建工具函数**

Create `src/utils/hide-native-tab-bar.js`:

```js
/**
 * 隐藏原生 tabBar — QQ/快手小程序不支持 pages.json 的 tabBar.custom,
 * 需在 tabBar 页面每次显示(onShow)时调用 uni.hideTabBar 隐藏原生栏,
 * 以配合自定义 tabBar 组件。
 * 注意:本文件仅 QQ/快手编译,其他平台条件编译后为空文件,勿在其他平台 import。
 */
// #ifdef MP-QQ || MP-KUAISHOU
export function hideNativeTabBar() {
  uni.hideTabBar({ animation: false })
}
// #endif
```

- [ ] **Step 2: 首页 index.vue 添加 onShow 隐藏逻辑**

`src/pages/index/index.vue` 的 `<script setup>` 中,在现有 import 语句之后(`CustomTabBar` import 之后、`menuItems` 定义之前)追加:

```js
// #ifdef MP-QQ || MP-KUAISHOU
import { onShow } from '@dcloudio/uni-app'
import { hideNativeTabBar } from '@/utils/hide-native-tab-bar'
onShow(() => { hideNativeTabBar() })
// #endif
```

- [ ] **Step 3: 成就页 achievement/index.vue 添加 onShow 隐藏逻辑**

`src/pages/achievement/index.vue` 的 `<script setup>`,同样的追加(位置在现有 import 之后):

```js
// #ifdef MP-QQ || MP-KUAISHOU
import { onShow } from '@dcloudio/uni-app'
import { hideNativeTabBar } from '@/utils/hide-native-tab-bar'
onShow(() => { hideNativeTabBar() })
// #endif
```

- [ ] **Step 4: 验证 QQ/快手产物含 hideTabBar**

Run: `npm run build:mp-qq && npm run build:mp-kuaishou`

Run:
```bash
grep -rl "hideTabBar" dist/build/mp-qq/pages/index/ dist/build/mp-qq/pages/achievement/ dist/build/mp-kuaishou/pages/index/ dist/build/mp-kuaishou/pages/achievement/
```
Expected: 输出 4 个 `.js` 文件(每平台 2 个 tabBar 页各 1)。

- [ ] **Step 5: 验证微信/抖音产物不含 hideTabBar(条件编译正确性)**

Run: `npm run build:mp-weixin && npm run build:mp-toutiao`

Run:
```bash
grep -rl "hideTabBar" dist/build/mp-weixin/pages/ dist/build/mp-toutiao/pages/
```
Expected: **无任何输出**(工具函数与调用被条件编译剔除)。

- [ ] **Step 6: 提交**

```bash
git add src/utils/hide-native-tab-bar.js src/pages/index/index.vue src/pages/achievement/index.vue
git commit -m "feat: QQ/快手端运行时隐藏原生 tabBar(onShow 调用)"
```

---

### Task 5: 文档更新与全量回归

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: 全部已完成改动。

- [ ] **Step 1: 更新 CLAUDE.md 常用命令**

在 `## 常用命令` 代码块中,`npm run dev:mp-weixin` 之后追加三行、`npm run build:h5` 之后追加三行(保持与现有格式一致):

```bash
npm run dev:mp-toutiao       # 启动抖音小程序开发模式(用抖音开发者工具导入 dist/dev/mp-toutiao)
npm run dev:mp-qq            # 启动 QQ 小程序开发模式(用 QQ 开发者工具导入 dist/dev/mp-qq)
npm run dev:mp-kuaishou      # 启动快手小程序开发模式(用快手开发者工具导入 dist/dev/mp-kuaishou)
npm run build:mp-toutiao     # 抖音小程序生产构建
npm run build:mp-qq          # QQ 小程序生产构建
npm run build:mp-kuaishou    # 快手小程序生产构建
```

- [ ] **Step 2: 更新 CLAUDE.md 概述/架构**

将 `## 项目概述` 中的"微信小程序 + H5 双平台"相关描述改为"微信 / 抖音 / QQ / 快手小程序 + H5"的多平台描述。

在 `## 架构概览` 的 `src/` 树中,`utils/` 段(当前仅一行 `time.js`)追加一行,保持树形对齐:

```
├── utils/               # 通用工具函数(无 Vue 依赖)
│   ├── time.js                     # 时间/配速格式化工具
│   └── hide-native-tab-bar.js      # QQ/快手端隐藏原生 tabBar 工具(仅这两端编译)
```

(注意:将该行挂在 `utils/` 段下、`time.js` 之后;如该段实际缩进/注释与示例不同,按现有风格对齐。)

- [ ] **Step 3: 更新 README.md 平台说明**

`README.md` 三处修改:
1. 第 7 行"同时支持微信小程序和 H5 网页双平台" → "同时支持微信、抖音、QQ、快手小程序和 H5 网页五端"。
2. 技术栈表第 103 行 `| 平台支持 | 微信小程序 + H5 网页 |` → `| 平台支持 | 微信 / 抖音 / QQ / 快手小程序 + H5 网页 |`。
3. "快速开始"章节:在"微信小程序生产构建"小节后新增"抖音 / QQ / 快手小程序生产构建"小节,并更新"可用脚本一览"表格,补充 6 个新命令:

```markdown
### 抖音 / QQ / 快手小程序生产构建

```bash
npm run build:mp-toutiao   # 抖音:产物在 dist/build/mp-toutiao,用抖音开发者工具导入
npm run build:mp-qq        # QQ:产物在 dist/build/mp-qq,用 QQ 开发者工具导入
npm run build:mp-kuaishou  # 快手:产物在 dist/build/mp-kuaishou,用快手开发者工具导入
```

三个平台构建前需在 `src/manifest.json` 对应平台段填入真实 appid(当前为占位符 `__UNI__XXXXXX`)。分享能力需在各平台开发者后台开通;QQ/快手端底部 tabBar 由运行时隐藏原生栏实现。
```

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | H5 开发服务器 |
| `npm run dev:mp-weixin` | 微信小程序开发模式 |
| `npm run dev:mp-toutiao` | 抖音小程序开发模式 |
| `npm run dev:mp-qq` | QQ 小程序开发模式 |
| `npm run dev:mp-kuaishou` | 快手小程序开发模式 |
| `npm run build:h5` | H5 生产构建 |
| `npm run build:mp-weixin` | 微信小程序生产构建 |
| `npm run build:mp-toutiao` | 抖音小程序生产构建 |
| `npm run build:mp-qq` | QQ 小程序生产构建 |
| `npm run build:mp-kuaishou` | 快手小程序生产构建 |

(表格中"微信小程序生产构建"等既有行保留,只做增行。)

- [ ] **Step 4: 全量回归构建**

Run:
```bash
npm run build:mp-weixin && npm run build:h5 && npm run build:mp-toutiao && npm run build:mp-qq && npm run build:mp-kuaishou
```
Expected: 5 个命令全部 exit 0。

Run(产物结构总检):
```bash
ls dist/build/mp-weixin/app.json dist/build/h5/ dist/build/mp-toutiao/app.json dist/build/mp-qq/app.json dist/build/mp-kuaishou/app.json
```
Expected: 5 个产物均存在。

- [ ] **Step 5: 提交**

```bash
git add CLAUDE.md README.md
git commit -m "docs: 补充三平台开发/构建命令与平台支持说明"
```

---

## 全量产物结构验收(收尾)

实现完成后,最终确认一次三平台产物与微信端一致:
- `dist/build/mp-toutiao/`、`dist/build/mp-qq/`、`dist/build/mp-kuaishou/` 均含全部 12 个页面、`static/` 静态资源、`custom-tab-bar/` 组件产物。
- 抖音产物 `app.json` tabBar 含 `custom: true`;QQ/快手产物 tabBar **不含** `custom`,且两平台 `pages/index`、`pages/achievement` 编译产物含 `hideTabBar`。
- 微信端回归:`dist/build/mp-weixin/app.json` 含 `custom: true`,`onShareAppMessage` 仍在。
- H5 端回归:`dist/build/h5/` 正常生成。

## 真机验证(需用户在对应开发者工具执行,不在本计划范围内)

- 用抖音开发者工具导入 `dist/build/mp-toutiao`,确认:导航栏无 "true" 文本、底部 tabBar 显示与切换、右上角分享菜单、各计算功能。
- 用 QQ 开发者工具导入 `dist/build/mp-qq`,确认:底部 tabBar 显示与切换(首帧原生栏可能闪现一瞬)、右上角分享、各计算功能。
- 用快手开发者工具导入 `dist/build/mp-kuaishou`,同上。
- 如 QQ/快手首帧原生 tabBar 闪现明显,可将 `onShow` 触发提前到 `onLoad`,或改为在 `App.vue` 的 `onLaunch` 中调用——作为后续微调项记录。
