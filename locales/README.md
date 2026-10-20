# locales

`locales/` 存放 Android 和 iOS 都显示的文案。文案用 ICU MessageFormat 写在 YAML 文件中，每种语言一个目录。`crates/locales/` 中的生成器读取这些文件，生成两端的资源文件：

| 使用方 | 生成的文件 | 状态 |
| --- | --- | --- |
| Android | `android/app/src/main/res/values*/strings_shared.xml` | 已接入 |
| iOS | `ios/Shared/Shared.xcstrings` | 已接入。App、小组件和手表 App 共用这个 String Catalog |

禁止手工编辑生成的文件。修改文案时，编辑 `locales/`，再运行生成器。

## 目录结构

| 路径 | 内容 |
| --- | --- |
| `locales.yaml` | 源语言、回退语言、发布语言和已接入的使用方 |
| `meta/<分组>.yaml` | 每个键的参数、说明和使用方。各语言共用 |
| `<语言>/<分组>.yaml` | 一种语言的文案。目录名是 BCP 47 语言代码，例如 `zh-Hans`、`en`、`pt-BR` |

分组按界面划分，例如 `common`、`today`、`training`。同一个键只能属于一个分组。每个语言目录的分组文件名必须与 `meta/` 一致。

## 修改文案

1. 在 `zh-Hans/<分组>.yaml` 中修改文案。
2. 假如文案增加或删除了参数，同步修改 `meta/<分组>.yaml` 中这个键的 `args`。
3. 在 `crates/` 中运行 `cargo locales generate`。
4. 提交 `locales/` 的改动和生成的文件。

`cargo locales check` 只做检查，不写入文件。它在两种情况下失败：`locales/` 违反下文的规则，或者生成的文件与 `locales/` 不一致。

## 添加文案

1. 在 `meta/<分组>.yaml` 中添加键。键用小写蛇形命名，例如 `tab_today`。
2. 在 `zh-Hans/<分组>.yaml` 中写源语言文案。
3. 为每种发布语言写译文。
4. 运行 `cargo locales generate`，在代码中引用新键。

iOS 不直接写键名，而是引用 Xcode 生成的 Swift 符号。构建 iOS 工程后，Xcode 把每个键转换为 `LocalizedStringResource.Shared` 下的一个成员：

| 键 | Swift 符号 |
| --- | --- |
| `tab_today`，没有参数 | `.Shared.tabToday` |
| `session_set`，参数 `current`、`total`、`reps` | `.Shared.sessionSet(current:total:reps:)` |

用法见 `ios/AGENTS.md`。

没有参数和说明的键只写键名：

```yaml
# meta/session.yaml
session_rest:
session_set:
  comment: 训练中当前动作的组数进度
  args:
    current: int
    total: int
    reps: string
```

`comment` 是给译者的说明，Xcode 的 String Catalog 编辑器会显示它。

```yaml
# zh-Hans/session.yaml
session_rest: "休息一下"
session_set: "第 {current} / {total} 组 · {reps}"
```

`args` 的顺序就是参数的位置。Android 必须按这个顺序传参。参数名用小驼峰命名，例如 `activeDays`，因为 Xcode 用它作 Swift 参数标签。参数类型有两种：`string` 和 `int`。

`targets` 可以限定使用方，例如 `targets: [android]`。省略 `targets` 时，两端都使用这个键。

`locale_tag` 是保留键名，禁止在 `meta/` 中声明。生成器在每个 Android 文件中写入这个键，值是该文件的语言代码，例如 `zh-Hans`。Android 用它格式化日期和数字，所以它们的语言总与文字的语言一致。

## 写法约定

以下约定适用于所有语言。中文的标点按 GB/T 15834—2011《标点符号用法》，其他语言按该语言的习惯。

- 完整的句子用句号结尾，写成句子的标题也一样，例如「今天，轻一点。」。按钮、标签和名词短语不用句号。
- 中文的数值范围用浪纹线，例如「2～3 次」。英文用 en dash，例如「2–3 times」。
- 代码知道的数字用参数传入，不写进文案。例如今日进度的总数写成 `"/{total}"`，不写成 `"/3"`。
- 正文不写死换行，由布局决定在哪里折行。只有需要固定分行的大标题可以用 `\n`，例如 `welcome_title`。译者可以按目标语言调整分行。
- 间距交给布局，不用空格对齐。
- 对话框的标题是简短的问句或陈述，后果写在正文中。两端的正文内容不同时，只共享标题，例如 `settings_delete_confirm_title`。

## 文案语法

文案使用 ICU MessageFormat 的一个子集。生成器只接受两端都能表达的写法：

| 写法 | 含义 |
| --- | --- |
| `{name}` | 插入参数 `name` |
| `{days, plural, one {# day} other {# days}}` | 按 `days` 选择复数形式。`#` 代表 `days` 的值 |
| `''` | 一个撇号 |
| `'{'`、`'}'` | 字面的花括号 |

复数参数必须满足以下条件：

- 类型是 `int`，并且在 `args` 中排第一位。iOS 按第一个参数选择复数形式。
- 分支名使用 CLDR 复数类别，并且与这种语言的类别完全一致。中文只有 `other`，英文有 `one` 和 `other`，俄文有 `one`、`few`、`many` 和 `other`。
- 一条文案最多一个复数参数，复数参数不能嵌套。
- 假如源语言的文案有复数参数，其他语言的文案也必须有同一个复数参数。Android 把复数文案存为另一种资源类型。

生成器拒绝 `select`、`number`、`date`、`=0` 这样的精确值分支和 `offset`。文案也不能以空格开头或结尾，不能有连续空格或制表符，因为 Android 会改变它们。

## 添加语言

1. 新建语言目录，例如 `en/`，并按 `meta/` 的分组创建文件。
2. 翻译全部键。未发布的语言可以缺少键，生成器只检查已有的文案。
3. 翻译完成后，把语言代码加入 `locales.yaml` 的 `release`。
4. 运行 `cargo locales generate`。Android 会多出一个 `values-<语言>/strings_shared.xml`，`ios/Shared/Shared.xcstrings` 会多出这种语言的译文。
5. 在 `ios/` 中运行 `xcodegen generate`。XcodeGen 从 `Shared.xcstrings` 读取语言，并把它写入 `Boji.xcodeproj` 的 `knownRegions`。提交 `project.pbxproj` 的改动。

语言目录名必须是规范的 BCP 47 写法：`zh-Hans` 正确，`zh-hans` 和 `zh_CN` 错误。

## 平台独有的文案

只有一端显示的文案留在这一端：Android 写在 `values/strings.xml`，iOS 写在 Swift 代码中。另一端开始显示相同的文案时，把它移入 `locales/`。
