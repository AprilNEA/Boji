// 仅由客户端组件 StorePage 引入，自动作为客户端模块运行。
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Logo } from "@/components/ui/Logo";
import {
  FREQ_OPTIONS,
  START_OPTIONS,
  SUGAR_OPTIONS,
  deliveryDate,
  estimateWeeks,
  formatDate,
  weeklyRate,
  type SugarValue,
} from "@/lib/calculator";
import { IMG } from "@/lib/content";
import { EASE_APPLE } from "@/lib/motion";

export type Config = { start: number | null; freq: number | null; sugar: SugarValue | null };

export function useDelivery(config: Config) {
  const { start, freq, sugar } = config;
  return useMemo(() => {
    if (start === null || freq === null || sugar === null) return null;
    const weeks = estimateWeeks(start, freq, sugar);
    const date = deliveryDate(weeks);
    return { weeks, date, label: formatDate(date), rate: weeklyRate(freq, sugar) };
  }, [start, freq, sugar]);
}

export function Configurator({
  config,
  setConfig,
  onCheckout,
}: {
  config: Config;
  setConfig: (c: Config) => void;
  onCheckout: () => void;
}) {
  const { start, freq, sugar } = config;
  const result = useDelivery(config);
  const complete = result !== null;
  const sugarLabel = SUGAR_OPTIONS.find((s) => s.value === sugar)?.label;

  return (
    <>
      <section className="pt-[calc(var(--nav-h)+clamp(40px,7vh,80px))]">
        <div className="container-wide">
          <motion.p
            className="badge-new text-[14px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            全新
          </motion.p>
          <motion.h1
            className="t-headline mt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_APPLE }}
          >
            选购薄肌
          </motion.h1>
          <motion.p
            className="t-body-lg mt-3 text-ash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.25 }}
          >
            预计交付日期，取决于你。
          </motion.p>
        </div>
      </section>

      <section className="pb-[clamp(80px,10vw,140px)] pt-10">
        <div className="container-wide grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          {/* 左侧：产品图 + 预计交付 */}
          <div>
            <div className="sticky top-[calc(var(--nav-h)+24px)]">
              <div className="relative flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-[28px] bg-mist">
                <motion.div
                  aria-hidden
                  className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgba(168,224,99,0.6),rgba(168,224,99,0))] blur-2xl"
                  animate={{ opacity: complete ? 1 : 0.25, scale: complete ? 1.1 : 0.9 }}
                  transition={{ duration: 1.2, ease: EASE_APPLE }}
                />
                <motion.img
                  src={IMG.teeWhite}
                  alt="薄肌：一件刚刚好的白色 T 恤"
                  className="relative h-[82%] w-auto object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.15)]"
                  animate={{ y: complete ? -6 : 10, scale: complete ? 1.03 : 0.95 }}
                  transition={{ type: "spring", stiffness: 70, damping: 16 }}
                  draggable={false}
                />
              </div>

              <div className="mt-8 rounded-[22px] border border-black/10 p-6">
                <div className="text-[14px] text-ash">预计交付</div>
                <div className="relative mt-1 h-[44px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={result ? result.label.main : "pending"}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -40, opacity: 0 }}
                      transition={{ duration: 0.55, ease: EASE_APPLE }}
                      className="t-num absolute inset-0 text-[clamp(26px,3vw,34px)] font-semibold tracking-[-0.02em]"
                    >
                      {result ? (
                        <>
                          {result.label.main} <span className="text-[17px] font-normal text-ash">{result.label.weekday}</span>
                        </>
                      ) : (
                        <span className="text-[#c7c7cc]">完成选择后显示</span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="t-num mt-1 text-[14px] text-ash">
                  {result
                    ? `约 ${result.weeks} 周 · 每周约 −${result.rate.toFixed(2)}% 体脂 · 目标：长期低于 13%`
                    : "免费送货上门。前提是你先走进健身房。"}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：配置步骤 */}
          <div className="space-y-16">
            <Step index={1} title="起点。" question="你现在的体脂大约是多少？" enabled>
              <Options
                columns={2}
                options={START_OPTIONS.map((o) => ({ key: String(o.value), label: o.label, hint: o.hint }))}
                value={start === null ? null : String(start)}
                onChange={(v) => setConfig({ ...config, start: Number(v) })}
              />
            </Step>

            <Step index={2} title="频率。" question="每周练几次？" enabled={start !== null}>
              <Options
                columns={2}
                options={FREQ_OPTIONS.map((o) => ({ key: String(o.value), label: o.label, hint: o.hint }))}
                value={freq === null ? null : String(freq)}
                onChange={(v) => setConfig({ ...config, freq: Number(v) })}
              />
            </Step>

            <Step index={3} title="含糖饮料。" question="你多久喝一次？" enabled={freq !== null}>
              <Options
                columns={1}
                options={SUGAR_OPTIONS.map((o) => ({ key: o.value, label: o.label, hint: o.hint }))}
                value={sugar}
                onChange={(v) => setConfig({ ...config, sugar: v as SugarValue })}
              />
            </Step>

            <Step index={4} title="以旧换新。" question="你的旧身材可以折抵多少？" enabled={sugar !== null}>
              <div className="rounded-[14px] bg-mist px-5 py-4 text-[15px]">
                经评估，你的旧身材可折抵 <span className="t-num font-semibold">¥0</span>。我们会负责把它慢慢回收掉。
              </div>
            </Step>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, ease: EASE_APPLE }}
                  className="rounded-[22px] bg-mist p-7"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-black text-broc-light">
                      <Logo className="h-5 w-auto" />
                    </div>
                    <div>
                      <div className="text-[17px] font-semibold">你的薄肌</div>
                      <div className="t-num text-[13px] text-ash">预计 {result.label.main}交付</div>
                    </div>
                  </div>
                  <dl className="t-num mt-6 space-y-2.5 text-[15px]">
                    <Row k="起点体脂" v={`${start}%`} />
                    <Row k="训练频率" v={`每周 ${freq} 次`} />
                    <Row k="含糖饮料" v={sugarLabel ?? ""} />
                    <Row k="以旧换新" v="−¥0" />
                    <Row k="付款方式" v="戒掉含糖饮料" />
                    <div className="hairline !my-4" />
                    <Row k="总计" v="¥0" bold />
                  </dl>
                  <button type="button" onClick={onCheckout} className="btn-pill btn-primary mt-7 w-full">
                    结账
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({
  index,
  title,
  question,
  enabled,
  children,
}: {
  index: number;
  title: string;
  question: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Reveal amount={0.2} y={24}>
      <motion.div animate={{ opacity: enabled ? 1 : 0.3 }} transition={{ duration: 0.5 }} className={enabled ? "" : "pointer-events-none"}>
        <h2 className="text-[24px] font-semibold tracking-[-0.02em]">
          <span className="sr-only">第 {index} 步：</span>
          {title} <span className="text-ash">{question}</span>
        </h2>
        <div className="mt-5">{children}</div>
      </motion.div>
    </Reveal>
  );
}

function Options({
  options,
  value,
  onChange,
  columns,
}: {
  options: { key: string; label: string; hint: string }[];
  value: string | null;
  onChange: (v: string) => void;
  columns: 1 | 2;
}) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`} role="radiogroup">
      {options.map((o) => {
        const selected = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.key)}
            className={`relative rounded-[14px] px-5 py-4 text-left transition-colors duration-300 ${
              selected ? "" : "border border-black/15 hover:border-black/35"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`opt-${options.map((x) => x.key).join("-")}`}
                className="absolute inset-0 rounded-[14px] border-2 border-link"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative block text-[17px] font-semibold">{o.label}</span>
            <span className="relative block text-[13px] text-ash">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function Row({ k, v, bold = false }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? "text-[19px] font-semibold" : ""}`}>
      <dt className={bold ? "" : "text-ash"}>{k}</dt>
      <dd className={`text-right ${bold ? "" : "font-semibold"}`}>{v}</dd>
    </div>
  );
}
