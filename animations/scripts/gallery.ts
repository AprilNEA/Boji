// Equipment gallery: every item of src/exercises/equipment next to or in the hands of a standing figure, for
// checking shapes and scale. One row per equipment group.
// Usage: tsx scripts/gallery.ts [outDir]   (default: .renders). Writes gallery-<palette>.png.
import fs from 'node:fs';
import path from 'node:path';
import { compose } from '@/compose/index.ts';
import type { Exercise, FrontExercise, MovingPart, Props, PropShape, SideExercise } from '@/exercise.ts';
import type { FrontJoints, FrontPose } from '@/rig/front.ts';
import { project } from '@/rig/front.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { ang, dir, mul, sub, type Vec2 } from '@/math/vec2.ts';
import type { Palette, PaletteName } from '@/draw/palettes.ts';
import { BODY, type Joints, type Pose } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import * as E from '@/exercises/equipment/index.ts';
import { launch } from './browser.ts';
import { renderGrid, THEMES, type GridRow } from './grid.ts';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.resolve(process.argv[2] ?? path.join(root, '.renders'));
const tl = E.workTL(0.3);

const X0 = 262;
const stand = (): Pose => ({
  hip: [X0 - 6, G - A - 180], spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
  legs: standLegs(X0),
  arms: { near: { a1: 91, a2: 86, hand: 86 }, far: { a1: 93, a2: 88, hand: 88 } },
});
const REACH = 119, ABD = 9;
/** Arm reach from the shoulder, abducted by `a` degrees toward screen right and 14 px forward. */
const reach = (a: number): Vec3 => { const [x, y] = mul(dir(a - 90), REACH); return [x, y, 14]; };
const fstand = (): FrontPose => ({
  pelvis: [0, BODY.ankleH + 181, 0],
  legs: { l: { target: [16, BODY.ankleH, 2] }, r: { target: [-16, BODY.ankleH, 2] } },
  arms: {
    l: { target: (J) => add3(J.shoulder_l, reach(ABD)) },
    r: { target: (J) => add3(J.shoulder_r, reach(-ABD)) },
  },
});

type SideOpts = { dynamic?: MovingPart<Joints>[]; back?: (pal: Palette) => PropShape[]; front?: (pal: Palette) => PropShape[]; box?: [number, number]; pose?: () => Pose };
type FrontOpts = { dynamic?: MovingPart<FrontJoints>[]; back?: (pal: Palette) => PropShape[]; front?: (pal: Palette) => PropShape[]; box?: [number, number] };
interface Item { label: string; ex: Exercise }

const props = (o: { back?: (pal: Palette) => PropShape[]; front?: (pal: Palette) => PropShape[] }) =>
  (pal: Palette): Props => ({ back: o.back?.(pal), front: o.front?.(pal) });
const side = (label: string, o: SideOpts): Item => ({
  label,
  ex: { id: `gallery-${label}`, name: label, tl, pose: o.pose ?? stand, dynamic: o.dynamic, props: props(o), propsBox: o.box } satisfies SideExercise,
});
const front = (label: string, o: FrontOpts): Item => ({
  label,
  ex: { id: `gallery-${label}`, name: label, view: 'front', tl, pose: fstand, dynamic: o.dynamic, props: props(o), propsBox: o.box } satisfies FrontExercise,
});

const grip = (J: Joints): { p: Vec2 } => ({ p: E.gripAt(J, 'n') });
const fbar = (J: FrontJoints): { p: Vec2; a: number } => {
  const l = E.frontGripAt(J, 'l'), r = E.frontGripAt(J, 'r');
  return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2], a: ang(sub(l, r)) };
};

const bench = E.flatBench({ view: 'side', x: 440 });
const fbench = E.flatBench({ view: 'front', x: 150 });
const incline = E.inclineBench({ x: 520, angle: 45 });
const decline = E.declineBench({ x: 380 });
const preacher = E.preacherBench({ x: 480, y: G - 210, seatX: 400 });
const pull = E.pullUpBar({ view: 'side', x: X0 + 20, y: 32 });
const fpull = E.pullUpBar({ view: 'front', y: 32 });
const dip = E.dipBars({ view: 'side', x: 440, y: G - 250 });
const fdip = E.dipBars({ view: 'front', y: G - 250 });
const box = E.plyoBox({ x: 430 });
const step = E.aerobicStep({ x: 430 });
const hiCol = E.cableColumn({ x: 470, pulleyY: 60, toward: -1 });
const loCol = E.cableColumn({ x: 470, pulleyY: G - 40, toward: -1 });
const fCol = E.cableColumn({ x: 0, pulleyY: 40, toward: 1 });
const smith = E.smithRails({ view: 'side', x: X0 + 40 });
const fsmith = E.smithRails({ view: 'front', width: 320 });
const mine = E.landmine<Joints>([110, G - 4], (J) => E.gripAt(J, 'n'), 'side');

/** Cable from a pulley to a handle held at the near hand, rotated to hang from the cable. */
const sideCable = (col: E.CableColumn, kind: 'd' | 'rope' | 'end'): MovingPart<Joints>[] => {
  const at = (J: Joints): { p: Vec2; a: number } => { const g = E.gripAt(J, 'n'); return { p: g, a: E.towardCable(g, col.pulley) }; };
  return [E.cableLine(col.pulley, (J) => { const h = at(J); return E.handleEnd(h.p, h.a, kind === 'rope' ? 18 : 15); }), E.cableHandle(kind, at)];
};

const groups: { title: string; items: Item[] }[] = [
  {
    title: '自由重量', items: [
      side('barbell', { dynamic: [E.barbell({ view: 'side', at: grip })] }),
      front('barbell-f', { dynamic: [E.barbell({ view: 'front', at: fbar })] }),
      front('ez-bar-f', { dynamic: [E.ezBar({ view: 'front', at: fbar })] }),
      side('kettlebell', { dynamic: [E.kettlebell((J) => grip(J), 'edge')] }),
      front('kettlebell-f', { dynamic: [E.kettlebell((J) => ({ p: E.frontGripAt(J, 'l') })), E.kettlebell((J) => ({ p: E.frontGripAt(J, 'r') }))] }),
      side('plate-edge', { dynamic: [E.heldPlate(grip, 'edge')] }),
    ],
  },
  {
    title: '球、地雷架', items: [
      front('med-ball-f', { dynamic: [E.medicineBall(() => ({ p: [120, G - 28] }), 'back')], box: [90, 150] }),
      side('landmine', { dynamic: mine.parts, back: mine.base, box: [100, 300] }),
      side('stability-ball', { back: (pal) => E.place(E.ballShapes(pal), [420, G - E.BALL.r]), box: [350, 490] }),
      side('roller-end', { back: (pal) => E.place(E.rollerShapes(pal, 'end'), [400, G - E.ROLLER.r]), box: [380, 420] }),
      front('roller-long-f', { front: (pal) => E.place(E.rollerShapes(pal, 'long'), [0, G - E.ROLLER.r]), box: [-95, 95] }),
      side('band', { dynamic: [E.bandLine((J) => [J.ankle_n, E.gripAt(J, 'n')])] }),
    ],
  },
  {
    title: '训练凳', items: [
      side('flat-bench', { back: bench.draw, box: bench.box }),
      front('flat-bench-f', { back: fbench.draw, box: fbench.box }),
      side('incline-45', { back: incline.draw, box: incline.box }),
      side('decline', { back: decline.draw, box: decline.box }),
      side('preacher', { back: preacher.draw, box: preacher.box }),
      front('mini-band-f', { dynamic: [E.bandCurve((J) => { const a = project(J.knee_r), b = project(J.knee_l); return E.miniBandPoints([a[0] - 9, a[1]], [b[0] + 9, b[1]]); }, 'front')] }),
    ],
  },
  {
    title: '训练站', items: [
      side('pull-up', { back: pull.draw, box: pull.box }),
      front('pull-up-f', { back: fpull.draw, box: fpull.box }),
      side('dip', { back: dip.draw, box: dip.box }),
      front('dip-f', { back: fdip.draw, box: fdip.box }),
      side('plyo-box', { back: box.draw, box: box.box }),
      side('step', { back: step.draw, box: step.box }),
    ],
  },
  {
    title: '绳索、史密斯', items: [
      side('cable-d', { back: hiCol.draw, box: hiCol.box, dynamic: sideCable(hiCol, 'd') }),
      side('cable-rope', { back: loCol.draw, box: loCol.box, dynamic: sideCable(loCol, 'rope') }),
      side('cable-bar-end', { back: hiCol.draw, box: hiCol.box, dynamic: sideCable(hiCol, 'end') }),
      front('cable-bar-f', {
        back: fCol.draw, box: [-60, 60],
        dynamic: [E.cableLine(fCol.pulley, (J) => { const b = fbar(J); return E.handleEnd(b.p, 0, 5); }), E.cableHandle('bar', (J) => ({ p: fbar(J).p, a: 0 }), { len: 150 })],
      }),
      side('smith', { back: smith.draw, box: smith.box, dynamic: [E.barbell({ view: 'side', at: (J) => ({ p: [X0 + 40, E.gripAt(J, 'n')[1]] }) })] }),
      front('smith-f', { back: fsmith.draw, box: fsmith.box, dynamic: [E.barbell({ view: 'front', at: fbar, plate: 'medium' })] }),
    ],
  },
];

fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();
for (const theme of Object.keys(THEMES) as PaletteName[]) {
  const rows: GridRow[] = groups.map((g) => {
    const comps = g.items.map((it) => compose(it.ex, theme));
    for (const [k, c] of comps.entries()) for (const w of c.warnings) console.warn(`${g.items[k]!.label}: ${w}`);
    return { title: g.title, json: comps.map((c) => JSON.stringify(c.anim)), frames: comps.map(() => 0), labels: g.items.map((it, k) => `${it.label} ×${comps[k]!.zoom.toFixed(2)}`) };
  });
  const file = path.join(outDir, `gallery-${theme}.png`);
  await renderGrid(browser, rows, file, { theme, cell: 240, label: 120, type: 'png' });
  console.log(file);
}
await browser.close();
