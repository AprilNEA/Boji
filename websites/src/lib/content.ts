export const IMG = {
  alan: "/images/portraits/alan.webp",
  sun: "/images/portraits/sun.webp",
  chicken: "/media/chicken.webp",
  broccoli: "/media/broccoli.webp",
  waterBottle: "/media/water-bottle.webp",
  ring: "/media/ring.webp",
  chip: "/media/chip.webp",
  stage: "/media/stage.webp",
  theoryGym: "/media/theory-gym.webp",
  lifestyle: "/media/lifestyle.webp",
  teeWhite: "/media/tee-white.webp",
  teeLineup: "/media/tee-lineup.webp",
  teeGreen: "/media/tee-green.webp",
  teeBlack: "/media/tee-black.webp",
} as const;

export const LAUNCH_FILM = {
  src: "/media/launch-film.mp4",
  poster: "/media/launch-film-poster.webp",
  duration: "0:21",
} as const;

export const CONTACT_EMAIL = "thinmuscle-club@proton.me";
export const DISCORD_URL = "https://discord.gg/Fwb5dchAw";

export const NAV_LINKS = [
  { href: "/theory/", label: "理论" },
  { href: "/pro/", label: "薄肌" },
  { href: "/compare/", label: "对比" },
  { href: "/founders/", label: "创始人" },
  { href: "/store/", label: "选购" },
  { href: "/join/", label: "入会" },
] as const;

export type Founder = {
  id: "alan" | "sun";
  name: string;
  en: string;
  title: string;
  shortTitle: string;
  image: string;
  quote: string;
  quoteSource: string;
  bio: string[];
  facts: { label: string; value: string }[];
};

export const FOUNDERS: Founder[] = [
  {
    id: "alan",
    name: "邵艾伦",
    en: "Alan",
    title: "薄肌理论创始人",
    shortTitle: "薄肌理论创始人",
    image: IMG.alan,
    quote: "“薄肌”只是一个载体。",
    quoteSource: "邵艾伦，X",
    bio: [
      "英语口语博主，全网粉丝千万。2026 年夏天，他开始系统讲述“薄肌理论”：穿衣显瘦，脱衣有肉，体脂长期保持在 13% 以下，并且不吃欺骗餐。",
      "随后，他又提出“黄毛理论”：不被外界评价左右，坚持自己判断过的方向。他认为薄肌真正的意义，是让年轻人把人生的控制权拿回来。",
      "他的另一句名言是：“薄肌理论，就是把多巴胺从游戏手里抢回来。”",
    ],
    facts: [
      { label: "核心主张", value: "体脂 < 13%" },
      { label: "关联理论", value: "黄毛理论" },
      { label: "口头禅", value: "Regardless of how you feel." },
    ],
  },
  {
    id: "sun",
    name: "孙宇晨",
    en: "Justin",
    title: "首席践行官 · 体脂 29%，进行中",
    shortTitle: "首席践行官",
    image: IMG.sun,
    quote: "我已经正式开始练了。",
    quoteSource: "孙宇晨，2026 年 10 月 10 日播客",
    bio: [
      "波场 TRON 创始人。2026 年 10 月 10 日，在与邵艾伦长达四个多小时的播客对谈中，他宣布自己已经正式开始练薄肌，当时刚练了两三天。",
      "他公开了自己的起点：身高 172 cm，体重约 75 kg，体脂约 29%，计划用 3 到 6 个月看效果。每天补充 25g 蛋白粉和 5g 肌酸，蛋白质目标 140–150g，并用 AI 拍照记录每一餐。",
      "他坦言，自己以前一直以为蛋白粉是“科技与狠活”。",
    ],
    facts: [
      { label: "起点体脂", value: "约 29%" },
      { label: "每日蛋白质", value: "140–150g" },
      { label: "预计周期", value: "3–6 个月" },
    ],
  },
];

/** 首页产品屏的四个参数：全部是薄肌理论里的真实主张。 */
export type ProductStat = {
  label: string;
  /** 进入视口时从 0 滚动计数到这个数；为空时直接显示 text。 */
  count?: number;
  text?: string;
  /** 跟数字同样大小的后缀，例如 %。 */
  suffix?: string;
  /** 缩小显示的单位，例如 mL、小时。 */
  unit?: string;
};

export const PRODUCT_STATS: ProductStat[] = [
  { count: 13, suffix: "%", label: "长期体脂上限" },
  { count: 1700, unit: "mL", label: "每日饮水起步" },
  { text: "7–9", unit: "小时", label: "每晚睡眠" },
  { count: 0, label: "含糖饮料" },
];

/** 产品页颜色区：每种颜色对应一张同角度的 T 恤图。 */
export const TEE_COLORS = [
  {
    id: "white",
    name: "白色",
    img: IMG.teeWhite,
    swatch: "linear-gradient(135deg,#ffffff,#e6e6ea)",
    glow: "rgba(200,200,210,0.55)",
  },
  {
    id: "black",
    name: "黑色",
    img: IMG.teeBlack,
    swatch: "linear-gradient(135deg,#4a4a4f,#111113)",
    glow: "rgba(90,90,100,0.45)",
  },
  {
    id: "green",
    name: "西兰花绿",
    img: IMG.teeGreen,
    swatch: "linear-gradient(135deg,#8fcf5a,#2f6b2a)",
    glow: "rgba(122,196,72,0.5)",
  },
] as const;

export const NOTIFICATIONS = [
  {
    when: "餐前拍一张",
    time: "12:13",
    title: "午餐已识别",
    body: "这一餐 612 千卡，蛋白质 38g。建议先吃肉，再吃饭。",
  },
  {
    when: "训练拍一段",
    time: "19:42",
    title: "训练已记录",
    body: "硬拉 3 组 × 12 次，已写入 训练日志.md。",
  },
  {
    when: "睡前看一眼",
    time: "22:58",
    title: "今日健康日报",
    body: "今日热量缺口 540 千卡，处于标准范围内。",
  },
] as const;

export type ModelId = "thick" | "starved" | "pro" | "justin";

export type CompareModel = {
  id: ModelId;
  name: string;
  tagline: string;
  badge?: string;
  values: Record<string, string>;
};

export const COMPARE_ROWS = [
  { key: "slimDressed", label: "穿衣显瘦" },
  { key: "meatUndressed", label: "脱衣有肉" },
  { key: "tshirt", label: "穿 T 恤效果" },
  { key: "protein", label: "每日蛋白质" },
  { key: "dopamine", label: "多巴胺来源" },
  { key: "cost", label: "获取成本" },
  { key: "release", label: "上市时间" },
] as const;

export const COMPARE_MODELS: CompareModel[] = [
  {
    id: "thick",
    name: "厚肌",
    tagline: "体积，是它唯一的语言。",
    values: {
      slimDressed: "—",
      meatUndressed: "●",
      tshirt: "撑爆",
      protein: "300g",
      dopamine: "健身房镜子",
      cost: "一年的牛排",
      release: "已上市",
    },
  },
  {
    id: "starved",
    name: "饿瘦",
    tagline: "轻。轻得有点虚。",
    values: {
      slimDressed: "●",
      meatUndressed: "—",
      tshirt: "晾衣架",
      protein: "30g",
      dopamine: "手机游戏",
      cost: "三顿饭",
      release: "已上市",
    },
  },
  {
    id: "pro",
    name: "薄肌",
    tagline: "刚刚好。",
    badge: "全新",
    values: {
      slimDressed: "●",
      meatUndressed: "●",
      tshirt: "刚刚好",
      protein: "140g",
      dopamine: "硬拉",
      cost: "一点意志力",
      release: "现已推出",
    },
  },
  {
    id: "justin",
    name: "孙宇晨 · 薄肌版",
    tagline: "当前体脂 29%。进行中。",
    badge: "即将推出",
    values: {
      slimDressed: "以实际训练进度为准",
      meatUndressed: "以实际训练进度为准",
      tshirt: "开发中",
      protein: "140–150g",
      dopamine: "AI 健康日报",
      cost: "25g 蛋白粉 + 5g 肌酸",
      release: "预计 3–6 个月后",
    },
  },
];

/** 选购页“配件”：食材和用品只在这里出现。 */
export const ACCESSORIES = [
  { name: "鸡胸肉", desc: "每天 140g 蛋白质的主要来源。价格以菜市场为准。", img: IMG.chicken },
  { name: "西兰花", desc: "俱乐部的颜色。价格以菜市场为准。", img: IMG.broccoli },
  { name: "2L 水壶", desc: "1700 mL，一壶装下。你家应该已经有了。", img: IMG.waterBottle },
  { name: "睡眠戒指", desc: "你睡了多久，它比你清楚。选配。", img: IMG.ring },
] as const;

export const OATHS = [
  "本人自愿放弃含糖饮料。",
  "本人承认蛋白粉不是科技与狠活。",
  "本人每天喝够 1700 mL 水。",
  "本人保证睡够 7–9 小时，不再相信周末补觉。",
  "本人不被外界评价左右，坚持自己判断过的方向。",
] as const;

export const FOOTNOTES = [
  "薄肌是一种审美偏好，不是医学健康标准。目标体脂率仅供娱乐参考。长期维持过低体脂，可能影响激素、骨骼和免疫健康。请在专业指导下训练。",
  "13% 对应“体脂长期低于 13%”的主张。“Regardless of how you feel” 出自邵艾伦谈健身意志力的视频，M13 中的 13 也来自这条线。M13 意志力芯片为虚构产品，实际意志力因睡眠、心情和冰箱里有没有夜宵而异。",
  "饮水量参考《中国居民膳食指南（2022）》：成年男性每天 1700 mL，成年女性每天 1500 mL。蛋白质与肌酸用量参考孙宇晨公开的每日补充量。体脂、蛋白质与饮水数据仅供娱乐与参考，不构成任何医疗、营养或训练建议。",
  "对比页中“多巴胺来源”一行致敬邵艾伦：“薄肌理论，就是把多巴胺从游戏手里抢回来。”孙宇晨 · 薄肌版的各项参数与发布时间，以本人实际训练进度为准。",
  "预计交付日期按每周体脂下降约 0.24–0.6 个百分点粗略估算，仅供娱乐，实际进度因人而异。配件图片仅为示意，价格以菜市场为准。",
  "本站为粉丝向恶搞致敬作品，与邵艾伦、孙宇晨本人及其关联公司无任何关联，也未获得其授权或背书。人物信息与引语整理自其公开发言与播客内容。本站提及的任何产品均不真实存在。",
] as const;

/** 社交平台分享链接时的预览卡片：标题 + 一行描述。 */
export const SHARE_TITLE = "薄肌俱乐部 · Think Thin.";
export const SHARE_DESCRIPTION = "今天，我们重新发明了薄肌。";
