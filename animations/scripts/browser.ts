// Shared headless Chromium setup for scripts/render.ts and scripts/sheet.ts.
// Set CHROME_PATH to use a specific Chromium build. Default: Playwright's chromium-headless-shell,
// installed with `pnpm exec playwright-core install chromium-headless-shell`.
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright-core';
import type Lottie from 'lottie-web';
import type { AnimationItem } from 'lottie-web';

declare global {
  interface Window {
    lottie: typeof Lottie;
    anim?: AnimationItem;
  }
}

/** Path of the lottie-web player that the pages load. */
export const LOTTIE_JS = fileURLToPath(import.meta.resolve('lottie-web/build/player/lottie.min.js'));

export function launch(): Promise<Browser> {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
    args: ['--disable-crash-reporter', '--disable-breakpad'],
  });
}
