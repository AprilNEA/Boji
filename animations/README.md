# Boji 动作动画

本目录生成 1,583 个动作的 Lottie 动画。动画由 TypeScript 程序生成，不含第三方素材，每个动作有浅色和深色两个版本。应用的 14 门课程共用 68 个动作，按打包方式分为三类：

- 内置课程：4 门课程的 16 个动作在 `lottie/`。应用打包这个目录，离线也能播放。
- 远端课程：另外 10 门课程新增 52 个动作。全部 68 个课程动作都写在资产目录 `../assets/public/animations/exercises/v1/`，应用从资产主机 `assets.leanmuscle.club` 下载不在 `lottie/` 中的动作，见「发布到资产主机」一节。`lottie/` 和资产目录都随源码提交。
- 动作库：其余 1,515 个动作没有编入课程，生成到 `lottie-library/`。Git 忽略这个目录，动作库只提交源码。

许可范围见仓库根目录 `README.md` 的「许可证」一节。远端课程的 52 个动作的源码在动作库目录中，适用动作库的单独许可。文件名就是动作 ID。课程动作的 ID 与 iOS `Exercise.id` 和 Android `Workout.kt` 一致，应用按 ID 加载。

课程动作的关键帧总览见 [浅色总览图](docs/contact-sheet-light.jpg) 和 [深色总览图](docs/contact-sheet-dark.jpg)。每行是一个动作，共 68 行。前 4 列分别是循环的 0%、25%、50% 和 75% 处，第 5 列虚线框中是代表帧。动作库按动作组用 `scripts/family.ts` 审查，不进总览图。

## 快速开始

你必须先安装 [devenv](https://devenv.sh)。仓库根目录的 `devenv.nix` 提供 Node.js 26 和 pnpm 12。TypeScript 和 tsx 是 `package.json` 中的开发依赖，版本由 `pnpm-lock.yaml` 锁定。

生成器的数学和路径计算由以下库完成，不手写：向量和旋转用 gl-matrix，缓动、插值和关键帧映射用 d3-ease、d3-interpolate 和 d3-scale，曲线和圆弧用 d3-shape、d3-path 和 svgpath，颜色用 d3-color，脊柱曲线用 bezier-js，取值限制和取整用 es-toolkit。这些库的许可证都是 MIT、ISC 或 BSD-3-Clause。源码中跨目录的导入使用 `@/` 别名，它指向 `src/`。

1. 在仓库根目录运行 `devenv shell`。如果你使用 direnv，运行一次 `direnv allow`，之后进入仓库时环境会自动加载。devenv 加载环境时会在 `animations/` 中运行 `pnpm install`。
2. 进入 `animations/` 目录。
3. 运行 `pnpm build`，重新生成 `lottie/`、`lottie-library/` 和资产目录。全量生成约需 20 秒，`lottie-library/` 约 320 MB。
4. 运行 `pnpm check`，确认 `lottie/` 和资产目录与源码一致，并且没有 IK 警告。

在仓库根目录运行 `devenv test`，会依次执行 `pnpm typecheck` 和 `pnpm check`。

如果 `pnpm <脚本>` 报 `listen EPERM`，说明当前环境不允许 tsx 命令行建立本地通信 socket。这时改用 `node --import tsx <文件>` 运行同一个脚本，例如 `node --import tsx scripts/check.ts`。

## 生成方式

动画不是从 After Effects 导出的。生成器用代码描述每个动作，再直接写出 Lottie JSON：

1. 侧视动作用 `src/rig/side.ts` 的二维骨骼，包括骨盆、两段脊柱、颈、头和四肢。左右方向的动作，例如侧平举和开合跳，用 `src/rig/front.ts` 的三维骨骼，从正面投影到画布。
2. 每个动作脚本提供姿态函数 `pose(t)`。脚本给出髋部位置、脊柱角度和手脚的目标点，骨骼用两段式反向运动学（IK）求出关节角度。
3. `src/compose/index.ts` 按视角选择合成器，以 60 fps 逐帧求解姿态，再把逐帧结果压缩成线性关键帧。位置误差上限为 0.2 px，旋转误差上限为 0.2°。
4. 躯干轮廓逐帧变形。肌肉高亮的不透明度跟随发力曲线变化。器械的把手、横杆、钢索、弹力带、踏板、配重片和哑铃跟随手脚运动。
5. 合成器按人物和器械在整个循环中的范围自动缩放和居中，使画面不出界。

同一份源码每次生成的文件逐字节一致。`pnpm check` 依靠这一点判断生成的文件是否过期。

## 目录结构

| 路径 | 内容 | 是否提交 |
| --- | --- | --- |
| `lottie/` | 内置课程的动画：`light/` 和 `dark/` 各 16 个 JSON，以及 `index.json` | 提交，应用打包 |
| `lottie-library/` | 没有编入课程的动作库动画：`light/` 和 `dark/` 各 1,515 个 JSON，以及 `index.json`。由 `pnpm build` 生成 | 不提交，应用不打包 |
| `src/` | 生成器源码 | 提交 |
| `src/exercises/common.ts` | 共享的地面高度和基础姿态，例如高平板支撑 `HIGH_PLANK` | 提交 |
| `src/exercises/course/` | 内置课程的 16 个动作，每个动作一个脚本 | 提交 |
| `src/exercises/equipment/` | 共享器械：自由重量、训练凳、引体杆、双杠、绳索、小器械和固定器械部件 | 提交 |
| `src/exercises/library/` | 动作库的 1,567 个动作，按 44 个动作组分目录，其中 52 个编入了远端课程。编写规则见目录中的 `AGENTS.md` | 提交 |
| `scripts/` | 校验、预览、审查和渲染脚本 | 提交 |
| `docs/` | 课程动作的关键帧总览图和接入说明 | 提交 |
| `preview/index.html` | 离线预览页 | 提交 |
| `preview/data.js`、`preview/lottie.min.js` | `pnpm preview` 生成的预览数据和播放器 | 不提交 |
| `.renders/` | `pnpm render` 输出的 PNG | 不提交 |
| `../assets/public/animations/exercises/v1/` | 资产目录：全部课程动作的动画，`light/` 和 `dark/` 各 68 个 JSON，以及 `index.json`。资产主机发布这个目录 | 提交 |

`src/` 中各模块的职责如下：

| 文件 | 职责 |
| --- | --- |
| `exercise.ts` | 动作脚本的类型契约，包括侧视和正视两种动作 |
| `courses.ts` | 课程和动作库的注册表。`COURSES` 列出 14 门课程，`bundled` 表示课程动画是否随应用打包。课程中的动作顺序与应用一致，一个动作可以属于多门课程 |
| `math/vec2.ts` | 二维向量、角度、插值和 `clamp` |
| `math/vec3.ts` | 三维向量、旋转和身体坐标系 |
| `math/timeline.ts` | 缓动、关键帧取值和分阶段时间轴 |
| `draw/lottie.ts` | Lottie 形状、路径、颜色和关键帧压缩 |
| `draw/palettes.ts` | 浅色和深色配色 |
| `rig/ik.ts` | 二维和三维的两段式 IK |
| `rig/side.ts` | 侧视骨骼求解、人物形象和肌肉区域 |
| `rig/anatomy.ts` | 侧视关节方向检查：髋后伸、膝反向、颈部弯折和脊柱折角，供 `scripts/inspect.ts` 使用 |
| `rig/front.ts` | 正视三维骨骼求解、投影和肌肉区域 |
| `compose/index.ts` | 按视角把一个动作和一套配色合成为一个 Lottie 动画 |
| `compose/side.ts` | 侧视动作的合成器 |
| `compose/front.ts` | 正视动作的合成器 |
| `compose/shared.ts` | 两种视角共用的合成逻辑：自动缩放、器械范围和地面 |
| `build/poster.ts` | 选择代表帧 |
| `build/generate.ts` | 写出 `lottie/`、`lottie-library/`、资产目录和各自的 `index.json` |
| `build/cli.ts` | `pnpm build` 的命令行入口 |
| `build/assets.ts` | `pnpm build:assets` 的命令行入口，只写资产目录 |

模块只按 `math/` → `draw/` → `rig/` → `compose/` → `build/` 的方向导入。动作脚本只导入 `math/`、`draw/`、`rig/`、`exercise.ts`、`exercises/common.ts` 和 `exercises/equipment/`，不导入 `compose/` 或 `build/`。

## 命令

以下命令都在 devenv 环境中的 `animations/` 目录运行。

| 命令 | 作用 |
| --- | --- |
| `pnpm build` | 重新生成 `lottie/`、`lottie-library/` 和资产目录，并删除已离开某个目录的动作文件。后面加动作 ID 时只重写这些动作的文件，`index.json` 总是列出本目录的全部动作。`--out <目录>` 把 `lottie/` 和 `lottie-library/` 写到其他根目录下，资产目录随之写到 `<目录>/catalog`。`--catalog <目录>` 单独指定资产目录 |
| `pnpm build:assets` | 只重新生成资产目录，见「发布到资产主机」一节 |
| `pnpm check` | 在临时目录重新生成，并与 `lottie/` 和资产目录逐字节比对。文件不一致、缺少或多出，或任何动作（包括动作库）出现 IK 警告时，退出码为 1 |
| `pnpm typecheck` | 用 `tsc --noEmit` 检查类型 |
| `pnpm preview [<动作 ID>...]` | 生成预览数据，包含资产目录中的全部课程动作和指定的动作库动作。运行后用浏览器打开 `preview/index.html` |
| `pnpm sheets` | 渲染全部 68 个课程动作的 `docs/contact-sheet-light.jpg` 和 `docs/contact-sheet-dark.jpg` |
| `pnpm render <文件>` | 把指定的 JSON 文件各渲染成 8 张 PNG，输出到 `.renders/` |
| `pnpm family <动作组> --out <目录> [<动作 ID>...]` | 检查并生成一个动作组，渲染审查图。用法见 `src/exercises/library/AGENTS.md` |
| `node --import tsx scripts/inspect.ts <动作组> <动作 ID>` | 逐帧输出一个动作的 IK 警告、关节角度、地面接触和侧视关节方向问题，有问题时退出码为 1 |
| `pnpm gallery <目录>` | 渲染器械图鉴：每种器械放在站立人物旁边 |
| `pnpm readme` | 渲染根目录 README 使用的动作图片，写到 `../assets/public/previews/`：课程动作的代表帧 PNG，以及脚本中 `GIFS` 所列动作的循环 GIF。浅色和深色各一套。源码在 `src/exercises/course/` 的动作写到 `course/`，其余动作写到 `library/`，课程使用的动作库动作也写到 `library/`。先运行 `pnpm build`，因为脚本读取资产目录和 `lottie-library/` |

`pnpm sheets`、`pnpm render`、`pnpm family`、`pnpm gallery` 和 `pnpm readme` 需要 Chromium 无头内核。运行一次 `pnpm exec playwright-core install chromium-headless-shell` 安装内核，或用环境变量 `CHROME_PATH` 指定本机的 Chromium。

## 修改动作

1. 编辑动作脚本。内置课程的 16 个动作在 `src/exercises/course/<动作 ID>.ts`，其余动作在 `src/exercises/library/<动作组>/<动作 ID>.ts`，包括远端课程的动作。每个脚本默认导出一个动作对象，包含时间轴 `tl`、姿态函数 `pose(t)` 和高亮肌群 `muscles`。器械动作还包含固定器械 `props` 和活动部件 `dynamic`。类型定义在 `src/exercise.ts` 中。
2. 如果要改身体比例、部件形状或肌肉区域，编辑 `src/rig/side.ts` 或 `src/rig/front.ts`。如果要改颜色，编辑 `src/draw/palettes.ts`。这些文件的修改会影响全部动作。
3. 运行 `pnpm build`。如果某一帧的手脚够不到目标点，输出中会出现 `WARN`，退出码为 1。
4. 课程动作运行 `pnpm sheets` 和 `pnpm preview`，动作库动作运行 `pnpm family`，检查画面。
5. 课程动作运行 `pnpm readme`，更新根目录 README 的动作图片。
6. 运行 `pnpm typecheck` 和 `pnpm check`，然后把源码、`lottie/`、资产目录、总览图和 `../assets/public/previews/` 一起提交。不要提交 `lottie-library/`。

修改内置课程的动作会改变 `lottie/`，应用发布新版本后才显示新动画。只修改远端课程的动作时，资产主机发布资产目录后，应用按 `index.json` 中变化的 `sha256` 重新下载，不需要发布新版本。

新增动作时，新建脚本，再注册：

- 新动作放进 `src/exercises/library/` 中对应的动作组。生成器自动发现动作组中的脚本，不需要注册。
- 课程使用动作库中的动作时，在 `src/courses.ts` 的 `COURSES` 中用 `lib('<动作 ID>')` 引用它，不移动脚本，再运行 `pnpm build`。`LIBRARY` 自动排除课程动作，所以它的动画文件会从 `lottie-library/` 移走。远端课程（`bundled: false`）的动作只写到资产目录，内置课程（`bundled: true`）的动作同时写到 `lottie/` 和资产目录。
- 新课程默认设为远端课程，因为内置动画会增大两个应用的安装包。动作 ID 必须与应用中的 `Exercise.id` 一致。新课程还要同时修改 iOS 的 `WorkoutLibrary`、Android 的 `Workout.kt` 和 `locales/` 中的课程与动作文案，见仓库根目录 `AGENTS.md` 的「Exercise IDs」一节。
- 动作 ID 在全部动作中必须唯一。ID 重复时，生成器报错并停止。

## 动作清单

内置课程的 16 个动作：

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

10 门远端课程的动作。标有「内置」的动作来自内置课程，不需要下载：

| 课程 | `id` | 动作数 | 动作 |
| --- | --- | --- | --- |
| 居家强化训练 | `home-strength` | 6 | 标准俯卧撑、徒手分腿蹲、单腿臀桥、凳上反向臂屈伸、俯卧超人挺身、自重前臂侧平板支撑 |
| 核心训练 | `home-core` | 6 | 卷腹、反向卷腹、自行车卷腹、俄罗斯转体、仰卧交替打腿、平板支撑（内置） |
| 燃脂循环 | `home-cardio` | 6 | 开合跳、扶墙高抬腿、登山者、深蹲跳、熊爬、波比跳 |
| 哑铃居家训练 | `home-dumbbell` | 6 | 哑铃高脚杯深蹲、哑铃地板卧推、哑铃俯身划船、哑铃罗马尼亚硬拉、哑铃后撤弓步蹲、哑铃侧平举 |
| 自由重量入门 | `gym-free-weights` | 6 | 哑铃高脚杯深蹲、哑铃卧推、哑铃俯身划船、哑铃罗马尼亚硬拉、哑铃坐姿肩上推举、哑铃弯举 |
| 上肢器械训练 | `gym-upper` | 6 | 器械推胸、器械肩上推举、器械辅助引体向上、蝴蝶机夹胸、绳索面拉、绳索绳把下压 |
| 下肢器械训练 | `gym-lower` | 6 | 坐姿腿举（内置）、器械腿屈伸、器械坐姿腿弯举、坐姿髋外展、坐姿髋内收、罗马椅背部伸展 |
| 训练后下肢拉伸 | `stretch-lower` | 5 | 站姿腘绳肌拉伸、俯卧股四头肌拉伸、仰卧四字臀肌拉伸、跑步弓步拉伸、扶墙站姿小腿拉伸 |
| 久坐肩颈放松 | `stretch-desk` | 5 | 颈部侧屈拉伸、交叉抱臂肩部拉伸、过顶肱三头肌拉伸、坐椅胸肩拉伸、坐姿椅上腘绳肌拉伸 |
| 晨间唤醒 | `morning-wake-up` | 5 | 世界最佳拉伸、毛毛虫爬行、徒手早安式体前屈、仰卧抱膝拉伸、婴儿式 |

每个动作的 ID、循环时长、代表帧和高亮肌群以资产目录的 `index.json` 为准。

动作库的 1,567 个动作来自两份公开动作数据集的文字说明和分类，去重后由本仓库原创绘制，不使用数据集的图片。动作按动作组分目录，例如 `push-up`、`squat`、`core-flexion`。每个脚本的 `meta.sources` 记录它对应的数据集条目。其中 52 个动作编入了远端课程，其余 1,515 个的清单以 `lottie-library/index.json` 为准。

## 应用接入契约

应用打包 `lottie/`，不复制文件，并从资产主机下载远端课程的动作。`lottie-library/` 只用于预览和评审，禁止打包进应用，应用也不下载动作库。以下约定保持稳定：

- 动画路径为 `<目录>/<主题>/<动作 ID>.json`，主题为 `light` 或 `dark`。两个主题的文件同名，打包时必须保留子目录。
- `index.json` 是一个数组。每项包含 `id`、`name`、`course`、`courses`、`seconds`、`frames`、`posterFrame`、`fps`、`muscles`、`files` 和 `sha256`，类型定义见 `src/build/generate.ts` 中的 `IndexEntry`。
- `courses` 按 `COURSES` 的顺序列出使用这个动作的全部课程 ID。`course` 是其中第一个，供只读这个字段的应用使用。`lottie-library/index.json` 中的 `course` 为 `null`，`courses` 为空数组。
- `sha256` 是 `light` 和 `dark` 两个文件内容的 SHA-256，64 个小写十六进制字符。应用用它校验下载的文件，并判断缓存是否过期。
- `posterFrame` 是代表帧的帧号，从 0 开始，小于 `frames`。系统关闭动画或开启「减少动态效果」时，应用应该显示这一帧，不显示第 0 帧。
- 代表帧默认取一个循环中肌群发力总和最大的时段的中点，例如深蹲的最低点。动作脚本可以用 `poster` 字段指定其他位置。
- 应用先查打包的 `lottie/index.json`。动作在其中时只用打包的文件，不发网络请求。其余课程动作从资产目录下载，校验 `sha256` 后存入本地缓存。
- 动画文件缺失、下载失败、校验失败或无法解析时，应用应该显示原有的插画或图标，训练不受影响。
- `index.json` 以后可能新增字段。应用解析时必须忽略未知字段。
- 修改动作 ID、目录结构或 `index.json` 字段之前，必须同时更新 iOS 和 Android 的引用代码。已发布的应用会读取资产主机上的 `index.json`，所以不兼容的改动必须升级 `v1`，见下一节。

iOS 和 Android 的示例代码和远端载入规则见 [接入说明](docs/integration.md)。

## 发布到资产主机

`pnpm build` 和 `pnpm build:assets` 把全部 68 个课程动作写到仓库根目录的资产目录 `assets/public/animations/exercises/v1/`，包括内置课程的 16 个动作。Git 跟踪这个目录。资产主机按原路径提供 `assets/public/` 中的文件，所以发布后的地址如下：

| 文件 | 地址 |
| --- | --- |
| 索引 | `https://assets.leanmuscle.club/animations/exercises/v1/index.json` |
| 动画 | `https://assets.leanmuscle.club/animations/exercises/v1/<主题>/<动作 ID>.json` |

- `index.json` 的字段与应用接入契约相同。它只列出课程动作，不列出动作库动作。
- 内置课程的动作也在资产目录中，这样资产目录列出全部课程动作。应用优先使用打包的文件，不下载这些动作。
- `v1` 是 `index.json` 的格式版本。只有不兼容现有读取方的改动才升级版本，同时保留旧目录，因为已发布的应用仍读取旧目录。
- 资产目录共 137 个文件，约 14.6 MB，逐个文件 gzip 后约 1.9 MB。
- 后面加动作 ID 时只重写这些动作的文件，`index.json` 总是列出全部课程动作。`--out <目录>` 把资产目录写到其他位置。
- 任何动作出现 IK 警告时，命令仍写出全部文件，但退出码为 1。参数错误时退出码为 2。

发布步骤：

```sh
devenv shell                    # 在仓库根目录
cd animations
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build:assets               # 只重写 ../assets/public/animations/exercises/v1/
pnpm check                      # 确认 lottie/ 和资产目录与源码一致
```

推送到 `master` 后，资产主机的部署流程自动发布 `assets/public/`。本仓库不包含部署配置。2026-10-22 00:05（UTC+8）检查时，`https://assets.leanmuscle.club/animations/exercises/v1/index.json` 返回 404，资产目录尚未发布。

## 技术规格

| 项目 | 值 |
| --- | --- |
| 画布 | 512×512，人物朝右的侧视角，或正视角 |
| 帧率 | 60 fps，首帧和末帧相同，可以无缝循环 |
| Lottie 格式版本 | 5.7.4 |
| 单个文件 | 32 KB～446 KB |
| `lottie/` 单个主题合计 | 16 个文件，原始 1,714 KB，逐个文件 gzip 后合计 236 KB |
| 资产目录单个主题合计 | 68 个文件，原始 7,445 KB，逐个文件 gzip 后合计 948 KB |
| `lottie-library/` 单个主题合计 | 1,515 个文件，原始约 164 MB，逐个文件 gzip 后合计约 20 MB |
| 图层类型 | 只用形状图层：路径、椭圆、矩形、填充和描边 |
| 未使用的特性 | 图片、表达式、蒙版、父子图层、文字 |
| 高亮色 | 与 `BojiTheme.accent` 一致：浅色 `#C7401F`，深色 `#FF7A4D` |
| 高亮不透明度 | 14%～80%，跟随发力曲线 |
| 地面阴影 | 半透明暗色。浅色不透明度 9%，叠在白色卡片上的对比度为 1.20:1。深色不透明度 55%，叠在 `#222220` 卡片上的对比度为 1.20:1 |

动画只用基础形状图层。lottie-ios、lottie-android 和 lottie-web 的功能支持表都包含这些特性，但原生渲染尚未验证。

## 验证

已验证（2026-10-22 00:58，UTC+8），在 14 门课程编排完成后：

- 类型检查（`tsc --noEmit`）没有错误。全量生成 1,583 个动作的 3,166 个动画文件，没有 IK 警告和构图警告。`check` 确认 `lottie/` 的 33 个文件和资产目录的 137 个文件与源码一致。
- `lottie/` 的 16 个动作的动画文件没有变化，`index.json` 只新增了 `courses` 和 `sha256` 字段。
- 逐帧校验动作库的 1,567 个动作，IK、关节低于地面、合成警告和缩放都没有问题。校验脚本把 52 个编入课程的动作报告为「ID 与课程动作重复」。这条规则来自编课之前，这些动作通过 `lib()` 编入课程，所以属于预期结果。
- 用 `src/rig/anatomy.ts` 的规则逐帧检查 1,309 个侧视动作，没有问题。转角扫描标记 108 个动作，与 2026-10-21 的结果相同。
- 52 个新编入课程的动作：`scripts/inspect.ts` 逐个检查，没有 IK 和关节方向问题；审查图全部经过人工查看。侧视骨骼画不出侧卧股四头肌拉伸，所以 `stretch-lower` 课程改用俯卧股四头肌拉伸，并修正了共用的 `proneQuad` 姿态。
- 两端的远端载入只用假传输层测试过，结果见[接入说明](docs/integration.md)的状态表。

已验证（2026-10-21，UTC+8）：

- `pnpm typecheck` 没有类型错误。`pnpm check` 确认 `lottie/` 的 33 个文件与源码一致。
- 全量生成 1,583 个动作的 3,166 个动画文件，没有 IK 警告和构图警告。
- 逐帧校验动作库的 1,567 个动作，0 个有问题。校验项为 IK、关节低于地面、合成警告和缩放。校验脚本不在仓库中。
- 用 `src/rig/anatomy.ts` 的规则逐帧检查 1,309 个侧视动作，没有髋后伸、膝反向、颈部弯折或脊柱折角超限。258 个正视动作不适用这项检查。
- 关节方向修复改动了 27 个动作组的 115 个动作。这 27 个动作组的审查图都经过人工查看，其中 18 个动作按数据集原文再次手动修正。
- 改用数学库和 `@/` 别名后，全部 3,177 个输出文件逐帧比对：2,449 个逐字节一致，其余 728 个的逐帧差异都在关键帧压缩的误差范围内。最大差异为旋转 0.20°、路径 0.10 px、位置 0.01 px。
- `src/` 按 `math/`、`draw/`、`rig/`、`compose/`、`build/` 和 `exercises/` 重新分目录后，全量生成的 3,176 个动画文件与整理前逐字节一致，`lottie/index.json` 没有变化。
- 课程动作的两张总览图由 lottie-web 5.13.0 在 Chromium 无头内核中渲染，16 个动作的姿态经过人工查看。
- 课程动作的 `lottie/index.json` 在人物形象更新后没有变化，动画文件只有画面变化。

已验证（2026-10-20，UTC+8）。以下各条针对人物形象更新前的 `lottie/`，更新后未在原生端复验：

- Android 端用 lottie-compose 6.7.1 接入 `lottie/`，在 API 36 模拟器上播放了 `bodyweight-squat`，浅色和深色都正常。关闭系统动画后，深蹲在两种主题下都停在代表帧 106/210。安装包中只有 `lottie/` 的 33 个文件，没有 `lottie-library/` 的文件。这一条来自 Android 任务的回报（2026-10-20 22:09，UTC+8）。
- iOS 端用 lottie-ios 4.6.1 的解码器成功解析了 `lottie/` 中的 32 个动画文件，Debug 和 Release 编译通过。这一条来自 iOS 任务的回报（2026-10-20 22:14，UTC+8）。

未验证：

- 动作库没有全部经过人工审查。人工查看过的只有修复涉及的动作组和 52 个编入课程的动作，其余动作只通过了自动校验。自动校验发现不了手未握器械、姿势误读等错误。
- 转角扫描标记了 108 个动作的大角度旋转，没有逐一复核。其中一部分是正常动作，例如双力臂中上臂从头顶转到体侧。
- 341 个动作至少有一帧的肘部看起来反向超过 20°（2026-10-22 统计）。侧视中上臂旋转会让正确的肘部看起来反向，所以这一项只报告，没有逐一复核。
- lottie-ios 的原生渲染效果。lottie-android 只目视检查过 `bodyweight-squat` 一个动作。浏览器中的渲染结果不能代替原生验收。
- 真机上的 CPU、内存和电量开销。
- 从真实的资产主机下载。资产目录尚未发布。
- 动作细节没有经过教练或康复专业人员审核。

## 限制

- 一个动作只用一个视角。侧视动作只能完整展示近侧肢体，正视动作看不出前后方向的移动。
- 器械是通用造型，不对应具体品牌。需要搭档或无法画清楚的器械的动作没有动画。
- 肌肉高亮是示意，不代表肌电测量数据。
