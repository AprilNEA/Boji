# iOS 动作动画

版本 `0.7.0 (7)` 已加入动画加载和播放代码。动画采用 Lottie 4.6.1，资源来自应用内的课程目录。播放不需要账号或联网。

## 使用入口

在「训练」中打开课程，再点击动作行，即可查看动作演示。详情页支持循环播放、暂停、半速播放和代表姿势。主要肌群来自动画索引，组数与次数仍来自课程模型。

开始训练后，当前动作使用同一播放器。暂停训练时，动画保留当前位置。休息时移除播放器，显示静态休息图标。完成训练后停止动画，不自动增加次数或组数。

演示速度只帮助观察，不代表训练节拍。动画未经过教练或康复专业人员审核，不能作为个性化训练处方。

## 播放与资源规则

| 情况 | 处理 |
| --- | --- |
| 正常演示 | 完整动作循环，仅播放当前动作 |
| 暂停 | 保留当前位置，不跳回第 0 帧 |
| 减少动态效果 | 显示索引的 `posterFrame`，禁止自动播放 |
| 查看代表姿势 | 暂停并显示 `posterFrame` |
| App 进入后台 | 停止播放，训练和详情需要主动继续 |
| 页面离开可见区域 | 停止播放，释放窗口时额外暂停 |
| App 切换深浅色 | 使用 App 实际外观，载入对应资源 |
| 缺失或损坏资源 | 显示动作图标和提示，保留训练功能 |

`ExerciseAnimationCatalog` 按动作 ID 查找资源，不依赖索引顺序。目录校验会拒绝重复 ID、非法帧数和越界代表帧。资源路径只能指向对应主题的本地文件。

`ExerciseAnimationLoader` 在后台读取和解析 JSON。缓存最多保存 8 个动画对象。取消或过期的加载结果不能覆盖新动作。主题切换会暂时保留旧图像，加载完成后沿用播放位置。

`ExerciseAnimationHost` 桥接官方 `LottieAnimationView`。引擎采用自动选择模式，优先使用 Core Animation。完整循环使用 `play()`，不会把暂停点变成下一轮的起点。

## 工程与开发

XcodeGen 通过 folder reference 引用 `../animations/lottie`。应用保留 `lottie/light/` 和 `lottie/dark/` 两个子目录。禁止打包 `lottie-library/`。

依赖版本固定在 `project.yml`，解析结果保存在 `Package.resolved`。工程排除 `*.tmp` 资源，避免依赖未跟踪的工具临时文件。欢迎页和课程卡也使用 `ExerciseAnimationView`：欢迎页循环播放，课程卡只显示代表姿势。这两处设置 `isDecorative`，不进入辅助功能树。

测试入口只在 Debug 的 `--uitesting` 模式启用。`--animation-reduce-motion` 注入静态显示场景，`--animation-missing-asset` 注入资源缺失场景。Release 忽略这两个参数。

## 验证记录

2026-10-20（UTC+8）已完成 13 项 macOS 宿主测试。测试涵盖索引校验、播放优先级和损坏 JSON。官方 Lottie 解码器成功读取 32 个课程动画。

这项结果仅证明原生解码成功，不代表 iOS 渲染通过。模拟器控制仍处于暂停状态，本轮未运行 iOS 界面测试，也未生成动画运行截图。

已添加待运行的原生测试和 4 项界面测试。测试覆盖课程资源、代表帧、播放暂停、主题、减少动态效果及缺失资源回退。Debug 应用与测试目标编译通过，Release 应用编译通过。

最终构建使用新的 DerivedData 目录。记录在仓库根目录的 `.work/boji-ios/lottie/`：`host-tests.log`、`final-debug.log` 和 `final-release.log`。这次没有安装新版本，模拟器中仍可能是旧版本。

真机性能、电量、完整 VoiceOver 操作和专业动作准确性均未验证。本轮未修改动画源文件、后端协议或健康数据逻辑，也未提交或推送。

## 接口依据

- [Lottie 官方播放说明](https://github.com/airbnb/lottie/blob/master/ios.md)
- [Lottie 4.6.1 动画视图源码](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationView.swift)
- [Lottie 4.6.1 动画时间轴源码](https://github.com/airbnb/lottie-ios/blob/4.6.1/Sources/Public/Animation/LottieAnimationLayer.swift)
- [项目动画接入契约](../../animations/docs/integration.md)
