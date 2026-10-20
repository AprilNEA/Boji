"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { IMG } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

export function OneMoreThing() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
  const bgX = useTransform(scrollYProgress, [0, 1], ["3%", "-2%"]);

  const seq = (delay: number) => ({
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.6 },
    transition: { duration: 1.2, delay, ease: EASE_APPLE },
  });

  return (
    <section ref={ref} className="on-dark relative min-h-[100svh] overflow-hidden bg-black text-white">
      <motion.img
        src={IMG.stage}
        alt="发布会舞台上，一束聚光灯照着一个站立的人影"
        className="absolute inset-0 h-full w-full object-cover object-[72%_50%]"
        style={{ scale: bgScale, x: bgX }}
        draggable={false}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.6)_45%,rgba(0,0,0,0)_75%)]" />

      <div className="container-wide relative flex min-h-[100svh] flex-col justify-center py-28">
        <motion.p {...seq(0)} className="font-[Inter_Variable] text-[clamp(28px,3.6vw,48px)] font-light tracking-[-0.02em] text-haze">
          One more thing…
        </motion.p>
        <motion.h2 {...seq(0.9)} className="t-headline mt-6 max-w-[640px]">
          孙宇晨 · <span className="t-brand">薄肌版</span>
        </motion.h2>
        <motion.p {...seq(1.3)} className="t-subhead mt-4 text-paper">
          当前体脂 29%。目标：薄肌。
        </motion.p>
        <motion.p {...seq(1.5)} className="mt-2 text-[17px] text-haze">
          预计 3–6 个月后发布。
        </motion.p>

        <motion.div {...seq(1.7)} className="mt-14 w-full max-w-[520px]">
          <div className="flex items-baseline justify-between text-[15px]">
            <span className="text-haze">
              当前体脂 <span className="t-num font-semibold text-white">29%</span>
            </span>
            <span className="text-haze">
              目标 <span className="font-semibold t-brand">薄肌</span>
            </span>
          </div>
          <div className="relative mt-3 h-[6px] overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green to-mint"
              initial={{ width: "0%" }}
              whileInView={{ width: "3%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 2.1, ease: EASE_APPLE }}
            />
            <motion.div
              className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "420%"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[13px] text-haze">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            训练进行中 · 已练两三天
          </div>
        </motion.div>

        <motion.blockquote {...seq(2.2)} className="mt-14 max-w-[520px] text-[21px] font-semibold tracking-[-0.01em] text-paper">
          “我已经正式开始练了。”
          <footer className="mt-1 text-[13px] font-normal text-ash">— 孙宇晨，2026 年 10 月 10 日播客</footer>
        </motion.blockquote>
      </div>
    </section>
  );
}
