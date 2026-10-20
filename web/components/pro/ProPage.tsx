"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { PillLink, TextLink } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { IMG, TEE_COLORS } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

type Highlight = {
  eyebrow: string;
  title: string;
  body: string;
  dark: boolean;
  img?: string;
  alt?: string;
  cover?: boolean;
  /** 没有图片时，用一个超大数字当主视觉。 */
  big?: string;
};

const HIGHLIGHTS: Highlight[] = [
  { eyebrow: "外观", title: "T 恤，刚刚好。", body: "不撑爆，也不像晾衣架。", img: IMG.teeWhite, alt: "白色 T 恤", dark: false },
  { eyebrow: "体脂", title: "13% 是一条线。", body: "长期低于它，不吃欺骗餐。", big: "13%", dark: true },
  { eyebrow: "意志力", title: "Regardless of how you feel.", body: "每天准时出门。", img: IMG.chip, alt: "M13 意志力芯片", dark: true, cover: true },
  { eyebrow: "饮水", title: "喝大水。", body: "每天 1700 mL 起。", img: IMG.waterBottle, alt: "一个 2L 水壶", dark: false },
  { eyebrow: "睡眠", title: "睡大觉。", body: "每晚 7–9 小时。周末补觉，不算数。", img: IMG.ring, alt: "一枚睡眠戒指", dark: true },
];

const SPECS: { group: string; rows: [string, string][] }[] = [
  { group: "体脂", rows: [["长期体脂", "低于 13%"], ["欺骗餐", "不支持"]] },
  { group: "饮水", rows: [["男性", "每天 1700 mL 起"], ["女性", "每天 1500 mL 起"]] },
  { group: "睡眠", rows: [["每晚", "7–9 小时"], ["周末补觉", "不计入"]] },
  { group: "营养", rows: [["蛋白质", "每天 140g"], ["肌酸", "每天 5g"], ["含糖饮料", "0"]] },
  { group: "训练", rows: [["频率", "每周 3–5 次"]] },
  { group: "意志力", rows: [["芯片", "M13 意志力芯片"]] },
  { group: "包装内容", rows: [["包含", "一套薄肌理论"], ["不含", "蛋白粉、健身卡、夜宵"]] },
  { group: "系统要求", rows: [["最低配置", "一根单杠，或一副哑铃"]] },
];

export function ProPage() {
  return (
    <div className="bg-white text-ink">
      <ProductHero />
      <Highlights />
      <Colors />
      <Specs />
      <section className="bg-mist section-pad">
        <div className="container-apple text-center">
          <Reveal>
            <h2 className="t-headline">
              <span className="t-broc">薄肌</span>，¥0 起。
            </h2>
            <p className="t-subhead mt-3 text-ash">另需：戒掉含糖饮料。</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <PillLink href="/store/">选购</PillLink>
              <TextLink href="/compare/">与其他型号比较</TextLink>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function ProductHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const width = useTransform(scrollYProgress, [0, 0.7], ["62%", "100%"]);
  const radius = useTransform(scrollYProgress, [0, 0.7], [36, 0]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <section className="pt-[calc(var(--nav-h)+clamp(48px,8vh,96px))]">
      <div className="container-apple text-center">
        <motion.h1
          className="t-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE_APPLE }}
        >
          <span className="t-broc-anim">薄肌</span>
        </motion.h1>
        <motion.p
          className="t-subhead mt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: EASE_APPLE }}
        >
          穿衣显瘦，脱衣有肉。
        </motion.p>
        <motion.p
          className="mt-2 text-[17px] text-ash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.65 }}
        >
          ¥0 起
        </motion.p>
        <motion.div
          className="mt-8 flex items-center justify-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <PillLink href="/store/">选购</PillLink>
          <TextLink href="/compare/">与其他型号比较</TextLink>
        </motion.div>
      </div>

      <div ref={ref} className="relative mt-16 h-[200vh]">
        <div className="sticky top-[var(--nav-h)] flex h-[calc(100svh-var(--nav-h))] items-center justify-center overflow-hidden">
          <motion.div style={{ width, borderRadius: radius }} className="relative h-full overflow-hidden bg-mist">
            <motion.img
              src={IMG.lifestyle}
              alt="穿白色 T 恤的薄肌身材"
              className="h-full w-full object-cover object-[50%_30%]"
              style={{ scale: imgScale }}
              draggable={false}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Highlights() {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" });
  };

  return (
    <section className="section-pad overflow-x-clip bg-white">
      <div className="container-wide">
        <Reveal>
          <h2 className="t-title">了解亮点。</h2>
        </Reveal>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-[max(22px,calc((100vw-1216px)/2))] pb-6"
      >
        {HIGHLIGHTS.map((h, i) => (
          <motion.article
            key={h.title}
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.1, delay: i * 0.07, ease: EASE_APPLE }}
            className={`relative h-[min(680px,78vh)] w-[min(372px,82vw)] shrink-0 snap-start overflow-hidden rounded-[28px] ${
              h.dark ? "bg-black text-white" : "bg-mist text-ink"
            }`}
          >
            {h.cover && h.img && (
              <>
                <img src={h.img} alt={h.alt ?? ""} className="absolute inset-0 h-full w-full object-cover opacity-80" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
              </>
            )}
            <div className="relative z-10 p-8">
              <p className={`text-[14px] font-semibold ${h.dark ? "text-[#a1a1a6]" : "text-ash"}`}>{h.eyebrow}</p>
              <h3 className="mt-2 text-[28px] font-semibold leading-[1.14] tracking-[-0.02em]">{h.title}</h3>
              <p className={`mt-2 text-[17px] ${h.dark ? "text-[#a1a1a6]" : "text-ash"}`}>{h.body}</p>
            </div>
            {h.big && (
              <div className="t-broc t-num absolute inset-x-0 bottom-10 text-center text-[clamp(120px,30vw,180px)] font-bold leading-none tracking-[-0.06em]">
                {h.big}
              </div>
            )}
            {!h.cover && h.img && (
              <motion.img
                src={h.img}
                alt={h.alt ?? ""}
                className="absolute inset-x-6 bottom-6 mx-auto h-[56%] w-[calc(100%-48px)] object-contain"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ duration: 0.9, ease: EASE_APPLE }}
                draggable={false}
              />
            )}
          </motion.article>
        ))}
      </div>
      <div className="container-wide mt-4 flex justify-end gap-3">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-label={d === -1 ? "上一张" : "下一张"}
            onClick={() => scrollBy(d)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e8ed] text-ink transition-colors hover:bg-[#dcdce0]"
          >
            <svg viewBox="0 0 10 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d={d === -1 ? "M8 2 2 8l6 6" : "M2 2l6 6-6 6"} />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}

function Colors() {
  const [active, setActive] = useState<(typeof TEE_COLORS)[number]["id"]>("white");
  const color = TEE_COLORS.find((c) => c.id === active) ?? TEE_COLORS[0];

  return (
    <section className="bg-mist section-pad overflow-x-clip">
      <div className="container-apple text-center">
        <Reveal>
          <p className="t-eyebrow text-ash">颜色</p>
          <h2 className="t-headline mt-2">
            <span className="inline-block">颜色随你挑。</span>
            <span className="inline-block text-ash">身材得自己练。</span>
          </h2>
        </Reveal>

        <div className="relative mx-auto mt-14 flex h-[min(56vh,520px)] max-w-[560px] items-center justify-center">
          <motion.div
            aria-hidden
            className="absolute inset-[12%] rounded-full blur-[70px]"
            animate={{ backgroundColor: color.glow }}
            transition={{ duration: 1, ease: EASE_APPLE }}
          />
          <AnimatePresence mode="popLayout">
            <motion.img
              key={color.id}
              src={color.img}
              alt={`${color.name} T 恤`}
              className="relative h-full w-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.14)]"
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 1.03 }}
              transition={{ duration: 0.8, ease: EASE_APPLE }}
              draggable={false}
            />
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          {TEE_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.name}
              aria-pressed={active === c.id}
              onClick={() => setActive(c.id)}
              className="relative flex h-9 w-9 items-center justify-center"
            >
              {active === c.id && (
                <motion.span
                  layoutId="swatch-ring"
                  className="absolute inset-0 rounded-full ring-[1.5px] ring-ink"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="h-[26px] w-[26px] rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.2)]" style={{ background: c.swatch }} />
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={color.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: EASE_APPLE }}
            className="mt-4"
          >
            <div className="text-[17px] font-semibold">{color.name}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Specs() {
  return (
    <section className="bg-white section-pad">
      <div className="container-apple">
        <Reveal>
          <h2 className="t-headline">技术规格</h2>
        </Reveal>
        <div className="mt-14 border-t border-black/15">
          {SPECS.map((s, i) => (
            <Reveal key={s.group} delay={Math.min(i * 0.04, 0.2)} amount={0.2}>
              <div className="grid gap-4 border-b border-black/10 py-9 md:grid-cols-[220px_1fr]">
                <h3 className="text-[21px] font-semibold tracking-[-0.015em]">{s.group}</h3>
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {s.rows.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[14px] text-ash">{k}</dt>
                      <dd className="t-num mt-1 text-[17px] font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
