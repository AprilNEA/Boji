// Private builders for biceps-curl-1. The standing curl keeps each elbow fixed beside the torso.
// Bench variants support the torso or upper arm before the forearm flexes. Bands stay anchored at the specified foot.
// Each top position uses roughly 45° of elbow flexion and each bottom position stays short of a locked elbow.
import type { FrontExercise, LibraryMeta, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import { add3, lerp3, type Vec3 } from '@/math/vec3.ts';
import { BODY, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import {
  bandLine, barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, frontDumbbell, frontGripAt,
  gripAt, inclineBench, preacherBench, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type SideMode = 'standing' | 'seated' | 'concentration' | 'incline' | 'spider' | 'prone-incline' | 'preacher' | 'high-bench' | 'supine' | 'overhead';
type SideImplement = 'barbell' | 'band';

interface SideConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  mode: SideMode;
  implement: SideImplement;
  alternate?: boolean;
  drag?: boolean;
  armBlaster?: boolean;
  reverse?: boolean;
}

interface FrontConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  mode: 'normal' | 'outward' | 'cross' | 'high' | 'cable-high';
  alternate?: boolean;
  unilateral?: boolean;
  hammer?: boolean;
}

const STAND_HIP: Vec2 = [242, G - A - 183];
const STAND_LEGS = standLegs(STAND_HIP[0], 0);
const SEAT_HIP: Vec2 = [226, G - 116];
const SEAT_LEGS: LimbPair = {
  near: { target: [326, G - A], foot: 0, side: [0, -1] },
  far: { target: [320, G - A], foot: 0, side: [0, -1] },
};
const SEAT_BENCH = flatBench({ view: 'side', x: 235, top: 96 });
const INCLINE_BENCH = inclineBench({ x: 286, angle: 55, facing: 1 });
const SPIDER_BENCH = inclineBench({ x: 242, angle: 45, facing: -1 });
const PRONE_INCLINE_BENCH = inclineBench({ x: 230, angle: 45, back: 170, facing: -1 });
const PREACHER = preacherBench({ x: 278, y: 250, seatX: 194, angle: 45, seatTop: 96 });
const HIGH_BENCH = flatBench({ view: 'side', x: 160, top: 156, length: 240 });
const SUPINE_BENCH = flatBench({ view: 'side', x: 246, top: 96, length: 250 });

const normalTL = workTL(0.35);
const alternateTL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.25, from: 0, to: 0, e: [0.3, 0.3] },
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.25, from: 0, to: 0, e: [0.3, 0.3] },
]);

/** One full controlled repetition for each arm, in sequence. */
function alternateProgress(t: number): [number, number] {
  const x = t * alternateTL.total;
  const rep = (u: number): number => {
    if (u <= 1) return smooth(u);
    if (u <= 1.35) return 1;
    if (u <= 2.95) return 1 - smooth((u - 1.35) / 1.6);
    return 0;
  };
  return x < 3.2 ? [rep(x), 0] : [0, rep(x - 3.2)];
}

/** A supported or standing curl arm. The upper arm direction does not change except for drag curls. */
function curlArm(p: number, upper = 90, topFore = -45) {
  return { a1: upper, a2: lerp(93, topFore, p), hand: 0 };
}

function sideBase(mode: SideMode, p: number, drag: boolean): Pose {
  if (mode === 'standing' || mode === 'overhead') {
    const upper = drag ? lerp(90, 118, p) : 90;
    if (mode === 'overhead') {
      return {
        hip: STAND_HIP, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: STAND_LEGS,
        // The elbow remains overhead. The forearm starts vertical overhead, then closes toward the shoulder.
        arms: { near: { a1: -90, a2: lerp(-90, 45, p), hand: 0 }, far: { a1: 90, a2: 93, hand: 0 } },
      };
    }
    return {
      hip: STAND_HIP, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: STAND_LEGS,
      arms: { near: curlArm(p, upper, drag ? -17 : -45), far: curlArm(p, upper, drag ? -17 : -45) },
    };
  }
  if (mode === 'seated') {
    return {
      hip: SEAT_HIP, spine: { lumbar: -88, thoracic: -90 }, neck: -90, head: -90, legs: SEAT_LEGS,
      arms: { near: curlArm(p), far: curlArm(p) },
    };
  }
  if (mode === 'concentration') {
    return {
      hip: [SEAT_HIP[0], SEAT_HIP[1] + 4], spine: { lumbar: -72, thoracic: -74 }, neck: -76, head: -78, legs: SEAT_LEGS,
      // The near elbow sits just above the knee on the inside of the near thigh.
      arms: { near: curlArm(p, 72, -63), far: { a1: 90, a2: 93, hand: 0 } },
    };
  }
  if (mode === 'incline') {
    return {
      hip: [275, G - 109], spine: { lumbar: -124, thoracic: -126 }, neck: -124, head: -124,
      legs: { near: { target: [373, G - A], foot: 0, side: [0, -1] }, far: { target: [367, G - A], foot: 0, side: [0, -1] } },
      arms: { near: curlArm(p), far: curlArm(p) },
    };
  }
  if (mode === 'spider' || mode === 'prone-incline') {
    return {
      // The chest rests on the incline pad. The arms hang below the shoulder rather than from the bench edge.
      hip: [220, G - 105], spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
      // The legs extend behind the supported chest, keeping the athlete prone rather than seated.
      legs: { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } },
      arms: { near: curlArm(p), far: curlArm(p) },
    };
  }
  if (mode === 'preacher') {
    return {
      hip: [194, G - 116], spine: { lumbar: -76, thoracic: -78 }, neck: -80, head: -81,
      legs: { near: { target: [286, G - A], foot: 0, side: [0, -1] }, far: { target: [280, G - A], foot: 0, side: [0, -1] } },
      // Both upper arms follow the pad from the shoulder toward its lower front edge.
      arms: { near: curlArm(p, 45, -90), far: curlArm(p, 45, -90) },
    };
  }
  // Prone on a high flat bench or supine on a flat bench. The legs lie on the pad and the arms hang below it.
  const high = mode === 'high-bench';
  return {
    hip: high ? [170, G - 174] : [222, G - 114],
    spine: high ? { lumbar: 0, thoracic: 0 } : { lumbar: 180, thoracic: 180 },
    neck: high ? 0 : 180, head: high ? 0 : 180,
    legs: high
      ? { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } }
      : { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: { near: curlArm(p), far: curlArm(p) },
  };
}

function sideProps(mode: SideMode, armBlaster: boolean, pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props | undefined {
  if (armBlaster) {
    return {
      front: [
        { kind: 'poly', nm: 'arm-blaster-strap', color: pal.metalDark, pts: [[222, 235], [257, 264], [281, 237]], w: 5 },
        { kind: 'poly', nm: 'arm-blaster', color: pal.metal, pts: [[245, 288], [254, 316], [270, 323], [278, 291]], w: 9 },
      ],
    };
  }
  const bench = mode === 'seated' || mode === 'concentration' ? SEAT_BENCH
    : mode === 'incline' ? INCLINE_BENCH
      : mode === 'spider' ? SPIDER_BENCH
        : mode === 'prone-incline' ? PRONE_INCLINE_BENCH
        : mode === 'preacher' ? PREACHER
          : mode === 'high-bench' ? HIGH_BENCH
            : mode === 'supine' ? SUPINE_BENCH : undefined;
  return bench ? { back: bench.draw(pal) } : undefined;
}

function sidePropsBox(mode: SideMode): [number, number] | undefined {
  if (mode === 'seated' || mode === 'concentration') return SEAT_BENCH.box;
  if (mode === 'incline') return INCLINE_BENCH.box;
  if (mode === 'spider') return SPIDER_BENCH.box;
  if (mode === 'prone-incline') return PRONE_INCLINE_BENCH.box;
  if (mode === 'preacher') return PREACHER.box;
  if (mode === 'high-bench') return HIGH_BENCH.box;
  if (mode === 'supine') return SUPINE_BENCH.box;
  return undefined;
}

/** Build one side-view barbell or resistance-band curl. */
export function sideCurl(c: SideConfig): SideExercise {
  const tl = c.alternate ? alternateTL : normalTL;
  const hasBench = !['standing', 'overhead'].includes(c.mode);
  const equipment: LibraryMeta['equipment'] = [c.implement === 'band' ? 'band' : 'barbell'];
  if (hasBench) equipment.push('bench');
  const meta: LibraryMeta = {
    en: c.en, family: 'biceps-curl',
    equipment,
    sources: c.sources,
  };
  return {
    id: c.id, name: c.name, tl, meta,
    muscles: [{ m: 'biceps', side: c.mode === 'overhead' || c.mode === 'concentration' ? 'near' : 'both' }, { m: 'forearms', side: c.mode === 'overhead' || c.mode === 'concentration' ? 'near' : 'both', scale: 0.45 }],
    props: (pal) => sideProps(c.mode, !!c.armBlaster, pal) ?? {},
    propsBox: sidePropsBox(c.mode),
    dynamic: c.implement === 'barbell'
      ? (c.alternate
        ? [
          barbell({ view: 'side', plate: 'medium', nm: 'Near Short Barbell', at: (J: Joints) => ({ p: gripAt(J, 'n') }) }),
          barbell({ view: 'side', plate: 'medium', nm: 'Far Short Barbell', z: 'overFarArm', at: (J: Joints) => ({ p: gripAt(J, 'f') }) }),
        ]
        : [barbell({ view: 'side', plate: 'medium', at: (J: Joints) => ({ p: gripAt(J, 'n') }) })])
      : [
        bandLine((J: Joints) => [[J.ankle_n[0] + 10, G - 5], gripAt(J, 'n')], 'underNearArm', 'Near resistance band'),
        ...(c.mode === 'overhead' || c.mode === 'concentration' ? [] : [bandLine((J: Joints) => [[J.ankle_f[0] + 8, G - 5], gripAt(J, 'f')], 'overFarArm', 'Far resistance band')]),
      ],
    pose(t) {
      const [pn, pf] = c.alternate ? alternateProgress(t) : [tl.at(t).p, tl.at(t).p];
      if (!c.alternate) return sideBase(c.mode, pn, !!c.drag);
      const base = sideBase(c.mode, 0, false);
      return { ...base, arms: { near: curlArm(pn), far: curlArm(pf) } };
    },
  };
}

const FRONT_SEAT = flatBench({ view: 'front', x: 0, top: 90 });
const FRONT_TL = workTL(0.35);
const FRONT_ALT_TL = alternateTL;

function frontTarget(mode: FrontConfig['mode'], sign: number, p: number): Vec3 {
  if (mode === 'high' || mode === 'cable-high') {
    return lerp3([sign * 124, 0, 8], [sign * 21, -42, 4], p);
  }
  const low: Vec3 = [sign * 3, -125, 10];
  const high: Vec3 = mode === 'outward' ? [sign * 40, -29, 8]
    : mode === 'cross' ? [-sign * 46, -17, 10]
      : [sign * 17, -45, 12];
  return lerp3(low, high, p);
}

function frontArm(mode: FrontConfig['mode'], s: 'l' | 'r', p: number) {
  const sign = s === 'l' ? 1 : -1;
  return {
    target: (J: FrontJoints) => add3(J[`shoulder_${s}`], frontTarget(mode, sign, p)),
    // An outward pole keeps the high-curl upper arms horizontal. Other curls keep elbows beside the torso.
    pole: mode === 'high' || mode === 'cable-high' ? [sign, 0, 0] as Vec3 : [sign * 0.2, -0.15, -1] as Vec3,
  };
}

/** Build a front-view dumbbell curl, including single-arm and alternating paths. */
export function frontCurl(c: FrontConfig): FrontExercise {
  const tl: Timeline = c.alternate ? FRONT_ALT_TL : FRONT_TL;
  const isHighCable = c.mode === 'cable-high';
  const leftColumn = cableColumn({ x: -166, pulleyY: 86, toward: 1 });
  const rightColumn = cableColumn({ x: 166, pulleyY: 86, toward: -1 });
  const meta: LibraryMeta = { en: c.en, family: 'biceps-curl', equipment: [isHighCable ? 'cable' : 'dumbbell'], sources: c.sources };
  return {
    id: c.id, name: c.name, view: 'front', tl, meta,
    muscles: [
      { m: 'biceps', side: c.unilateral ? 'l' : 'both' },
      { m: 'forearms', side: c.unilateral ? 'l' : 'both', scale: 0.45 },
    ],
    props: (pal) => isHighCable ? { back: [...leftColumn.draw(pal), ...rightColumn.draw(pal)] } : {},
    propsBox: isHighCable ? [leftColumn.box[0], rightColumn.box[1]] : undefined,
    dynamic: isHighCable
      ? [
        cableLine(leftColumn.pulley, (J) => frontGripAt(J, 'l'), 'Left high cable'),
        cableLine(rightColumn.pulley, (J) => frontGripAt(J, 'r'), 'Right high cable'),
        cableHandle('d', (J) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, leftColumn.pulley) }; }),
        cableHandle('d', (J) => { const p = frontGripAt(J, 'r'); return { p, a: towardCable(p, rightColumn.pulley) }; }),
      ]
      : [frontDumbbell('l', c.hammer ? 'profile' : 'end'), frontDumbbell('r', c.hammer ? 'profile' : 'end')],
    pose(t) {
      const [leftAlt, rightAlt] = c.alternate ? alternateProgress(t) : [tl.at(t).p, tl.at(t).p];
      const lp = c.unilateral ? tl.at(t).p : leftAlt;
      const rp = c.unilateral ? 0 : rightAlt;
      return {
        pelvis: [0, BODY.ankleH + 183, 0],
        hips: { pitch: 2 }, spine: { pitch: -1 }, head: { pitch: -2 },
        legs: { l: { target: [24, BODY.ankleH, 2] }, r: { target: [-24, BODY.ankleH, 2] } },
        arms: { l: frontArm(c.mode, 'l', lp), r: frontArm(c.mode, 'r', rp) },
      };
    },
  };
}
