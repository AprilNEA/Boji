/**
 * 需要在 JavaScript 中直接使用的颜色：Motion 动画的颜色值、SVG 的 stop 和 fill。
 * 数值与 src/app/globals.css 中 @theme 的同名令牌一致，改动时两处一起改。
 */
export const COLORS = {
  paper: "#f7f5f0",
  mist: "#efebe4",
  fog: "#ebe8e1",
  ash: "#898681",
  smoke: "#3b3a37",
  ink: "#1e1d1b",
  green: "#266652",
  mint: "#8cd5bc",
  accent: "#c7401f",
  accentBright: "#ff7a4d",
  waterLight: "#a6c8ff",
  sleep: "#7a4fa3",
  sleepLight: "#ddb8ff",
} as const;

/** Boji 品牌强调色 #C7401F 的 RGB 分量，用于需要透明度的阴影和光圈。 */
export const ACCENT_RGB = "199, 64, 31";
