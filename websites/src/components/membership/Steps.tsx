// 由客户端页面（入会页、选购页）引入，自动作为客户端模块运行。
import { motion } from "motion/react";
import { COLORS } from "@/lib/colors";

/** 入会流程顶部的步骤条：已完成和当前步骤为黑色圆点，之后的步骤为灰色。 */
export function Steps({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="container-apple mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px]">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2" aria-current={i === current ? "step" : undefined}>
          <motion.span
            className="t-num flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
            initial={false}
            animate={{
              backgroundColor: i <= current ? COLORS.ink : COLORS.fog,
              color: i <= current ? "#ffffff" : COLORS.ash,
            }}
            transition={{ duration: 0.5 }}
          >
            {i + 1}
          </motion.span>
          <span className={i === current ? "font-semibold text-ink" : "text-ash"}>{label}</span>
        </li>
      ))}
    </ol>
  );
}
