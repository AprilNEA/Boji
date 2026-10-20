"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { PillLink, TextLink } from "@/components/ui/Buttons";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { IMG, PRODUCT_STATS, type ProductStat } from "@/lib/content";

/** 第 2 屏：产品揭幕。主角是一件白 T 恤——薄肌最直观的样子。 */
export function ProductReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });

  // T 恤从下方升起、放大，再轻轻落定，像被挂上展示架。
  const imgY = useTransform(p, [0, 0.5, 1], [140, 0, -30]);
  const scale = useTransform(p, [0, 0.5, 1], [0.78, 1.04, 0.96]);
  const rotate = useTransform(p, [0, 0.5], [-7, 0]);
  const textOpacity = useTransform(p, [0, 0.12, 0.58, 0.76], [1, 1, 1, 0]);
  const textY = useTransform(p, [0, 0.76], [0, -60]);
  const captionOpacity = useTransform(p, [0.55, 0.75], [0, 1]);
  const captionY = useTransform(p, [0.55, 0.75], [24, 0]);
  const glow = useTransform(p, [0, 0.5, 1], [0.15, 0.6, 0.35]);

  return (
    <section id="keynote" className="bg-mist text-ink">
      <div ref={ref} className="relative h-[230vh]">
        <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden pt-[var(--nav-h)]">
          <motion.div style={reduce ? undefined : { opacity: textOpacity, y: textY }} className="relative z-10 text-center">
            <p className="t-eyebrow badge-new">全新</p>
            <h2 className="t-hero mt-1">
              <span className="t-broc-anim">薄肌</span>
            </h2>
            <div className="mt-6 flex items-center justify-center gap-6">
              <PillLink href="/store/">选购</PillLink>
              <TextLink href="/pro/">进一步了解</TextLink>
            </div>
          </motion.div>

          <div className="relative mt-[clamp(8px,3vh,32px)] h-[min(50vh,480px)] w-[min(86vw,520px)]">
            <motion.div
              aria-hidden
              className="absolute inset-[10%] rounded-full bg-[radial-gradient(closest-side,rgba(168,224,99,0.5),rgba(168,224,99,0))] blur-2xl"
              style={{ opacity: glow }}
            />
            <motion.img
              src={IMG.teeWhite}
              alt="一件平整的白色 T 恤"
              className="relative h-full w-full object-contain drop-shadow-[0_36px_44px_rgba(0,0,0,0.16)]"
              style={reduce ? undefined : { y: imgY, scale, rotate }}
              draggable={false}
            />
          </div>

          <motion.p
            style={reduce ? undefined : { opacity: captionOpacity, y: captionY }}
            className="t-title absolute bottom-[clamp(32px,8vh,80px)] px-6 text-center"
          >
            穿衣显瘦，<span className="t-broc">脱衣有肉。</span>
          </motion.p>
        </div>
      </div>

      <div className="container-apple pb-[clamp(96px,12vw,160px)]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-14 border-t border-black/10 pt-16 md:grid-cols-4">
          {PRODUCT_STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center md:text-left">
              <StatValue stat={s} />
              <div className="mt-3 text-[17px] font-semibold">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatValue({ stat, className = "" }: { stat: ProductStat; className?: string }) {
  return (
    <div className={`t-broc whitespace-nowrap text-[clamp(44px,5.6vw,72px)] font-bold leading-none tracking-[-0.04em] ${className}`}>
      {stat.count !== undefined ? (
        <CountUp to={stat.count} suffix={stat.suffix ?? ""} />
      ) : (
        <span className="t-num">
          {stat.text}
          {stat.suffix}
        </span>
      )}
      {stat.unit && <span className="ml-1.5 text-[0.42em] font-semibold tracking-[-0.01em]">{stat.unit}</span>}
    </div>
  );
}
