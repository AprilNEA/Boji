/**
 * 首页 App 介绍的文案和数据。
 * 截图和动作图在仓库根目录的 assets/public/，由 https://assets.leanmuscle.club 提供。
 * 课程和动作名称与 locales/zh-Hans/ 的 course、exercise 分组一致，时长与 ios/Boji/Models/BojiStore.swift 一致。
 */

const ASSETS = "https://assets.leanmuscle.club";

export const APP_STORE_URL = "https://apps.apple.com/app/id6824964768";

export const APP_ICON = `${ASSETS}/boji-icon.png`;

const iphone = (screen: string) => `${ASSETS}/screenshots/apple/iphone/zh-Hans/${screen}.png`;

export const SCREENS = {
  today: { src: iphone("today"), alt: "今天页：训练、饮水和睡眠的打卡状态，以及今日推荐课程" },
  training: { src: iphone("training"), alt: "训练页：居家训练和健身房训练两组课程" },
  exercise: { src: iphone("exercise"), alt: "动作说明：深色模式下徒手深蹲的代表姿势、组数和主要肌群" },
  session: { src: iphone("session"), alt: "训练中：舒缓拉伸课程的猫牛式，第 1 组，共 2 组" },
  progress: { src: iphone("progress"), alt: "足迹页：累计训练、最近一周和体重记录" },
  settings: { src: iphone("settings"), alt: "设置页：会员卡与账号、Apple 健康和打卡状态共享" },
  watch: {
    src: `${ASSETS}/screenshots/apple/watch/zh-Hans/today/ultra-3-49mm/natural-ocean-band-anchor-blue.png`,
    alt: "Apple Watch Ultra 3 上的今日进度：已连接 iPhone，计划为居家训练，手动训练未记录，饮水和睡眠已记录",
  },
} as const;

export const EXERCISE_GIF = {
  src: `${ASSETS}/previews/course/light/bodyweight-squat.gif`,
  alt: "徒手深蹲的循环动画，臀部和大腿前侧标为发力肌群",
} as const;

export const exercisePoster = (id: string) => `${ASSETS}/previews/course/light/${id}.png`;

/** 每天三项打卡，各对应薄肌理论的一条原则。tone 是 globals.css 中的颜色令牌。 */
export const HABITS = [
  {
    habit: "训练",
    principle: "薄肌",
    value: "13%",
    unit: "",
    body: "穿衣显瘦，脱衣有肉。体脂长期低于 13%，不吃欺骗餐。",
    tone: "text-accent",
  },
  {
    habit: "饮水",
    principle: "大水",
    value: "1700",
    unit: "mL",
    body: "成年男性每天 1700 mL，成年女性每天 1500 mL 起。逐次累加，点一下就记。",
    tone: "text-water",
  },
  {
    habit: "睡眠",
    principle: "大睡",
    value: "7–9",
    unit: "小时",
    body: "每晚睡够 7–9 小时，不靠周末补觉。记下时长，第二天一眼看清。",
    tone: "text-sleep",
  },
] as const;

export const COURSES = [
  {
    title: "居家基础训练",
    subtitle: "无需器械的全身入门",
    minutes: 20,
    exercises: [
      { id: "bodyweight-squat", name: "徒手深蹲" },
      { id: "wall-push-up", name: "墙壁俯卧撑" },
      { id: "glute-bridge", name: "臀桥" },
      { id: "bird-dog", name: "鸟狗式" },
    ],
  },
  {
    title: "居家进阶训练",
    subtitle: "基础训练之后的下一步",
    minutes: 25,
    exercises: [
      { id: "reverse-lunge", name: "后撤步弓步蹲" },
      { id: "knee-push-up", name: "跪姿俯卧撑" },
      { id: "dead-bug", name: "死虫式" },
      { id: "wall-sit", name: "靠墙静蹲" },
      { id: "plank", name: "平板支撑" },
    ],
  },
  {
    title: "器械基础训练",
    subtitle: "轻重量熟悉常用器械",
    minutes: 30,
    exercises: [
      { id: "chest-press", name: "坐姿推胸" },
      { id: "seated-row", name: "坐姿划船" },
      { id: "leg-press", name: "坐姿腿举" },
      { id: "lat-pulldown", name: "高位下拉" },
    ],
  },
  {
    title: "舒缓拉伸",
    subtitle: "训练前后都可进行",
    minutes: 10,
    exercises: [
      { id: "cat-cow", name: "猫牛式" },
      { id: "hip-flexor-stretch", name: "髋屈肌拉伸" },
      { id: "chest-stretch", name: "开胸拉伸" },
    ],
  },
] as const;

export const PLATFORMS = [
  { label: "健康数据（只读）", ios: "Apple 健康：体重、腰围和睡眠", android: "Health Connect：体重和睡眠" },
  { label: "小组件", ios: "主屏幕和锁定屏幕", android: "主屏幕" },
  { label: "手表", ios: "Apple Watch", android: "Wear OS" },
] as const;

/** 首页页脚的编号声明。其他页面沿用 content.ts 的 FOOTNOTES。 */
export const APP_FOOTNOTES = [
  "课程、动作动画和动作要点是一般健身信息，不构成医疗建议或个性化训练处方。请选择适合自己的动作与强度，如有疼痛或不适，应停止训练。",
  "体脂 13%、每天 1700 mL 水、每晚 7–9 小时睡眠来自薄肌理论，是一种审美偏好和生活习惯主张，不是医学健康标准。饮水量参考《中国居民膳食指南（2022）》。",
  "截图使用测试数据。App 界面以实际版本为准。",
] as const;
