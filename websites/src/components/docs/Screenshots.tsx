import type { ReactNode } from "react";
import { PhoneFrame } from "@/components/ui/PhoneFrame";

const ASSETS = "https://assets.leanmuscle.club";

type ShotProps = {
  /**
   * 截图文件名，不带扩展名。默认取用户指南截图 screenshots/apple/iphone/zh-Hans/guide/，
   * 由 ios/BojiUITests/GuideScreenshotTests.swift 采集。带 `app:` 前缀时取 README 和首页共用的截图，例如 `app:today`。
   */
  name: string;
  alt: string;
  caption?: string;
};

function source(name: string) {
  const dir = `${ASSETS}/screenshots/apple/iphone/zh-Hans`;
  return name.startsWith("app:") ? `${dir}/${name.slice(4)}.png` : `${dir}/guide/${name}.png`;
}

function Caption({ children }: { children?: string }) {
  if (!children) return null;
  return <figcaption className="mt-3 text-center text-sm text-fd-muted-foreground">{children}</figcaption>;
}

/** 一张放在 iPhone 机身中的截图。 */
export function Screenshot({ name, alt, caption }: ShotProps) {
  return (
    <figure className="not-prose mx-auto my-6 w-56 sm:w-64">
      <PhoneFrame src={source(name)} alt={alt} />
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * 左侧一张截图，右侧是说明文字或步骤。窄屏上截图在上方。
 * MDX 页面在 ../docs/ 中，Tailwind 不扫描那里，所以页面不能自己写布局类名，要用这个组件。
 */
export function ShotWithText({ children, ...shot }: ShotProps & { children: ReactNode }) {
  return (
    <div className="my-6 grid items-start gap-x-8 sm:grid-cols-[14rem_1fr]">
      <figure className="not-prose mx-auto w-56">
        <PhoneFrame src={source(shot.name)} alt={shot.alt} />
        <Caption>{shot.caption}</Caption>
      </figure>
      <div className="min-w-0 [&>:first-child]:mt-0">{children}</div>
    </div>
  );
}

/** 横向排列的几项内容，例如两张手表截图。窄屏上换行。 */
export function Row({ children }: { children: ReactNode }) {
  return <div className="not-prose my-6 flex flex-wrap items-end justify-center gap-6">{children}</div>;
}

/** 并排的二到四张截图。窄屏上可以横向滚动。 */
export function Screenshots({ shots }: { shots: ShotProps[] }) {
  return (
    <div className="not-prose my-6 flex snap-x gap-4 overflow-x-auto pb-2 sm:justify-center">
      {shots.map((shot) => (
        <figure key={shot.name} className="w-40 shrink-0 snap-start sm:w-44">
          <PhoneFrame src={source(shot.name)} alt={shot.alt} />
          <Caption>{shot.caption}</Caption>
        </figure>
      ))}
    </div>
  );
}

/** 资源站上的图片，例如带表壳的 Apple Watch 截图或钱包截图。src 是 assets/public/ 下的路径。 */
export function AssetImage({ src, alt, caption, width }: { src: string; alt: string; caption?: string; width: number }) {
  return (
    <figure className="not-prose mx-auto my-6" style={{ width }}>
      <img src={`${ASSETS}/${src}`} alt={alt} loading="lazy" decoding="async" className="w-full" />
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * 动作的循环动画或代表姿势，来自 assets/public/previews/。
 * 文档站用 .dark 类切换主题，所以同时渲染两种配色，用 dark: 类显示其中一张。
 */
function ExerciseImage({ id, group, ext, alt, size }: { id: string; group: string; ext: "gif" | "png"; alt: string; size: number }) {
  const src = (palette: string) => `${ASSETS}/previews/${group}/${palette}/${id}.${ext}`;
  return (
    <>
      <img src={src("light")} alt={alt} width={size} height={size} loading="lazy" decoding="async" className="rounded-xl dark:hidden" />
      <img src={src("dark")} alt={alt} width={size} height={size} loading="lazy" decoding="async" className="hidden rounded-xl dark:block" />
    </>
  );
}

/** 一个动作的循环动画。 */
export function ExerciseLoop({ id, group = "course", alt, caption }: { id: string; group?: "course" | "library"; alt: string; caption?: string }) {
  return (
    <figure className="not-prose mx-auto my-6 w-48">
      <ExerciseImage id={id} group={group} ext="gif" alt={alt} size={192} />
      <Caption>{caption}</Caption>
    </figure>
  );
}

/** 一组动作的代表姿势，每个动作下方显示名称。 */
export function ExerciseRow({ exercises }: { exercises: { id: string; name: string; group?: "course" | "library" }[] }) {
  return (
    <div className="not-prose my-4 flex flex-wrap gap-3">
      {exercises.map((exercise) => (
        <figure key={exercise.id} className="w-20 text-center">
          <ExerciseImage id={exercise.id} group={exercise.group ?? "course"} ext="png" alt={`${exercise.name}的代表姿势`} size={80} />
          <figcaption className="mt-1 text-xs text-fd-muted-foreground">{exercise.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
