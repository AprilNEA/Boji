export const START_OPTIONS = [
  { value: 18, label: "18%", hint: "已经很接近了" },
  { value: 22, label: "22%", hint: "标准起点" },
  { value: 29, label: "29%", hint: "孙宇晨同款" },
  { value: 33, label: "33%", hint: "大有可为" },
] as const;

export const FREQ_OPTIONS = [
  { value: 2, label: "每周 2 次", hint: "入门" },
  { value: 3, label: "每周 3 次", hint: "推荐" },
  { value: 4, label: "每周 4 次", hint: "进阶" },
  { value: 5, label: "每周 5 次", hint: "认真的" },
] as const;

export const SUGAR_OPTIONS = [
  { value: "daily", label: "每天都喝", factor: 0.5, hint: "交付将大幅延迟" },
  { value: "weekly", label: "每周几次", factor: 0.8, hint: "交付略有延迟" },
  { value: "none", label: "已经戒了", factor: 1, hint: "最快交付" },
] as const;

export type SugarValue = (typeof SUGAR_OPTIONS)[number]["value"];

export const TARGET_BODY_FAT = 12.9;

/** Rough, entertainment-only estimate of body-fat points lost per week. */
export function weeklyRate(freq: number, sugar: SugarValue): number {
  const factor = SUGAR_OPTIONS.find((s) => s.value === sugar)?.factor ?? 1;
  return 0.12 * freq * factor;
}

export function estimateWeeks(start: number, freq: number, sugar: SugarValue): number {
  const rate = weeklyRate(freq, sugar);
  return Math.max(4, Math.ceil((start - TARGET_BODY_FAT) / rate));
}

export function deliveryDate(weeks: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

export function formatDate(d: Date): { main: string; weekday: string } {
  return {
    main: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`,
    weekday: WEEKDAYS[d.getDay()],
  };
}
