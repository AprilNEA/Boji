// 由客户端页面（入会页、选购页）引入，自动作为客户端模块运行。
import { motion } from "motion/react";
import { useState } from "react";
import { ACCENT_RGB, COLORS } from "@/lib/colors";
import { OATHS } from "@/lib/content";

/** 入会宣誓：填写会员姓名，逐条确认誓词，然后庄严入会。入会页和选购页结账共用。 */
export function Oath({
  name,
  setName,
  eyebrow,
  subtitle = "请逐条确认。薄肌，从诚实开始。",
  onBack,
  backLabel,
  onDone,
}: {
  name: string;
  setName: (v: string) => void;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  onDone: () => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => OATHS.map(() => false));
  const all = checked.every(Boolean);
  const ready = all && name.trim().length > 0;

  return (
    <section className="container-apple max-w-[720px]">
      <div className="text-center">
        {eyebrow && <p className="t-eyebrow text-ash">{eyebrow}</p>}
        <h1 className={`t-headline ${eyebrow ? "mt-2" : ""}`}>入会宣誓。</h1>
        <p className="t-body-lg mt-4 text-ash">{subtitle}</p>
      </div>

      <label className="relative mt-12 block">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 16))}
          placeholder=" "
          className="peer w-full rounded-[14px] border border-black/20 px-4 pb-2.5 pt-6 text-[17px] transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
        />
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-ash transition-all duration-300 peer-focus:top-4 peer-focus:text-[12px] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[12px]">
          会员姓名（将激光刻印在会员卡上）
        </span>
      </label>

      <ul className="mt-8 divide-y divide-black/10 border-y border-black/10">
        {OATHS.map((o, i) => (
          <li key={o}>
            <button
              type="button"
              role="checkbox"
              aria-checked={checked[i]}
              onClick={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
              className="flex w-full items-center gap-4 py-5 text-left"
            >
              <motion.span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px]"
                animate={{
                  backgroundColor: checked[i] ? COLORS.accent : "rgba(0,0,0,0)",
                  borderColor: checked[i] ? COLORS.accent : "rgba(0,0,0,0.25)",
                  scale: checked[i] ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.35 }}
              >
                <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M2.5 7.5 5.5 10.5 11.5 3.5" initial={false} animate={{ pathLength: checked[i] ? 1 : 0 }} transition={{ duration: 0.35 }} />
                </svg>
              </motion.span>
              <span className={`text-[19px] transition-colors duration-300 ${checked[i] ? "text-ink" : "text-graphite"}`}>{o}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-center text-[13px] text-ash">
        已确认 <span className="t-num font-semibold text-ink">{checked.filter(Boolean).length}</span> / {OATHS.length} 条
        {all && !name.trim() && "，请填写会员姓名"}
      </div>

      <div className="mt-10 flex flex-col items-center gap-5">
        <motion.button
          type="button"
          disabled={!ready}
          onClick={onDone}
          className="btn-pill btn-primary min-w-[240px] text-[19px]"
          animate={
            ready
              ? { boxShadow: [`0 0 0 0 rgba(${ACCENT_RGB},0.45)`, `0 0 0 14px rgba(${ACCENT_RGB},0)`] }
              : { boxShadow: `0 0 0 0 rgba(${ACCENT_RGB},0)` }
          }
          transition={ready ? { duration: 1.6, repeat: Infinity } : { duration: 0.3 }}
        >
          庄严入会
        </motion.button>
        {onBack && backLabel && (
          <button type="button" onClick={onBack} className="link-apple text-[15px]">
            <span className="chev rotate-180">›</span>
            <span>{backLabel}</span>
          </button>
        )}
      </div>
    </section>
  );
}
