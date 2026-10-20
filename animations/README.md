# Boji 动作动画

本目录生成 25 个动作的 Lottie 动画。四门课程的 16 个动作在 `lottie/`，动作库中尚未编入课程的 9 个动作在 `lottie-library/`。每个动作有浅色和深色两个版本，共 50 个 JSON 文件。应用只打包 `lottie/`。动画由 TypeScript 程序生成，不含第三方素材，没有授权限制。文件名就是动作 ID，与 iOS `Exercise.id` 和 Android `Workout.kt` 一致，应用按 ID 加载。

关键帧总览见 [浅色总览图](docs/contact-sheet-light.jpg) 和 [深色总览图](docs/contact-sheet-dark.jpg)。每行是一个动作。前 4 列分别是循环的 0%、25%、50% 和 75% 处，第 5 列虚线框中是代表帧。

## 快速开始

你必须先安装 [devenv](https://devenv.sh)。仓库根目录的 `devenv.nix` 提供 Node.js 24 和 pnpm 12。TypeScript 和 tsx 是 `package.json` 中的开发依赖，版本由 `pnpm-lock.yaml` 锁定。

1. 在仓库根目录运行 `devenv shell`。如果你使用 direnv，运行一次 `direnv allow`，之后进入仓库时环境会自动加载。devenv 加载环境时会在 `animations/` 中运行 `pnpm install`。
2. 进入 `animations/` 目录。
3. 运行 `pnpm build`，重新生成 `lottie/` 和 `lottie-library/`。
4. 运行 `pnpm check`，确认这两个目录与源码一致。

在仓库根目录运行 `devenv test`，会依次执行 `pnpm typecheck` 和 `pnpm check`。

## 生成方式

动画不是从 After Effects 导出的。生成器用代码描述每个动作，再直接写出 Lottie JSON：

1. `src/rig.ts` 定义侧视角的二维骨骼，包括骨盆、两段脊柱、颈、头和四肢。
2. 每个动作脚本提供姿态函数 `pose(t)`。脚本给出髋部位置、脊柱角度和手脚的目标点，`solve()` 用两段式反向运动学（IK）求出关节角度。
3. `src/compose.ts` 以 60 fps 逐帧求解姿态，再把逐帧结果压缩成线性关键帧。位置误差上限为 0.2 px，旋转误差上限为 0.2°。
4. 躯干轮廓逐帧变形。肌肉高亮的不透明度跟随发力曲线变化。器械的把手、横杆、钢索、踏板、配重片和哑铃跟随手脚运动。

同一份源码每次生成的文件逐字节一致。`pnpm check` 依靠这一点判断生成的文件是否过期。

## 目录结构

| 路径 | 内容 | 是否提交 |
| --- | --- | --- |
| `lottie/` | 课程动作的动画：`light/` 和 `dark/` 各 16 个 JSON，以及 `index.json` | 提交，应用直接引用 |
| `lottie-library/` | 动作库的动画：`light/` 和 `dark/` 各 9 个 JSON，以及 `index.json` | 提交，应用不打包 |
| `src/` | 生成器源码 | 提交 |
| `src/exercises/` | 每个动作一个脚本；`common.ts` 和 `equipment.ts` 是共享的姿态和器械 | 提交 |
| `scripts/` | 校验、预览和渲染脚本 | 提交 |
| `docs/` | 关键帧总览图和接入说明 | 提交 |
| `preview/index.html` | 离线预览页 | 提交 |
| `preview/data.js`、`preview/lottie.min.js` | `pnpm preview` 生成的预览数据和播放器 | 不提交 |
| `.renders/` | `pnpm render` 输出的 PNG | 不提交 |

`src/` 中各模块的职责如下：

| 文件 | 职责 |
| --- | --- |
| `math.ts` | 向量运算、IK 和时间轴 |
| `lottie.ts` | Lottie 形状、路径和关键帧压缩 |
| `rig.ts` | 骨骼求解、身体部件形状和肌肉区域 |
| `palettes.ts` | 浅色和深色配色 |
| `exercise.ts` | 动作脚本的类型契约 |
| `compose.ts` | 把一个动作和一套配色合成为一个 Lottie 动画 |
| `generate.ts` | 写出全部动画文件和 `index.json` |
| `build.ts` | `pnpm build` 的命令行入口 |
| `courses.ts` | 课程和动作库的注册表。课程中的动作顺序与应用一致 |

## 命令

以下命令都在 devenv 环境中的 `animations/` 目录运行。

| 命令 | 作用 |
| --- | --- |
| `pnpm build` | 重新生成 `lottie/` 和 `lottie-library/`，并删除已移到另一个目录的动作文件。后面加动作 ID 时只重写这些动作的文件，`index.json` 总是列出本目录的全部动作。`--out <目录>` 把这两个目录写到其他根目录下 |
| `pnpm check` | 在临时目录重新生成，并与 `lottie/` 和 `lottie-library/` 逐字节比对。文件不一致或出现 IK 警告时，退出码为 1 |
| `pnpm typecheck` | 用 `tsc --noEmit` 检查类型 |
| `pnpm preview` | 生成预览数据。运行后用浏览器打开 `preview/index.html` |
| `pnpm sheets` | 渲染 `docs/contact-sheet-light.jpg` 和 `docs/contact-sheet-dark.jpg` |
| `pnpm render <文件>` | 把指定的 JSON 文件各渲染成 8 张 PNG，输出到 `.renders/` |

`pnpm sheets` 和 `pnpm render` 需要 Chromium 无头内核。运行一次 `pnpm exec playwright-core install chromium-headless-shell` 安装内核，或用环境变量 `CHROME_PATH` 指定本机的 Chromium。

## 修改动作

1. 编辑 `src/exercises/<动作 ID>.ts`。每个脚本默认导出一个 `Exercise` 对象，包含时间轴 `tl`、姿态函数 `pose(t)` 和高亮肌群 `muscles`。器械动作还包含固定器械 `props` 和活动部件 `dynamic`。类型定义在 `src/exercise.ts` 中。
2. 如果要改身体比例、部件形状或肌肉区域，编辑 `src/rig.ts`。如果要改颜色，编辑 `src/palettes.ts`。这两个文件的修改会影响全部动作。
3. 运行 `pnpm build`。如果某一帧的手脚够不到目标点，输出中会出现 `WARN`，退出码为 1。
4. 运行 `pnpm sheets` 和 `pnpm preview`，检查画面。
5. 运行 `pnpm typecheck` 和 `pnpm check`，然后把源码、`lottie/`、`lottie-library/` 和总览图一起提交。

新增动作时，在 `src/exercises/` 中新建脚本，再到 `src/courses.ts` 中注册：

- 应用课程已经使用的动作，按课程顺序加入 `COURSES`。动作 ID 必须与应用中的 `Exercise.id` 一致。
- 尚未编入课程的动作，加入 `LIBRARY`。目前 `LIBRARY` 中有 9 个动作。
- 应用课程开始使用动作库中的某个动作时，把它从 `LIBRARY` 移到 `COURSES`，再运行 `pnpm build`。它的动画文件会从 `lottie-library/` 移到 `lottie/`。

## 动作清单

| 课程 | 动作 | `id` | 循环时长 | 高亮肌群 | 演示要点 |
| --- | --- | --- | --- | --- | --- |
| 居家基础训练 | 徒手深蹲 | `bodyweight-squat` | 3.5 秒 | 股四头肌、臀大肌 | 髋部先后移再下沉，脚掌全程贴地 |
| 居家基础训练 | 墙壁俯卧撑 | `wall-push-up` | 3.3 秒 | 胸大肌、肱三头肌 | 身体保持直线，双手固定在墙上 |
| 居家基础训练 | 臀桥 | `glute-bridge` | 4.2 秒 | 臀大肌、腘绳肌 | 顶点时肩、髋、膝成一条直线 |
| 居家基础训练 | 鸟狗式 | `bird-dog` | 7.4 秒 | 臀大肌、竖脊肌、三角肌 | 左右各做一次，对侧手脚同时伸展 |
| 居家进阶训练 | 后撤步弓步蹲 | `reverse-lunge` | 6.3 秒 | 股四头肌、臀大肌 | 左右各做一次，后脚踮脚尖着地，前小腿接近垂直 |
| 居家进阶训练 | 跪姿俯卧撑 | `knee-push-up` | 3.3 秒 | 胸大肌、肱三头肌、腹直肌 | 身体以膝盖为支点下放，双手固定，肘部向后收 |
| 居家进阶训练 | 死虫式 | `dead-bug` | 6.6 秒 | 腹直肌、髂腰肌 | 仰卧桌面位，左右各做一次，对侧手脚同时伸展 |
| 居家进阶训练 | 靠墙静蹲 | `wall-sit` | 6.2 秒 | 股四头肌、臀大肌 | 背贴墙下滑到大腿水平，保持 3 秒，发力逐渐加深 |
| 居家进阶训练 | 平板支撑 | `plank` | 4.0 秒 | 腹直肌、臀大肌、三角肌 | 前臂撑地，肘在肩正下方，身体保持直线。循环展示一次缓慢呼吸 |
| 器械基础训练 | 坐姿推胸 | `chest-press` | 3.4 秒 | 胸大肌、肱三头肌、三角肌 | 背部贴住靠垫，推出时肘部微屈 |
| 器械基础训练 | 坐姿划船 | `seated-row` | 3.5 秒 | 背阔肌、菱形肌和斜方肌中部、肱二头肌 | 躯干从前倾回到直立，肩胛后收 |
| 器械基础训练 | 坐姿腿举 | `leg-press` | 3.6 秒 | 股四头肌、臀大肌 | 伸腿到膝盖微屈为止，不锁死 |
| 器械基础训练 | 高位下拉 | `lat-pulldown` | 3.5 秒 | 背阔肌、肱二头肌、菱形肌和斜方肌中部 | 横杆拉到上胸，躯干只轻微后仰 |
| 舒缓拉伸 | 猫牛式 | `cat-cow` | 5.0 秒 | 腹直肌、竖脊肌 | 脊柱在拱背和塌腰之间交替，双手不动 |
| 舒缓拉伸 | 髋屈肌拉伸 | `hip-flexor-stretch` | 5.8 秒 | 髂腰肌、股四头肌 | 骨盆缓慢前移，后侧腿的髋屈肌发亮 |
| 舒缓拉伸 | 开胸拉伸 | `chest-stretch` | 5.4 秒 | 胸大肌、三角肌 | 双臂向后打开，胸部前挺 |
| 动作库 | 标准俯卧撑 | `push-up` | 3.4 秒 | 胸大肌、肱三头肌、腹直肌、三角肌 | 脚尖着地，身体保持直线，以脚尖为支点下放，双手固定 |
| 动作库 | 登山者 | `mountain-climber` | 2.8 秒 | 腹直肌、髂腰肌、三角肌 | 高平板支撑，左右膝交替提向胸口。髋部只小幅抬起，肩膀基本保持在手腕上方 |
| 动作库 | 卷腹 | `crunch` | 3.5 秒 | 腹直肌 | 仰卧屈膝，上背卷起，腰部贴地。演示双手沿大腿伸向膝盖的版本，不是双手扶耳 |
| 动作库 | 提踵 | `calf-raise` | 3.3 秒 | 小腿三头肌 | 双手叉腰，脚跟抬起，前脚掌着地，全身随之上移 |
| 动作库 | 罗马尼亚硬拉 | `romanian-deadlift` | 3.9 秒 | 腘绳肌、臀大肌、竖脊肌 | 双手持哑铃，膝盖微屈固定，髋部后移，背部平直，哑铃贴腿下放到膝盖下方 |
| 动作库 | 坐姿哑铃推举 | `dumbbell-shoulder-press` | 3.4 秒 | 三角肌、肱三头肌 | 坐在直立靠背凳上对握，哑铃从肩高推到头顶，手臂伸直但不锁死 |
| 动作库 | 哑铃弯举 | `biceps-curl` | 3.4 秒 | 肱二头肌、三角肌 | 反握，上臂贴住身体，只有前臂弯起。接近顶点时肘部略微前移 |
| 动作库 | 高脚杯深蹲 | `goblet-squat` | 3.7 秒 | 股四头肌、臀大肌、腹直肌 | 双手竖握哑铃贴在胸前。躯干比徒手深蹲更直立，下蹲更深 |
| 动作库 | 婴儿式 | `childs-pose` | 7.6 秒 | 竖脊肌、背阔肌 | 从四点跪姿后坐到脚跟，双手不动，手臂随之前伸。额头贴垫后保持两次缓慢呼吸 |

## 应用接入契约

应用只引用 `lottie/` 目录，不复制文件。`lottie-library/` 只用于预览和评审，禁止打包进应用。以下约定保持稳定：

- 动画路径为 `lottie/<主题>/<动作 ID>.json`，主题为 `light` 或 `dark`。两个主题的文件同名，打包时必须保留子目录。
- `index.json` 是一个数组。每项包含 `id`、`name`、`course`、`seconds`、`frames`、`posterFrame`、`fps`、`muscles` 和 `files`，类型定义见 `src/generate.ts` 中的 `IndexEntry`。
- `lottie/index.json` 中的 `course` 总是课程 ID。`lottie-library/index.json` 中的 `course` 为 `null`。
- `posterFrame` 是代表帧的帧号，从 0 开始，小于 `frames`。系统关闭动画或开启「减少动态效果」时，应用应该显示这一帧，不显示第 0 帧。
- 代表帧默认取一个循环中肌群发力总和最大的时段的中点，例如深蹲的最低点。动作脚本可以用 `poster` 字段指定其他位置。
- 动画文件缺失或无法解析时，应用应该显示原有的插画或图标。
- 修改动作 ID、目录结构或 `index.json` 字段之前，必须同时更新 iOS 和 Android 的引用代码。

iOS 和 Android 的示例代码见 [接入说明](docs/integration.md)。

## 技术规格

| 项目 | 值 |
| --- | --- |
| 画布 | 512×512，侧视角，人物朝右 |
| 帧率 | 60 fps，首帧和末帧相同，可以无缝循环 |
| Lottie 格式版本 | 5.7.4 |
| 单个文件 | 30 KB～215 KB |
| `lottie/` 单个主题合计 | 16 个文件，原始 1,550 KB，逐个文件 gzip 后合计 219 KB |
| `lottie-library/` 单个主题合计 | 9 个文件，原始 931 KB，逐个文件 gzip 后合计 138 KB |
| 图层类型 | 只用形状图层：路径、椭圆、矩形、填充和描边 |
| 未使用的特性 | 图片、表达式、蒙版、父子图层、文字 |
| 高亮色 | 与 `BojiTheme.accent` 一致：浅色 `#C7401F`，深色 `#FF7A4D` |
| 高亮不透明度 | 14%～80%，跟随发力曲线 |
| 地面阴影 | 半透明暗色。浅色不透明度 9%，叠在白色卡片上的对比度为 1.20:1。深色不透明度 55%，叠在 `#222220` 卡片上的对比度为 1.20:1 |

动画只用基础形状图层。lottie-ios、lottie-android 和 lottie-web 的功能支持表都包含这些特性，但原生渲染尚未验证。

## 验证

已验证（2026-10-20）：

- `pnpm typecheck` 没有类型错误。`pnpm check` 确认 `lottie/` 的 33 个文件和 `lottie-library/` 的 19 个文件与源码一致。
- TypeScript 生成器的输出与迁移前的 JavaScript 生成器逐字节一致。
- 新增动作库的共享代码改动（`compose.ts`、`common.ts`、`equipment.ts`）后，原有 16 个动作的 32 个文件没有变化。
- lottie-web 5.13.0 在 Chromium 无头内核中渲染了全部 50 个文件，用于生成两张总览图，没有报错。
- 25 个动作逐帧求解 IK，没有手脚够不到目标点的帧。
- 拆分目录和新增 `posterFrame` 后，25 个浅色文件没有变化。25 个深色文件只有地面阴影的不透明度从 32% 改为 55%。
- 25 个动作的代表帧都经过人工查看，没有动作需要单独指定 `poster`。
- Android 端用 lottie-compose 6.7.1 接入 `lottie/`，在 API 36 模拟器上播放了 `bodyweight-squat`，浅色和深色都正常。这一条来自 Android 任务的回报（2026-10-20 21:41，UTC+8）。
- 预览页在浅色和深色下各加载了 25 个动画，5 个分组的卡片数与 `src/courses.ts` 一致。暂停后画面保持不变，页面没有报错。

未验证：

- lottie-ios 的原生渲染效果。lottie-android 只看过 `bodyweight-squat` 一个动作。浏览器中的渲染结果不能代替原生验收。
- 真机上的 CPU、内存和电量开销。
- 动作细节没有经过教练或康复专业人员审核。

## 限制

- 只有侧视角。左右对称的动作只能完整展示近侧肢体。
- 器械是通用造型，不对应具体品牌。
- 肌肉高亮是示意，不代表肌电测量数据。

## 下一批候选动作

以下动作是常见的入门动作，还没有动画。现有道具有哑铃和带直立靠背的训练凳，训练凳的造型在 `src/exercises/dumbbell-shoulder-press.ts` 中。

| 动作 | 类别 | 需要新增的内容 |
| --- | --- | --- |
| 单臂哑铃划船 | 背部 | 平板训练凳。把训练凳造型移到 `equipment.ts` 并支持去掉靠背 |
| 保加利亚分腿蹲 | 下肢 | 平板训练凳，同上 |
| 腿屈伸 | 器械 | 新的器械造型 |
| 侧平板支撑 | 核心 | 正面视角骨骼，当前骨骼只支持侧视角 |
| 开合跳 | 有氧 | 正面视角骨骼 |
