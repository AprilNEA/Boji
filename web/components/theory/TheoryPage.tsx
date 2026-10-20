"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { PillLink, TextLink } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollWordHighlight } from "@/components/ui/ScrollWordHighlight";
import { IMG } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

const PRINCIPLES = [
  {
    key: "薄肌",
    title: "穿衣显瘦，脱衣有肉。",
    body: "体脂长期保持在 13% 以下，不吃欺骗餐。线条比体积重要，克制比放纵高级。",
    stat: "< 13%",
    statLabel: "长期体脂",
  },
  {
    key: "黄毛",
    title: "不被外界评价左右。",
    body: "坚持自己判断过的方向。评论区很吵，杠铃很安静。",
    stat: "99.9%",
    statLabel: "外界噪音屏蔽率",
  },
  {
    key: "大水",
    title: "水，是最便宜的补剂。",
    body: "成年男性每天 1700 mL，成年女性每天 1500 mL 起。渴了才喝，就已经晚了。",
    stat: "1700 mL",
    statLabel: "每日饮水起步",
  },
  {
    key: "大睡",
    title: "睡眠，是免费的恢复。",
    body: "每晚 7–9 小时。周末补觉无效，这条通知无法关闭。",
    stat: "7–9 h",
    statLabel: "每晚睡眠",
  },
] as const;

export function TheoryPage() {
  return (
    <div className="on-dark bg-black text-white">
      <TheoryHero />
      <section className="section-pad">
        <div className="container-apple">
          <ScrollWordHighlight
            className="t-title !leading-[1.25]"
            text="我们相信，身体是你唯一能完全掌控的作品。薄肌只是一个载体。真正的目标，是把人生的控制权拿回来，把多巴胺从游戏手里抢回来。"
          />
        </div>
      </section>
      <Principles />
      <QuoteBand />
    </div>
  );
}

function TheoryHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.25]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 160]);

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.2, ease: EASE_APPLE }}
      >
        <motion.img
          src={IMG.theoryGym}
          alt="黑白照片：一个人在昏暗的健身房做引体向上"
          className="h-full w-full object-cover object-[50%_35%]"
          style={{ scale, opacity }}
          draggable={false}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
      <motion.div style={{ y: textY }} className="relative flex h-full flex-col items-center justify-end pb-[14vh] text-center">
        <motion.p
          className="t-eyebrow text-[#a1a1a6]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: EASE_APPLE }}
        >
          理论
        </motion.p>
        <motion.h1
          className="t-hero mt-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 0.55, ease: EASE_APPLE }}
        >
          薄肌理论。
        </motion.h1>
        <motion.p
          className="t-subhead mt-5 text-[#d2d2d7]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: EASE_APPLE }}
        >
          不是一种身材。是一种选择。
        </motion.p>
      </motion.div>
    </section>
  );
}

function Principles() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(PRINCIPLES.length - 1, Math.max(0, Math.floor(v * PRINCIPLES.length))));
  });
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const current = PRINCIPLES[active];

  return (
    <section className="border-t border-white/10">
      <div className="container-wide pt-[clamp(80px,10vw,140px)]">
        <Reveal>
          <p className="t-eyebrow text-[#86868b]">薄肌理论</p>
          <h2 className="t-headline mt-2">
            <span className="inline-block">全文很短。</span>
            <span className="inline-block text-[#6e6e73]">够你练一辈子。</span>
          </h2>
        </Reveal>
      </div>

      <div ref={ref} className="container-wide relative grid gap-10 md:grid-cols-2">
        <div className="hidden md:block">
          <div className="sticky top-0 flex h-[100svh] flex-col justify-center">
            <div className="relative h-[2px] w-full max-w-[420px] overflow-hidden rounded bg-white/10">
              <motion.div className="absolute inset-y-0 left-0 bg-white" style={{ width: bar }} />
            </div>
            <div className="relative mt-10 h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.7, ease: EASE_APPLE }}
                  className="absolute inset-0"
                >
                  <div className="t-num font-[Inter_Variable] text-[22px] font-light text-[#6e6e73]">0{active + 1}</div>
                  <div className="mt-2 text-[clamp(72px,9vw,128px)] font-bold leading-none tracking-[-0.05em]">
                    <span className={active === 0 ? "t-broc" : ""}>{current.key}</span>
                  </div>
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="t-num text-[34px] font-semibold tracking-[-0.03em]">{current.stat}</span>
                    <span className="text-[15px] text-[#86868b]">{current.statLabel}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div>
          {PRINCIPLES.map((p, i) => (
            <div key={p.key} className="flex min-h-[85svh] flex-col justify-center py-16">
              <div className="md:hidden">
                <div className="t-num text-[17px] text-[#6e6e73]">0{i + 1}</div>
                <div className="mt-1 text-[64px] font-bold leading-none tracking-[-0.05em]">{p.key}</div>
              </div>
              <motion.h3
                className="t-title mt-6 md:mt-0"
                animate={{ opacity: active === i ? 1 : 0.25 }}
                transition={{ duration: 0.6 }}
              >
                {p.title}
              </motion.h3>
              <motion.p
                className="t-body-lg mt-5 max-w-[460px] text-[#a1a1a6]"
                animate={{ opacity: active === i ? 1 : 0.25 }}
                transition={{ duration: 0.6 }}
              >
                {p.body}
              </motion.p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteBand() {
  return (
    <section className="section-pad border-t border-white/10">
      <div className="container-apple text-center">
        <Reveal>
          <blockquote className="t-headline">
            “我已经正式开始练了。”
          </blockquote>
          <p className="mt-6 text-[17px] text-[#86868b]">— 孙宇晨，首席践行官，2026 年 10 月 10 日</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-14 flex flex-wrap items-center justify-center gap-6">
          <PillLink href="/store/">选购薄肌</PillLink>
          <TextLink href="/pro/" dark>
            进一步了解薄肌
          </TextLink>
        </Reveal>
      </div>
    </section>
  );
}
