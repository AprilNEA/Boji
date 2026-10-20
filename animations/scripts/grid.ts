// Renders rows of Lottie frames into one image with lottie-web in headless Chromium. Used by sheet.ts,
// gallery.ts and family.ts; no image tools are required.
import type { Browser } from 'playwright-core';
import type { PaletteName } from '@/palettes.ts';
import { LOTTIE_JS } from './browser.ts';

export const THEMES: Record<PaletteName, { bg: string; fg: string; muted: string }> = {
  light: { bg: '#F7F5F0', fg: '#1F1B16', muted: '#6B645B' },
  dark: { bg: '#1C1C1E', fg: '#F2EFEA', muted: '#A39E97' },
};

export interface GridRow {
  title: string;
  sub?: string;
  /** Lottie JSON text for the whole row, or one per cell. */
  json: string | string[];
  /** Frame numbers to show, one cell each. */
  frames: number[];
  /** Cell captions. Default: the frame number. */
  labels?: string[];
  /** Indexes into `frames` that get a dashed outline, such as the poster frame. */
  marked?: number[];
}

export interface GridOptions {
  theme: PaletteName;
  /** Cell size in px. Default 200. */
  cell?: number;
  /** Label column width in px. Default 170. */
  label?: number;
  type?: 'jpeg' | 'png';
}

/** Writes the grid to `file`. Rows may have different frame counts; the widest row sets the width. */
export async function renderGrid(browser: Browser, rows: GridRow[], file: string, { theme, cell = 200, label = 170, type = 'jpeg' }: GridOptions): Promise<void> {
  const c = THEMES[theme];
  const cols = Math.max(...rows.map((r) => r.frames.length));
  const page = await browser.newPage({ viewport: { width: label + cell * cols, height: cell }, deviceScaleFactor: 1 });
  const esc = (s: string): string => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!);
  const html = rows.map((r) => `
    <div class="row">
      <div class="label"><b>${esc(r.title)}</b><span>${esc(r.sub ?? '')}</span></div>
      ${r.frames.map((f, k) => `<div class="cell${r.marked?.includes(k) ? ' mark' : ''}"><i>${esc(r.labels?.[k] ?? String(f))}</i></div>`).join('')}
    </div>`).join('');
  await page.setContent(`<html><head><style>
    body { margin: 0; background: ${c.bg}; font-family: -apple-system, "PingFang SC", sans-serif; }
    .row { display: flex; height: ${cell}px; }
    .label { width: ${label - 20}px; padding: 18px 0 0 20px; display: flex; flex-direction: column; gap: 4px; overflow: hidden; }
    .label b { color: ${c.fg}; font-size: 16px; }
    .label span { color: ${c.muted}; font: 12px ui-monospace, Menlo, monospace; word-break: break-all; }
    .cell { width: ${cell}px; height: ${cell}px; box-sizing: border-box; position: relative; }
    .cell i { position: absolute; right: 6px; bottom: 4px; color: ${c.muted}; font: 10px ui-monospace, Menlo, monospace; }
    .mark { border: 2px dashed ${c.muted}; }
  </style></head><body>${html}</body></html>`);
  await page.addScriptTag({ path: LOTTIE_JS });
  await page.evaluate((rows) => {
    document.querySelectorAll('.row').forEach((row, i) => {
      row.querySelectorAll('.cell').forEach((cellEl, k) => {
        const src = rows[i]!.json;
        const json = Array.isArray(src) ? src[k]! : src;
        const anim = window.lottie.loadAnimation({ container: cellEl as HTMLElement, renderer: 'svg', loop: false, autoplay: false, animationData: JSON.parse(json) });
        anim.goToAndStop(rows[i]!.frames[k]!, true);
      });
    });
  }, rows);
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 86 } : {}), fullPage: true });
  await page.close();
}
