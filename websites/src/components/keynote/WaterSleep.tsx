"use client";

import { motion } from "motion/react";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { COLORS } from "@/lib/colors";
import { EASE_APPLE } from "@/lib/motion";

/** 第 4 屏：薄肌理论里最简单、也最容易被跳过的两条。 */
export function WaterSleepSection() {
  return (
    <section className="bg-paper section-pad text-ink">
      <div className="container-wide">
        <Reveal className="text-center">
          <h2 className="t-headline">
            喝大水。<span className="text-ash">睡大觉。</span>
          </h2>
          <p className="t-body-lg mx-auto mt-5 max-w-[620px] text-ash">最好的补剂，水龙头里有，被窝里也有。</p>
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-[1080px] gap-5 md:grid-cols-2">
          <Reveal>
            <WaterCard />
          </Reveal>
          <Reveal delay={0.12}>
            <SleepCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CardText({ eyebrow, title, body, dark = false }: { eyebrow: string; title: string; body: string; dark?: boolean }) {
  return (
    <div className="relative z-10 p-8 sm:p-10">
      <p className={`text-[14px] font-semibold ${dark ? "text-haze" : "text-ash"}`}>{eyebrow}</p>
      <h3 className="mt-2 text-[clamp(26px,2.8vw,34px)] font-semibold leading-[1.14] tracking-[-0.02em]">{title}</h3>
      <p className={`mt-3 text-[17px] ${dark ? "text-haze" : "text-ash"}`}>{body}</p>
    </div>
  );
}

const TICKS = [500, 1000, 1500, 2000];

function WaterCard() {
  return (
    <article className="relative flex h-[min(640px,80vh)] flex-col overflow-hidden rounded-[28px] bg-white">
      <CardText eyebrow="喝大水" title="每天 1700 mL 起。" body="渴了才喝，就已经晚了。" />
      <div className="relative flex flex-1 items-end justify-center pb-10">
        <div className="relative h-[min(300px,34vh)] w-[min(170px,36%)]">
          {/* 刻度：按 2000 mL 满杯换算高度 */}
          {TICKS.map((t) => (
            <span
              key={t}
              className="t-num absolute -left-11 translate-y-1/2 text-[11px] leading-none text-ash"
              style={{ bottom: `${(t / 2000) * 100}%` }}
            >
              {t}
            </span>
          ))}
          {/* 水杯 */}
          <div className="absolute inset-0 overflow-hidden rounded-b-[34px] rounded-t-[10px] border-[2px] border-black/15 bg-mist/60">
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-water to-water-mid"
              initial={{ height: "0%" }}
              whileInView={{ height: "85%" }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 2, delay: 0.2, ease: EASE_APPLE }}
            >
              <svg viewBox="0 0 240 20" preserveAspectRatio="none" className="absolute -top-[9px] left-0 h-[10px] w-[200%]" aria-hidden>
                <motion.path
                  d="M0 10 Q30 0 60 10 T120 10 T180 10 T240 10 V20 H0 Z"
                  fill="var(--color-water-mid)"
                  animate={{ x: [0, -120] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-x-0 top-4 text-center text-white">
                <CountUp to={1700} duration={2.2} className="text-[28px] font-bold tracking-[-0.03em]" />
                <span className="ml-1 text-[13px] font-semibold">mL</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </article>
  );
}

const CX = 130;
const CY = 130;
const R = 104;

/** 24 小时表盘上某个时刻的坐标：0 点在正上方，顺时针。保留两位小数，避免服务端与浏览器浮点误差导致水合不一致。 */
function point(hour: number, r = R) {
  const a = ((hour / 24) * 360 - 90) * (Math.PI / 180);
  const round = (v: number) => Math.round(v * 100) / 100;
  return { x: round(CX + r * Math.cos(a)), y: round(CY + r * Math.sin(a)) };
}

function SleepCard() {
  const start = point(23);
  const end = point(7);
  const arc = `M${start.x} ${start.y} A${R} ${R} 0 0 1 ${end.x} ${end.y}`;
  const labels = [0, 6, 12, 18].map((h) => ({ h, ...point(h, R - 30) }));

  return (
    <article className="on-dark relative flex h-[min(640px,80vh)] flex-col overflow-hidden rounded-[28px] bg-black text-white">
      <CardText eyebrow="睡大觉" title="每晚 7–9 小时。" body="周末补觉，不算数。" dark />
      <div className="relative flex flex-1 items-center justify-center pb-6">
        <svg viewBox="0 0 260 260" className="h-[min(280px,32vh)] w-auto" aria-label="睡眠时段：23:00 至 07:00">
          <defs>
            <linearGradient id="sleepArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={COLORS.sleep} />
              <stop offset="1" stopColor={COLORS.sleepLight} />
            </linearGradient>
          </defs>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" />
          {Array.from({ length: 24 }, (_, h) => {
            const a = point(h, R - 16);
            const b = point(h, R - 20);
            return <line key={h} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />;
          })}
          {labels.map((l) => (
            <text key={l.h} x={l.x} y={l.y + 4} textAnchor="middle" className="fill-ash-dark text-[11px]">
              {l.h}
            </text>
          ))}
          <motion.path
            d={arc}
            fill="none"
            stroke="url(#sleepArc)"
            strokeWidth="16"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.8, delay: 0.3, ease: EASE_APPLE }}
          />
          <text x={CX} y={CY + 4} textAnchor="middle" className="fill-white text-[40px] font-bold tracking-[-0.04em]">
            7–9
          </text>
          <text x={CX} y={CY + 28} textAnchor="middle" className="fill-haze text-[13px]">
            小时 · 23:00 – 07:00
          </text>
        </svg>
      </div>
    </article>
  );
}
