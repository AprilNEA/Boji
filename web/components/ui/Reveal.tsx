"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_APPLE } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  amount?: number;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3";
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  duration = 1.1,
  amount = 0.35,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE_APPLE }}
    >
      {children}
    </Comp>
  );
}
