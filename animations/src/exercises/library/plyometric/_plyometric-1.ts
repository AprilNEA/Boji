// Private pose builders for the plyometric-1 work list.
// Each builder keeps every landing target above the ground and uses quick, seamless cycles.
// The named variants change visible foot placement, arm action, equipment and range of motion.
import type { EquipmentTag, FrontExercise, LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY, type Joints, type LimbPair, type LimbSpec, type Pose } from '@/rig/side.ts';
import { FB, toeDir } from '@/rig/front.ts';
import { A, G } from '@/exercises/common.ts';
import { barbell, flatBench, plyoBox } from '@/exercises/equipment/index.ts';

type Base = { id: string; name: string; en: string; equipment: EquipmentTag[]; sources: string[] };
type SideExtras = Pick<SideExercise, 'props' | 'propsBox'>;
type FrontExtras = Pick<FrontExercise, 'props' | 'propsBox'>;
type FrontKind = 'diagonal-bound' | 'skater' | 'lateral-bound' | 'single-lateral-hop' | 'lateral-broad' | 'star' | 'box-crossover' | 'box-lateral' | 'box-shuffle' | 'cone-hops';
type SideKind = 'jump-squat' | 'half-squat' | 'rocket' | 'barbell-jump' | 'barbell-lunge' | 'kneeling-barbell' | 'bench-step' | 'bench-over' | 'lunge-switch' | 'split-jump' | 'backward' | 'drop-jump' | 'broad' | 'butt-kick' | 'frog' | 'single-butt-kick' | 'single-hop' | 'tuck' | 'box-depth' | 'heavy-bag';

const TAU = Math.PI * 2;
const fastTL = timeline([
  { d: 0.14, from: 0, to: 0, e: [0.4, 0.55] },
  { d: 0.20, from: 0, to: 1, e: [0.7, 1] },
  { d: 0.24, from: 1, to: 0, e: [0.85, 0.6] },
  { d: 0.18, from: 0, to: 0, e: [0.45, 0.4] },
]);

const libraryMeta = (b: Base): LibraryMeta => ({ en: b.en, family: 'plyometric', equipment: b.equipment, sources: b.sources });
const sideMuscles = [{ m: 'quads' as const, side: 'both' as const }, { m: 'glutes' as const, scale: 0.65 }, { m: 'calves' as const, side: 'both' as const, scale: 0.5 }, { m: 'hamstrings' as const, side: 'both' as const, scale: 0.35 }];
const frontMuscles = [{ m: 'quads' as const, side: 'both' as const }, { m: 'calves' as const, side: 'both' as const, scale: 0.5 }, { m: 'abductors' as const, scale: 0.45 }];

/** Target legs for a standing side-view pose. `y` is the ankle joint height in screen space. */
function sideLegs(xNear: number, yNear: number, xFar = xNear, yFar = yNear): LimbPair {
  return {
    near: { target: [xNear, yNear], foot: 0, side: [1, 0] },
    far: { target: [xFar, yFar], foot: 0, side: [1, 0] },
  };
}

function sideArms(kind: 'down' | 'swing' | 'overhead' | 'cross' | 'behind-head', p: number): { near: LimbSpec; far: LimbSpec } {
  if (kind === 'overhead') {
    const a = lerp(90, -100, p);
    return { near: { a1: a, a2: a, hand: a }, far: { a1: a - 4, a2: a - 4, hand: a - 4 } };
  }
  if (kind === 'swing') {
    const a = lerp(142, -18, p);
    return { near: { a1: a, a2: a + 4, hand: a + 4 }, far: { a1: a - 7, a2: a - 3, hand: a - 3 } };
  }
  if (kind === 'cross') return { near: { a1: 18, a2: 156, hand: 156 }, far: { a1: 28, a2: 150, hand: 150 } };
  if (kind === 'behind-head') return { near: { a1: -132, a2: 174, hand: 174 }, far: { a1: -122, a2: 170, hand: 170 } };
  return { near: { a1: 90, a2: 90, hand: 90 }, far: { a1: 94, a2: 94, hand: 94 } };
}

/** Squat at p=0; a fully extended airborne position at p=1. */
function verticalJump(p: number, arms: 'down' | 'swing' | 'overhead' | 'cross' = 'swing', x = 244, shift = 0, maxLift = 45): Pose {
  const lift = maxLift * p;
  const squat = 1 - p;
  const ankleY = G - A - lift;
  return {
    hip: [x + shift * p, G - A - 183 - lift + 55 * squat],
    spine: { lumbar: lerp(-62, -89, p), thoracic: lerp(-64, -91, p) },
    neck: lerp(-64, -89, p), head: lerp(-64, -89, p),
    legs: sideLegs(x + shift * p, ankleY),
    arms: sideArms(arms, p),
  };
}

/** Lunge landings alternate at t=0 and t=.5. The feet switch while both are airborne. */
function lungePose(t: number, alternate: boolean, bar = false): Pose {
  const swap = alternate ? (1 - Math.cos(TAU * t)) / 2 : 0;
  const lift = alternate ? 22 * Math.sin(TAU * t) ** 2 : 28 * Math.sin(Math.PI * t) ** 2;
  const front = lerp(288, 198, swap), rear = lerp(198, 288, swap);
  const ankleY = G - A - lift;
  return {
    hip: [243, G - A - 127 - lift],
    spine: { lumbar: -87, thoracic: -89 }, neck: -89, head: -89,
    farHip: 0,
    legs: sideLegs(front, ankleY, rear, ankleY),
    arms: bar ? barArms() : sideArms('swing', Math.min(1, lift / 22)),
  };
}

function barArms(): { near: LimbSpec; far: LimbSpec } {
  // Hands stabilize the bar beside the shoulders, without hiding the trunk in side view.
  return { near: { a1: -148, a2: 154, hand: 154 }, far: { a1: -154, a2: 150, hand: 150 } };
}

function barPart() {
  return barbell<Joints>({ view: 'side', plate: 'small', at: (J) => ({ p: add(J.S, [-9, -12]) }) });
}

function simpleSideProps(kind: SideKind): SideExtras {
  if (kind === 'bench-step') {
    const bench = flatBench({ view: 'side', x: 292, top: 76, length: 150 });
    return { props: (pal: Parameters<typeof bench.draw>[0]) => ({ back: bench.draw(pal) }), propsBox: bench.box };
  }
  if (kind === 'bench-over') {
    const bench = flatBench({ view: 'side', x: 300, top: 70, length: 132 });
    return { props: (pal: Parameters<typeof bench.draw>[0]) => ({ back: bench.draw(pal) }), propsBox: bench.box };
  }
  if (kind === 'box-depth') {
    const low = plyoBox({ x: 163, h: 62, w: 88 });
    const high = plyoBox({ x: 358, h: 112, w: 96 });
    return { props: (pal: Parameters<typeof low.draw>[0]) => ({ back: [...low.draw(pal), ...high.draw(pal)] }), propsBox: [low.box[0], high.box[1]] as [number, number] };
  }
  if (kind === 'single-hop') {
    return {
      props: (pal: { prop: string; propLight: string; propDark: string }) => ({ back: [
        { kind: 'poly' as const, nm: 'hop-cone', color: pal.prop, pts: [[305, G - 6], [321, G - 6], [313, G - 39]] },
        { kind: 'box' as const, nm: 'hop-cone-base', color: pal.propDark, c: [313, G - 5], s: [28, 6], r: 2 },
      ] }),
      propsBox: [293, 333] as [number, number],
    };
  }
  return {};
}

function heavyBagPose(p: number): Pose {
  // The closed hand stays on the bag's near surface while the bag swings away.
  const wrist: Vec2 = [lerp(256, 272, p), 230];
  return {
    hip: [207, 257], spine: { lumbar: lerp(-98, -78, p), thoracic: lerp(-96, -80, p) }, neck: -88, head: -88,
    legs: sideLegs(224, G - A, 184, G - A),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 0 },
      far: { target: (J) => add(wrist, [-5, 7]), side: [-1, 0], hand: 0 },
    },
  };
}

/** Low box → floor rebound → high box. The reverse half returns to the low-box start so the loop closes. */
function depthJumpPose(t: number): Pose {
  const lowFoot = G - 62 - A, highFoot = G - 112 - A;
  const keys: [number, number, number][] = [
    [163, lowFoot, 194], [255, G - A, 312], [358, highFoot, 180], [255, G - A, 312], [163, lowFoot, 194],
  ];
  const q = t * 4;
  const i = Math.min(3, Math.floor(q));
  const u = q - i;
  const a = keys[i]!, z = keys[i + 1]!;
  const x = lerp(a[0], z[0], u), footY = lerp(a[1], z[1], u), hipY = lerp(a[2], z[2], u);
  return {
    hip: [x, hipY], spine: { lumbar: lerp(-74, -88, u), thoracic: lerp(-76, -90, u) }, neck: -89, head: -89,
    legs: sideLegs(x, footY), arms: sideArms('swing', Math.sin(Math.PI * u)),
  };
}

export function sidePlyo(b: Base, kind: SideKind): SideExercise {
  const extra = simpleSideProps(kind);
  const isBar = kind === 'barbell-jump' || kind === 'barbell-lunge' || kind === 'kneeling-barbell';
  if (kind === 'heavy-bag') {
    const tl = timeline([{ d: 0.35, from: 0, to: 1, e: [0.45, 1] }, { d: 0.35, from: 1, to: 0, e: [0.8, 0.35] }]);
    return {
      id: b.id, name: b.name, tl, meta: libraryMeta(b), muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'near', scale: 0.7 }, { m: 'delts', side: 'near', scale: 0.45 }, { m: 'obliques', scale: 0.4 }],
      props: (pal) => ({ back: [{ kind: 'box', nm: 'bag-ceiling-strap', color: pal.cable, c: [302, 92], s: [4, 110], r: 2 }] }), propsBox: [187, 343],
      dynamic: [
        { nm: 'Heavy bag chain', kind: 'line', z: 'back', width: 3, color: (pal) => pal.cable, at: (_J, t) => [[302, 147], [302 + 16 * tl.at(t).p, 193]] },
        { nm: 'Heavy bag', kind: 'rigid', z: 'front', shapes: (pal) => [
          { kind: 'oval', nm: 'bag-top', color: pal.propLight, c: [0, -53], s: [34, 18] },
          { kind: 'box', nm: 'bag-body', color: pal.prop, c: [0, 0], s: [60, 116], r: 27 },
          { kind: 'box', nm: 'bag-band', color: pal.propDark, c: [0, 1], s: [61, 9], r: 2 },
        ], at: (_J, t) => ({ p: [302 + 16 * tl.at(t).p, 246] }) },
      ],
      pose: (t) => heavyBagPose(tl.at(t).p),
    };
  }
  if (kind === 'lunge-switch' || kind === 'split-jump') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles,
      dynamic: isBar ? [barPart()] : undefined,
      pose: (t) => lungePose(t, kind === 'lunge-switch', isBar),
    };
  }
  if (kind === 'barbell-lunge') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles, dynamic: [barPart()],
      pose: (t) => {
        const u = (1 - Math.cos(TAU * t)) / 2;
        const lift = 28 * Math.sin(TAU * t) ** 2;
        // The middle of the loop holds the clear rear-lunge landing. The short transitions show the jump.
        if (u < 0.65) return { ...verticalJump(Math.min(1, lift / 28), 'down'), arms: barArms() };
        return lungePose(t, false, true);
      },
    };
  }
  if (kind === 'kneeling-barbell') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles, dynamic: [barPart()], poster: 0.32,
      pose: (t) => {
        const p = fastTL.at(t).p;
        if (p < 0.28) {
          return {
            hip: [218, G - 112], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
            legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } }, arms: barArms(),
          };
        }
        return { ...verticalJump(Math.min(1, (p - 0.28) / 0.72), 'down'), arms: barArms() };
      },
    };
  }
  if (kind === 'butt-kick' || kind === 'single-butt-kick' || kind === 'tuck') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles,
      pose: (t) => {
        const p = fastTL.at(t).p;
        const base = verticalJump(p, kind === 'tuck' ? 'swing' : 'down');
        if (p < 0.45) return base;
        const hip: Vec2 = [244, G - A - 183 - 45 * p];
        const liftFootY = G - A - 45 * p;
        if (kind === 'tuck') {
          return { ...base, hip, legs: { near: { a1: 55, a2: 172, foot: 0 }, far: { a1: 55, a2: 172, foot: 0 } }, arms: { near: { a1: 8, a2: 8, hand: 8 }, far: { a1: 13, a2: 13, hand: 13 } } };
        }
        if (kind === 'single-butt-kick') {
          return { ...base, hip, legs: { near: { target: [244, liftFootY], foot: 0, side: [1, 0] }, far: { a1: -45, a2: 130, foot: 0 } } };
        }
        return { ...base, hip, legs: { near: { a1: 90, a2: -132, foot: 0 }, far: { a1: 90, a2: -132, foot: 0 } } };
      },
    };
  }
  if (kind === 'frog') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles,
      pose: (t) => {
        const p = fastTL.at(t).p;
        const base = verticalJump(p, 'swing', 236, 43);
        return { ...base, arms: sideArms('behind-head', p) };
      },
    };
  }
  if (kind === 'single-hop') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: [{ m: 'quads', side: 'near' }, { m: 'calves', side: 'near', scale: 0.7 }, { m: 'glutes', scale: 0.6 }, { m: 'abductors', scale: 0.35 }], ...extra,
      pose: (t) => {
        const p = fastTL.at(t).p;
        const base = verticalJump(p, 'swing', 225, 58);
        return { ...base, legs: { near: { target: [225 + 58 * p, G - A - 45 * p], foot: 0, side: [1, 0] }, far: { a1: -42, a2: 125, foot: 0 } } };
      },
    };
  }
  if (kind === 'bench-step') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles, ...extra,
      pose: (t) => {
        const u = (1 - Math.cos(TAU * t)) / 2;
        const top = G - 76 - A;
        const left = lerp(225, 292, u), right = lerp(292, 225, u);
        return {
          hip: [249, G - A - 160], spine: { lumbar: -87, thoracic: -89 }, neck: -89, head: -89,
          legs: sideLegs(left, lerp(G - A, top, u), right, lerp(top, G - A, u)), arms: sideArms('swing', 0.4),
        };
      },
    };
  }
  if (kind === 'box-depth') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles, ...extra, poster: 0.5,
      pose: depthJumpPose,
    };
  }
  if (kind === 'bench-over') {
    return {
      id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles, ...extra,
      pose: (t) => {
        const p = fastTL.at(t).p;
        // A 100 px ankle lift clears the 70 px bench before the body crosses its center.
        const base = verticalJump(p, 'swing', 206, 112, 100);
        return base;
      },
    };
  }
  const arm = kind === 'rocket' ? 'overhead' : kind === 'jump-squat' ? 'cross' : 'swing';
  const shift = kind === 'backward' ? -42 : kind === 'broad' ? 54 : 0;
  return {
    id: b.id, name: b.name, tl: fastTL, meta: libraryMeta(b), muscles: sideMuscles,
    dynamic: isBar ? [barPart()] : undefined,
    pose: (t) => {
      const p = fastTL.at(t).p;
      const pose = verticalJump(p, arm, kind === 'broad' || kind === 'backward' ? 228 : 244, shift);
      return isBar ? { ...pose, arms: barArms() } : pose;
    },
  };
}

/** Front pose anatomy. Targets are always inside the 184 px leg and 126 px arm reaches. */
function frontPose(kind: FrontKind, t: number) {
  const side = Math.cos(TAU * t) >= 0 ? 1 : -1;
  const travel = (1 - Math.cos(TAU * t)) / 2;
  const air = 20 * Math.sin(TAU * t) ** 2;
  const land = Math.cos(TAU * t) ** 4;
  let pelvis: Vec3 = [0, 188 + air - 17 * land, 0];
  let legL: Vec3 = [18, BODY.ankleH + air, 0];
  let legR: Vec3 = [-18, BODY.ankleH + air, 0];
  let armMode: 'swing' | 'wide' = 'swing';
  let armP = Math.min(1, air / 20);
  if (kind === 'diagonal-bound' || kind === 'lateral-bound' || kind === 'single-lateral-hop' || kind === 'skater') {
    // The landing foot crosses the cone or lane by a clearly visible distance.
    const mainX = side * (kind === 'single-lateral-hop' ? 50 : kind === 'skater' ? 56 : kind === 'lateral-bound' ? 54 : 46);
    pelvis = [side * (kind === 'skater' ? 30 : 25), 188 + air - 18 * land, kind === 'diagonal-bound' ? 14 * side : 0];
    if (kind === 'single-lateral-hop') {
      legL = [mainX, BODY.ankleH + air, 0];
      legR = [mainX - side * 10, BODY.ankleH + 64 + air, -8];
    } else if (kind === 'skater') {
      legL = [mainX, BODY.ankleH + air, 0];
      legR = [mainX - side * 42, BODY.ankleH + 3 + air, -18];
    } else {
      legL = [mainX, BODY.ankleH + air, 0];
      legR = [mainX - side * 10, BODY.ankleH + 56 + air, -8];
    }
    armMode = 'swing';
  } else if (kind === 'lateral-broad') {
    pelvis = [side * 27, 188 + air - 18 * land, 0];
    legL = [side * 12, BODY.ankleH + air, 0]; legR = [-side * 12, BODY.ankleH + air, 0];
    armMode = 'swing';
  } else if (kind === 'star') {
    const open = (1 - Math.cos(TAU * t)) / 2;
    const hop = 22 * Math.sin(TAU * t) ** 2;
    pelvis = [0, 188 + hop - 15 * land, 0];
    legL = [lerp(15, 62, open), BODY.ankleH + hop, 0]; legR = [-lerp(15, 62, open), BODY.ankleH + hop, 0];
    armMode = 'wide'; armP = open;
  } else if (kind === 'box-crossover' || kind === 'box-shuffle') {
    const onL = side > 0;
    pelvis = [0, 188 + air, 0];
    const boxFoot = BODY.ankleH + 76;
    legL = [onL ? 13 : 42, (onL ? boxFoot : BODY.ankleH) + air, 0];
    legR = [onL ? -42 : -13, (onL ? BODY.ankleH : boxFoot) + air, 0];
    armMode = 'swing';
  } else if (kind === 'box-lateral') {
    const on = travel;
    pelvis = [side * 12, 188 + air - 10 * land, 0];
    legL = [lerp(72, 18, on), lerp(BODY.ankleH, BODY.ankleH + 76, on) + air, 0];
    legR = [lerp(42, -18, on), lerp(BODY.ankleH, BODY.ankleH + 76, on) + air, 0];
    armMode = 'swing';
  } else if (kind === 'cone-hops') {
    pelvis = [side * 24, 188 + air - 16 * land, 0];
    legL = [side * 6, BODY.ankleH + air, 0]; legR = [-side * 6, BODY.ankleH + air, 0];
    armMode = 'swing';
  }
  const arms = (mode: typeof armMode) => ({
    l: { target: (J: any) => {
      const s = 1;
      if (mode === 'wide') return add3(J.shoulder_l, [s * lerp(20, 94, armP), lerp(-112, 72, armP), 12]);
      if (mode === 'swing') return add3(J.shoulder_l, [s * lerp(20, 48, armP), lerp(-112, -82, armP), 14]);
      return add3(J.shoulder_l, [s * 18, -116, 10]);
    } },
    r: { target: (J: any) => {
      const s = -1;
      if (mode === 'wide') return add3(J.shoulder_r, [s * lerp(20, 94, armP), lerp(-112, 72, armP), 12]);
      if (mode === 'swing') return add3(J.shoulder_r, [s * lerp(20, 48, armP), lerp(-112, -82, armP), 14]);
      return add3(J.shoulder_r, [s * 18, -116, 10]);
    } },
  });
  return {
    pelvis,
    hips: { pitch: 3 }, spine: { pitch: -2 }, head: { pitch: -2 },
    legs: { l: { target: legL, dir: toeDir([0, 0, 1]) }, r: { target: legR, dir: toeDir([0, 0, 1]) } },
    arms: arms(armMode),
  };
}

function frontProps(kind: FrontKind): FrontExtras {
  if (kind === 'box-crossover' || kind === 'box-lateral' || kind === 'box-shuffle') {
    const box = plyoBox({ x: 0, h: 76, w: 108 });
    return { props: (pal: Parameters<typeof box.draw>[0]) => ({ back: box.draw(pal) }), propsBox: box.box };
  }
  if (kind === 'cone-hops' || kind === 'single-lateral-hop') {
    return {
      props: (pal: { prop: string; propDark: string }) => ({ back: [
        { kind: 'poly' as const, nm: 'training-cone', color: pal.prop, pts: [[-11, G - 6], [11, G - 6], [0, G - 40]] },
        { kind: 'box' as const, nm: 'training-cone-base', color: pal.propDark, c: [0, G - 5], s: [32, 6], r: 2 },
      ] }), propsBox: [-20, 20] as [number, number],
    };
  }
  return {};
}

export function frontPlyo(b: Base, kind: FrontKind): FrontExercise {
  const extra = frontProps(kind);
  return {
    id: b.id, name: b.name, view: 'front', tl: fastTL, meta: libraryMeta(b), muscles: frontMuscles, ...extra,
    pose: (t) => frontPose(kind, t),
  };
}
