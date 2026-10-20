"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { IMG } from "@/lib/content";

/** Circuit traces that travel from the frame edges into the chip. */
const TRACES = buildTraces();

export function ChipSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.6 });

  const brightness = useTransform(p, [0, 0.45], [0.12, 1]);
  const filter = useTransform(brightness, (b) => `brightness(${b}) saturate(${0.6 + b * 0.5})`);
  const scale = useTransform(p, [0, 0.5, 1], [1.18, 1, 0.94]);
  const glow = useTransform(p, [0.2, 0.5], [0, 1]);
  const line = useTransform(p, [0, 0.42], [0, 1]);
  const textOpacity = useTransform(p, [0.42, 0.6], [0, 1]);
  const textY = useTransform(p, [0.42, 0.6], [40, 0]);

  return (
    <section className="on-dark bg-black text-white">
      <div ref={ref} className="relative h-[260vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <motion.img
            src={IMG.chip}
            alt="M13 意志力芯片"
            className="absolute inset-0 h-full w-full object-cover"
            style={reduce ? undefined : { filter, scale }}
            draggable={false}
          />
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,224,99,0.32),rgba(168,224,99,0))] mix-blend-screen"
            style={{ opacity: glow }}
          />
          <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full mix-blend-screen"
            aria-hidden
          >
            <defs>
              <linearGradient id="trace" x1="0" x2="1">
                <stop offset="0" stopColor="#2f7d32" />
                <stop offset="1" stopColor="#c4ef7a" />
              </linearGradient>
              <filter id="traceGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {TRACES.map((d, i) => (
              <Trace key={i} d={d} progress={line} delay={(i % 6) * 0.04} />
            ))}
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

          <motion.div
            style={reduce ? undefined : { opacity: textOpacity, y: textY }}
            className="absolute inset-x-0 bottom-[clamp(40px,10vh,110px)] px-6 text-center"
          >
            <p className="t-eyebrow">
              M13 <span className="t-broc">意志力芯片</span>
            </p>
            <h2 className="t-headline mt-3 font-[Inter_Variable] tracking-[-0.035em]">Regardless of how you feel.</h2>
          </motion.div>
        </div>
      </div>

      <div className="container-apple pb-[clamp(96px,12vw,160px)] pt-6">
        <div className="border-t border-white/15 pt-16">
          <Reveal>
            <p className="t-title max-w-[820px] !leading-[1.25]">
              <span className="inline-block text-[#86868b]">它不问心情。</span>
              <span className="inline-block">只管你今天去练。</span>
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="t-body-lg mt-6 max-w-[640px] text-[#a1a1a6]">下雨、加班、心情不好，都不影响它启动。</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Trace({ d, progress, delay }: { d: string; progress: MotionValue<number>; delay: number }) {
  const pathLength = useTransform(progress, [delay, Math.min(1, delay + 0.8)], [0, 1]);
  const opacity = useTransform(progress, [delay, delay + 0.05], [0, 1]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="url(#trace)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#traceGlow)"
      style={{ pathLength, opacity }}
    />
  );
}

function buildTraces(): string[] {
  const cx = 800;
  const cy = 450;
  const half = 150;
  const out: string[] = [];
  const offsets = [-110, -66, -22, 22, 66, 110];
  offsets.forEach((o, i) => {
    const bend = 140 + (i % 3) * 70;
    // left
    out.push(`M0 ${cy + o * 2.4} H${cx - half - bend} L${cx - half - bend + 60} ${cy + o} H${cx - half}`);
    // right
    out.push(`M1600 ${cy - o * 2.4} H${cx + half + bend} L${cx + half + bend - 60} ${cy - o} H${cx + half}`);
  });
  [-90, -30, 30, 90].forEach((o, i) => {
    const bend = 90 + i * 30;
    out.push(`M${cx + o * 3.2} 0 V${cy - half - bend} L${cx + o} ${cy - half - bend + 60} V${cy - half}`);
    out.push(`M${cx - o * 3.2} 900 V${cy + half + bend} L${cx - o} ${cy + half + bend - 60} V${cy + half}`);
  });
  return out;
}
