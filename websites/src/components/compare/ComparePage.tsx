"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PillLink, TextLink } from "@/components/ui/Buttons";
import { Reveal } from "@/components/ui/Reveal";
import { Silhouette } from "@/components/ui/Silhouette";
import { COMPARE_MODELS, COMPARE_ROWS, type ModelId } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

const DEFAULT: ModelId[] = ["thick", "starved", "pro"];

export function ComparePage() {
  const [selected, setSelected] = useState<ModelId[]>(DEFAULT);

  const setColumn = (col: number, id: ModelId) =>
    setSelected((cur) => cur.map((v, i) => (i === col ? id : v)));

  const models = selected.map((id) => COMPARE_MODELS.find((m) => m.id === id) ?? COMPARE_MODELS[0]);

  return (
    <div className="bg-paper text-ink">
      <section className="pt-[calc(var(--nav-h)+clamp(56px,9vh,110px))]">
        <div className="container-apple text-center">
          <motion.h1
            className="t-headline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_APPLE }}
          >
            哪一款适合你？
          </motion.h1>
          <motion.p
            className="t-body-lg mt-4 text-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            比较厚肌、饿瘦、薄肌，以及即将推出的型号。
          </motion.p>
        </div>
      </section>

      <section className="sticky top-[var(--nav-h)] z-20 mt-12 border-b border-black/10 bg-paper/85 backdrop-blur-xl">
        <div className="container-apple grid grid-cols-3 gap-3 py-3 sm:gap-8">
          {selected.map((id, col) => (
            <ModelSelect key={col} value={id} onChange={(v) => setColumn(col, v)} />
          ))}
        </div>
      </section>

      <section className="pb-[clamp(96px,12vw,160px)]">
        <div className="container-apple">
          <div className="grid grid-cols-3 gap-3 pt-14 text-center sm:gap-8">
            {models.map((m, col) => (
              <AnimatePresence mode="wait" key={col}>
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.55, ease: EASE_APPLE }}
                  className="flex flex-col items-center"
                >
                  <Silhouette
                    model={m.id}
                    className={`h-[clamp(130px,20vw,220px)] w-auto ${m.id === "pro" ? "text-ink" : m.id === "justin" ? "text-haze" : "text-silver"}`}
                  />
                  <div className="mt-6 h-5 text-[12px] font-semibold">
                    {m.badge && <span className="badge-new">{m.badge}</span>}
                  </div>
                  <h2 className={`mt-1 text-[clamp(17px,2.4vw,28px)] font-semibold tracking-[-0.02em] ${m.id === "pro" ? "t-brand" : ""}`}>
                    {m.name}
                  </h2>
                  <p className="mt-2 min-h-[44px] text-[clamp(12px,1.4vw,15px)] text-ash">{m.tagline}</p>
                  {m.id === "pro" ? (
                    <PillLink href="/store/" className="mt-4 !min-h-0 !px-4 !py-1.5 text-[14px]">
                      选购
                    </PillLink>
                  ) : (
                    <div className="mt-4 h-[33px]" />
                  )}
                </motion.div>
              </AnimatePresence>
            ))}
          </div>

          <div className="mt-16">
            {COMPARE_ROWS.map((row, r) => (
              <Reveal key={row.key} amount={0.4} y={20} duration={0.8} delay={Math.min(r * 0.03, 0.15)}>
                <div className="border-t border-black/10 py-8">
                  <h3 className="mb-5 text-center text-[14px] font-semibold text-ash">{row.label}</h3>
                  <div className="grid grid-cols-3 gap-3 text-center sm:gap-8">
                    {models.map((m, col) => (
                      <div key={col} className="relative min-h-[32px]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`${m.id}-${row.key}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.4, ease: EASE_APPLE }}
                            className="text-[clamp(14px,1.8vw,21px)] font-semibold tracking-[-0.01em]"
                          >
                            <Value text={m.values[row.key]} highlight={m.id === "pro"} />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 text-center">
            <PillLink href="/store/">选购薄肌</PillLink>
            <div className="mt-6">
              <TextLink href="/pro/">进一步了解薄肌</TextLink>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Value({ text, highlight }: { text: string; highlight: boolean }) {
  if (text === "●")
    return <span className={`inline-block h-3 w-3 rounded-full ${highlight ? "bg-green" : "bg-ink"}`} aria-label="支持" />;
  if (text === "—") return <span className="text-pewter" aria-label="不支持">—</span>;
  return <span className={highlight ? "t-brand" : ""}>{text}</span>;
}

function ModelSelect({ value, onChange }: { value: ModelId; onChange: (v: ModelId) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">选择型号</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ModelId)}
        className="w-full cursor-pointer appearance-none rounded-[12px] border border-black/15 bg-white py-2.5 pl-3 pr-8 text-[clamp(12px,1.5vw,15px)] font-semibold text-ink transition-colors hover:border-black/30 focus:border-accent focus:outline-none"
      >
        {COMPARE_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 12 8" className="pointer-events-none absolute right-3 top-1/2 h-2 w-3 -translate-y-1/2 text-ash" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="m1 1.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
