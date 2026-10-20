"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function ScrollToTopOnRoute() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, lenis]);
  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  // Honor the OS "Reduce Motion" setting: native scrolling and no transform animations.
  const reduce = useReducedMotion() ?? false;

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis
        root
        options={{ lerp: 0.085, smoothWheel: !reduce, wheelMultiplier: 0.95, touchMultiplier: 1.2 }}
      >
        <ScrollToTopOnRoute />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
