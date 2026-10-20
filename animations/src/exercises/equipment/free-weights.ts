// Free weights for both views: barbell, EZ bar, kettlebell, medicine ball, a single plate and the landmine.
// Scale: 2.09 px per cm (thigh 94 px = 45 cm). Held weights take an `at` function that returns the screen point
// where the hands hold the weight and a rotation in degrees (clockwise on screen). Local axes are listed per part.
import { add, ang, mul, norm, sub, type Vec2 } from '@/math.ts';
import type { Cable, PropShape, RigidPart } from '@/exercise.ts';
import type { Palette } from '@/palettes.ts';

type At<J> = (J: J, t: number) => { p: Vec2; a?: number };
type Z = RigidPart['z'];

/** Plate diameters in px: full 45 cm (bumper or 20 kg), medium 28 cm (about 10 kg), small 20 cm (about 5 kg). */
export const PLATE = { full: 94, medium: 60, small: 42 } as const;
export type PlateSize = keyof typeof PLATE;
/** Plate thickness in px, seen edge-on. */
const PLATE_T: Record<PlateSize, number> = { full: 13, medium: 9, small: 7 };

/** Olympic barbell 220 cm, 131 cm between the collars. EZ bar 120 cm. */
export const BARBELL = { length: 460, inner: 274 } as const;
export const EZBAR = { length: 250, inner: 150 } as const;

/** Plate seen face-on, centered on the origin. */
export const plateFace = (pal: Palette, size: PlateSize, nm = 'plate'): PropShape[] => {
  const D = PLATE[size];
  return [
    { kind: 'oval', nm, color: pal.plate, c: [0, 0], s: [D, D] },
    { kind: 'ring', nm: `${nm}-lip`, color: pal.metalDark, c: [0, 0], s: [D * 0.74, D * 0.74], w: 2 },
    { kind: 'oval', nm: `${nm}-hub`, color: pal.metal, c: [0, 0], s: [13, 13] },
    { kind: 'oval', nm: `${nm}-hole`, color: pal.metalDark, c: [0, 0], s: [5, 5] },
  ];
};

/** Plate seen edge-on: thin along local x, tall along local y. */
export const plateEdge = (pal: Palette, size: PlateSize, c: Vec2 = [0, 0], nm = 'plate'): PropShape =>
  ({ kind: 'box', nm, color: pal.plate, c, s: [PLATE_T[size], PLATE[size]], r: 2.5 });

/** Sleeves, collars and plates of a bar along local x, centered on the origin. `shaft` is drawn behind them. */
function barAlong(pal: Palette, inner: number, length: number, size: PlateSize, plates: number, shaft: PropShape): PropShape[] {
  const sleeve = (length - inner) / 2, T = PLATE_T[size];
  const out: PropShape[] = [shaft];
  for (const s of [-1, 1]) {
    out.push({ kind: 'box', nm: `sleeve-${s}`, color: pal.metal, c: [s * (inner / 2 + sleeve / 2), 0], s: [sleeve, 10], r: 2 });
    out.push({ kind: 'box', nm: `collar-${s}`, color: pal.metalDark, c: [s * (inner / 2 + 3), 0], s: [6, 18], r: 2 });
    for (let k = 0; k < plates; k++) out.push(plateEdge(pal, size, [s * (inner / 2 + 8 + T * (k + 0.5) + k), 0], `plate-${s}-${k}`));
  }
  return out;
}

export interface BarSpec<J> {
  /**
   * 'side': the bar points at the viewer; only the near plate shows, face-on.
   * 'front': the bar runs across the screen along local x.
   */
  view: 'side' | 'front';
  /** Middle of the bar on screen. Front view: `a` tilts the bar; 0 is level. */
  at: At<J>;
  plate?: PlateSize;
  /** Plates per side, front view. Default 1. */
  plates?: number;
  /** Default: side 'front' (the near plate covers the hands); front 'underNearArm' (the hands cover the bar). */
  z?: Z;
  nm?: string;
}

/** Olympic barbell. Default plate: full. */
export function barbell<J>({ view, at, plate = 'full', plates = 1, z, nm = 'Barbell' }: BarSpec<J>): RigidPart<J> {
  const shapes = (pal: Palette): PropShape[] => view === 'side'
    ? plateFace(pal, plate)
    : barAlong(pal, BARBELL.inner, BARBELL.length, plate, plates, { kind: 'box', nm: 'shaft', color: pal.metal, c: [0, 0], s: [BARBELL.inner, 6], r: 3 });
  return { nm, kind: 'rigid', z: z ?? (view === 'side' ? 'front' : 'underNearArm'), shapes, at };
}

/** EZ curl bar with angled grips. Default plate: medium. */
export function ezBar<J>({ view, at, plate = 'medium', plates = 1, z, nm = 'EZ Bar' }: BarSpec<J>): RigidPart<J> {
  const h = EZBAR.inner / 2;
  // Two bends on each side: the hands sit on the angled parts, about 18 and 30 cm from the middle.
  const zig: Vec2[] = [[-h, 0], [-h + 22, 0], [-h + 34, -6], [-h + 50, 6], [-h + 62, 0], [h - 62, 0], [h - 50, 6], [h - 34, -6], [h - 22, 0], [h, 0]];
  const shapes = (pal: Palette): PropShape[] => view === 'side'
    ? plateFace(pal, plate)
    : barAlong(pal, EZBAR.inner, EZBAR.length, plate, plates, { kind: 'poly', nm: 'shaft', color: pal.metal, pts: zig, w: 6 });
  return { nm, kind: 'rigid', z: z ?? (view === 'side' ? 'front' : 'underNearArm'), shapes, at };
}

/**
 * Kettlebell, about 16 kg. The handle top is at the local origin and the bell hangs along local +y,
 * so `a` = 0 hangs it straight down. 'face': the handle loop faces the viewer. 'edge': the handle is seen edge-on.
 */
export function kettlebell<J>(at: At<J>, view: 'face' | 'edge' = 'face', z: Z = 'front', nm = 'Kettlebell'): RigidPart<J> {
  const shapes = (pal: Palette): PropShape[] => [
    view === 'face'
      ? { kind: 'ring', nm: 'handle', color: pal.plate, c: [0, 12], s: [30, 28], w: 6 }
      : { kind: 'box', nm: 'handle', color: pal.plate, c: [0, 11], s: [7, 27], r: 3.5 },
    { kind: 'oval', nm: 'bell', color: pal.plate, c: [0, 37], s: [42, 40] },
    { kind: 'box', nm: 'base', color: pal.plate, c: [0, 55], s: [24, 5], r: 2 },
    { kind: 'oval', nm: 'shine', color: pal.metalDark, c: [-10, 31], s: [7, 10], rot: 25 },
  ];
  return { nm, kind: 'rigid', z, shapes, at };
}

/** Distance from a kettlebell's handle top to the middle of the bell, for placing one on the floor. */
export const KETTLEBELL = { toBell: 37, height: 60 } as const;

/** Medicine ball, about 27 cm. Centered on the local origin. */
export function medicineBall<J>(at: At<J>, z: Z = 'front', d = 56, nm = 'Medicine Ball'): RigidPart<J> {
  const r = d / 2;
  const shapes = (pal: Palette): PropShape[] => [
    { kind: 'oval', nm: 'ball', color: pal.medBall, c: [0, 0], s: [d, d] },
    { kind: 'poly', nm: 'seam-h', color: pal.medBallSeam, pts: [[-r + 1, -4], [0, 3], [r - 1, -4]], w: 2, smooth: true },
    { kind: 'poly', nm: 'seam-v', color: pal.medBallSeam, pts: [[-3, -r + 1], [4, 0], [-3, r - 1]], w: 2, smooth: true },
    { kind: 'oval', nm: 'shine', color: pal.metal, c: [-r * 0.45, -r * 0.5], s: [8, 5], rot: -35 },
  ];
  return { nm, kind: 'rigid', z, shapes, at };
}

/** A single plate held in the hands. 'face': seen face-on. 'edge': edge-on, tall along local y. */
export function heldPlate<J>(at: At<J>, view: 'face' | 'edge', size: PlateSize = 'full', z: Z = 'front', nm = 'Plate'): RigidPart<J> {
  return { nm, kind: 'rigid', z, at, shapes: (pal) => (view === 'face' ? plateFace(pal, size) : [plateEdge(pal, size)]) };
}

export interface Landmine<J> {
  /** Add to Exercise.dynamic: the bar from the pivot, then the plate past the hands. */
  parts: [Cable<J>, RigidPart<J>];
  /** Static pivot housing; add to Props.back. */
  base: (pal: Palette) => PropShape[];
}

/**
 * Landmine: a barbell with one end in a floor pivot at screen point `pivot`. `grip` is where the hands hold it;
 * the loaded end sits `past` px beyond the hands. Side view: the plate shows edge-on. Front view: face-on.
 */
export function landmine<J>(pivot: Vec2, grip: (J: J, t: number) => Vec2, view: 'side' | 'front', past = 46, size: PlateSize = 'full'): Landmine<J> {
  const end = (J: J, t: number): Vec2 => {
    const g = grip(J, t);
    return add(g, mul(norm(sub(g, pivot)), past));
  };
  return {
    parts: [
      { nm: 'Landmine Bar', kind: 'line', z: 'underNearArm', width: 7, color: (pal) => pal.metal, at: (J, t) => [pivot, end(J, t)] },
      {
        nm: 'Landmine Plate', kind: 'rigid', z: view === 'side' ? 'underNearArm' : 'front',
        shapes: (pal) => (view === 'side' ? [plateEdge(pal, size)] : plateFace(pal, size)),
        // Edge-on plates stand perpendicular to the bar.
        at: (J, t) => ({ p: end(J, t), a: view === 'side' ? ang(sub(grip(J, t), pivot)) : 0 }),
      },
    ],
    base: (pal) => [{ kind: 'box', nm: 'landmine-base', color: pal.metalDark, c: [pivot[0], pivot[1] - 4], s: [30, 14], r: 3 }],
  };
}
