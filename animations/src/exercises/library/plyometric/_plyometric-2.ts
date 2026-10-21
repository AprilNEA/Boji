// Private builders for the plyometric-2 work list. They keep each exercise file focused on its source-specific metadata.
// Side-view pose values put contacts on the floor or box top and reserve the airborne phase for free limbs.
import type { SideExercise } from '@/exercise.ts';
import { lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { LimbPair, Pose } from '@/rig/side.ts';
import { A, G, HIGH_PLANK } from '@/exercises/common.ts';
import { barbell, dumbbell, flatBench, gobletDumbbell, medicineBall, plyoBox, smithRails } from '@/exercises/equipment/index.ts';

type BoxKind = 'jump' | 'rebound' | 'stabilize' | 'push-off' | 'stride' | 'skip';
type BoxSpec = { id: string; name: string; en: string; sources: string[]; kind: BoxKind };

const BOX_X = 340;
const BOX = plyoBox({ x: BOX_X, h: 80, w: 112 });
const SKIP_BOX = plyoBox({ x: 458, h: 80, w: 74 });
const floorAnkle = (x: number): Vec2 => [x, G - A];
const boxAnkle = (x: number): Vec2 => [x, BOX.top - A];

const legsAt = (near: Vec2, far: Vec2, side: Vec2 = [1, 0]): LimbPair => ({
  near: { target: near, foot: 0, side },
  far: { target: far, foot: 0, side },
});

const arms = (upper: number, fore: number): Pose['arms'] => ({
  near: { a1: upper, a2: fore, hand: fore },
  far: { a1: upper + 3, a2: fore + 3, hand: fore + 3 },
});

function planted(hip: Vec2, near: Vec2, far: Vec2, torso: number, upper: number, fore: number): Pose {
  return {
    hip, spine: { lumbar: torso, thoracic: torso - 2 }, neck: torso - 4, head: torso - 1,
    legs: legsAt(near, far), arms: arms(upper, fore),
  };
}

/** Jump flight with flexed knees; neither foot claims a floor contact while airborne. */
function flight(hip: Vec2, kneeDrive = false): Pose {
  return {
    hip, spine: { lumbar: -84, thoracic: -87 }, neck: -89, head: -88,
    legs: kneeDrive
      ? { near: { a1: 76, a2: 102, foot: 5 }, far: { a1: 30, a2: 116, foot: 4 } }
      : { near: { a1: 76, a2: 108, foot: 2 }, far: { a1: 80, a2: 112, foot: 2 } },
    arms: arms(-66, -80),
  };
}

/** Linear pose phases avoid a visual cut; the values are chosen only between reachable planted poses. */
function phase(t: number, stops: Array<[number, () => Pose]>): Pose {
  let i = 0;
  while (i + 1 < stops.length && t > stops[i + 1]![0]) i++;
  return stops[i]![1]();
}

/** Ground to box, then a deliberate step-down reset. The poster shows the soft box landing. */
function standardBoxPose(t: number): Pose {
  const crouch = () => planted([190, 338], floorAnkle(182), floorAnkle(176), -64, 142, 104);
  const air = () => flight([lerp(195, 310, Math.min(1, Math.max(0, (t - 0.16) / 0.2))), 218]);
  const land = () => planted([324, 273], boxAnkle(334), boxAnkle(328), -67, 17, 28);
  const tall = () => planted([334, 180], boxAnkle(340), boxAnkle(334), -89, 102, 90);
  // Lowering one level with a controlled backward step is the reset; it keeps the landing exercise recognisable.
  const down = () => planted([225, 310], floorAnkle(212), floorAnkle(206), -73, 125, 103);
  return phase(t, [[0, crouch], [0.16, air], [0.42, land], [0.60, tall], [0.76, down], [0.90, crouch]]);
}

/** A box-to-floor rebound uses the box landing only as a brief transition, then lands softly on the floor. */
function reboundBoxPose(t: number): Pose {
  const ground = () => planted([190, 338], floorAnkle(182), floorAnkle(176), -64, 142, 104);
  const up = () => flight([300, 212]);
  const box = () => planted([324, 273], boxAnkle(334), boxAnkle(328), -67, 10, 22);
  const off = () => flight([300, 190]);
  const land = () => planted([208, 323], floorAnkle(200), floorAnkle(194), -68, 20, 28);
  return phase(t, [[0, ground], [0.14, up], [0.36, box], [0.48, off], [0.72, land], [0.88, ground]]);
}

/** Land from a two-foot take-off on one box foot, with the other leg held clear for the balance phase. */
function stabilizeBoxPose(t: number): Pose {
  const crouch = () => planted([190, 334], floorAnkle(184), floorAnkle(178), -66, 142, 104);
  const air = () => flight([274, 205], true);
  const balance = (): Pose => ({
    hip: [324, 270], spine: { lumbar: -82, thoracic: -85 }, neck: -87, head: -85,
    legs: {
      near: { target: boxAnkle(334), foot: 0, side: [1, 0] },
      far: { a1: -12, a2: 64, foot: 6 },
    },
    arms: arms(18, 28),
  });
  return phase(t, [[0, crouch], [0.18, air], [0.46, balance], [0.72, balance], [0.84, crouch]]);
}

/** One supporting foot stays on the box. The opposite knee drives in the air and returns to its floor contact. */
function oneLegBoxPose(t: number, kind: 'push-off' | 'stride'): Pose {
  const sideBox = kind === 'stride';
  const bx = sideBox ? 280 : 312;
  const free = sideBox ? 238 : 205;
  const hipX = sideBox ? 272 : 242;
  const grounded = () => planted([hipX, 264], boxAnkle(bx), floorAnkle(free), -86, 108, 92);
  const load = () => planted([hipX + 4, 285], boxAnkle(bx), floorAnkle(free + 1), -72, 142, 108);
  const air = (): Pose => ({
    hip: [sideBox ? 272 : 252, sideBox ? 182 : 205], spine: { lumbar: -85, thoracic: -87 }, neck: -89, head: -88,
    // The box foot has left the surface. The opposite knee is the visible stride cue.
    legs: { near: { a1: 70, a2: 105, foot: 3 }, far: { a1: -15, a2: 62, foot: 8 } },
    arms: arms(-67, -81),
  });
  const land = () => planted([hipX + 4, 276], boxAnkle(bx), floorAnkle(free), -75, 17, 28);
  return phase(t, [[0, load], [0.18, air], [0.55, land], [0.75, grounded], [0.90, load]]);
}

/** A box skip starts on the floor, contacts the first box on one foot, then lands between two spaced boxes. */
function skipBoxPose(t: number): Pose {
  const start = () => planted([185, 325], floorAnkle(196), floorAnkle(158), -72, 142, 106);
  const approach = () => flight([274, 210], true);
  const onBox = (): Pose => ({
    hip: [326, 266], spine: { lumbar: -82, thoracic: -85 }, neck: -88, head: -86,
    legs: { near: { target: boxAnkle(335), foot: 0, side: [1, 0] }, far: { a1: -14, a2: 64, foot: 7 } },
    arms: arms(15, 26),
  });
  const leap = () => flight([396, 202], true);
  const floorLand = (): Pose => ({
    hip: [414, 312], spine: { lumbar: -74, thoracic: -77 }, neck: -80, head: -78,
    legs: { near: { target: floorAnkle(416), foot: 0, side: [1, 0] }, far: { a1: -14, a2: 64, foot: 7 } },
    arms: arms(18, 28),
  });
  return phase(t, [[0, start], [0.15, approach], [0.37, onBox], [0.53, leap], [0.73, floorLand], [0.86, start]]);
}

export function boxExercise(spec: BoxSpec): SideExercise {
  const pose = spec.kind === 'jump' ? standardBoxPose
    : spec.kind === 'rebound' ? reboundBoxPose
      : spec.kind === 'stabilize' ? stabilizeBoxPose
        : spec.kind === 'skip' ? skipBoxPose
          : (t: number) => oneLegBoxPose(t, spec.kind as 'push-off' | 'stride');
  const nameByKind: Record<BoxKind, string> = {
    jump: '跳箱', rebound: '跳箱接反弹跳', stabilize: '单腿箱上稳定跳',
    'push-off': '单腿箱上蹬跳', stride: '单腿箱上跨步跳', skip: '箱上跨步跳',
  };
  return {
    id: spec.id,
    name: spec.name || nameByKind[spec.kind],
    tl: timeline([
      { d: 0.42, from: 0, to: 1, e: [0.55, 1] },
      { d: 0.20, from: 1, to: 1, e: [1, 0.85] },
      { d: 0.58, from: 1, to: 0, e: [0.8, 0.35] },
    ]),
    meta: { en: spec.en, family: 'plyometric', equipment: ['box'], sources: spec.sources },
    muscles: [
      { m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.65 },
      { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.35 },
    ],
    props: (pal) => ({ back: [...BOX.draw(pal), ...(spec.kind === 'skip' ? SKIP_BOX.draw(pal) : [])] }),
    propsBox: spec.kind === 'skip' ? [BOX.box[0], SKIP_BOX.box[1]] : BOX.box,
    poster: spec.kind === 'jump' ? 0.48 : spec.kind === 'rebound' ? 0.53 : spec.kind === 'skip' ? 0.42 : 0.61,
    pose,
  };
}

type DumbbellSpec = { id: string; name: string; en: string; sources: string[]; kind: 'split-jump' | 'swing-jump' | 'seated-box' };

/** A loaded alternating lunge jump: the dumbbells stay at the sides while the feet switch in the air. */
function splitJumpPose(t: number): Pose {
  const leftLoad = () => planted([195, 311], floorAnkle(247), floorAnkle(143), -88, 86, 91);
  const air = (): Pose => ({
    hip: [195, 231], spine: { lumbar: -88, thoracic: -90 }, neck: -91, head: -90,
    legs: { near: { a1: 53, a2: 116, foot: 3 }, far: { a1: 132, a2: 72, foot: 3 } },
    arms: arms(86, 92),
  });
  const rightLoad = () => planted([195, 311], floorAnkle(143), floorAnkle(247), -88, 86, 91);
  return phase(t, [[0, leftLoad], [0.22, air], [0.58, rightLoad], [0.80, air], [0.92, leftLoad]]);
}

/** Two hands keep one dumbbell close while it swings from between the legs to overhead. */
function swingJumpPose(t: number): Pose {
  const hinge = (): Pose => ({
    hip: [220, 315], spine: { lumbar: -47, thoracic: -50 }, neck: -53, head: -50,
    legs: legsAt(floorAnkle(214), floorAnkle(208)),
    arms: {
      // Between the legs, below the knees but still within the 126 px shoulder-to-wrist reach.
      near: { target: [258, 350], side: [-1, 0], hand: 90 },
      far: { target: [253, 350], side: [-1, 0], hand: 90 },
    },
  });
  const tall = (): Pose => ({
    hip: [220, 257], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
    legs: legsAt(floorAnkle(214), floorAnkle(208)),
    arms: {
      near: { target: [255, 33], side: [-1, 0], hand: -90 },
      far: { target: [250, 36], side: [-1, 0], hand: -90 },
    },
  });
  const jump = (): Pose => ({
    hip: [220, 222], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
    legs: { near: { a1: 78, a2: 108, foot: 2 }, far: { a1: 82, a2: 112, foot: 2 } },
    arms: tall().arms,
  });
  return phase(t, [[0, hinge], [0.26, tall], [0.43, jump], [0.61, tall], [0.75, hinge]]);
}

const SEAT = flatBench({ view: 'side', x: 150, top: 90, length: 150 });
const SEATED_BOX = plyoBox({ x: 348, h: 80, w: 102 });

/** Sit tall facing the box, hold the dumbbell at the chest, then land on the box with both feet. */
function seatedBoxPose(t: number): Pose {
  const seated = (): Pose => ({
    hip: [153, 336], spine: { lumbar: -88, thoracic: -91 }, neck: -92, head: -90,
    legs: legsAt(floorAnkle(232), floorAnkle(226)),
    arms: {
      near: { target: [245, 247], side: [-1, 0], hand: 0 },
      far: { target: [240, 250], side: [-1, 0], hand: 0 },
    },
  });
  const flight = (): Pose => ({
    hip: [285, 218], spine: { lumbar: -84, thoracic: -87 }, neck: -89, head: -88,
    legs: { near: { a1: 75, a2: 107, foot: 2 }, far: { a1: 80, a2: 112, foot: 2 } },
    arms: {
      near: { target: [330, 160], side: [-1, 0], hand: 0 },
      far: { target: [326, 163], side: [-1, 0], hand: 0 },
    },
  });
  const land = (): Pose => ({
    hip: [332, 275], spine: { lumbar: -72, thoracic: -74 }, neck: -77, head: -74,
    legs: legsAt(boxAnkle(340), boxAnkle(334)),
    arms: {
      near: { target: [370, 220], side: [-1, 0], hand: 0 },
      far: { target: [366, 223], side: [-1, 0], hand: 0 },
    },
  });
  return phase(t, [[0, seated], [0.22, flight], [0.55, land], [0.78, seated]]);
}

export function dumbbellExercise(spec: DumbbellSpec): SideExercise {
  const pose = spec.kind === 'split-jump' ? splitJumpPose : spec.kind === 'swing-jump' ? swingJumpPose : seatedBoxPose;
  const dynamic = spec.kind === 'split-jump'
    ? [dumbbell('n', 'profile'), dumbbell('f', 'profile')]
    : spec.kind === 'swing-jump' ? [dumbbell('n', 'profile')]
      : [gobletDumbbell()];
  return {
    id: spec.id, name: spec.name,
    tl: timeline([
      { d: 0.32, from: 0, to: 1, e: [0.55, 1] }, { d: 0.18, from: 1, to: 1, e: [1, 0.9] },
      { d: 0.60, from: 1, to: 0, e: [0.85, 0.35] },
    ]),
    meta: {
      en: spec.en, family: 'plyometric',
      equipment: spec.kind === 'seated-box' ? ['dumbbell', 'bench', 'box'] : ['dumbbell'], sources: spec.sources,
    },
    muscles: [
      { m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.85 }, { m: 'calves', side: 'both', scale: 0.55 },
      ...(spec.kind === 'swing-jump' ? [{ m: 'hamstrings' as const, side: 'both' as const, scale: 0.75 }, { m: 'delts' as const, side: 'both' as const, scale: 0.5 }] : [{ m: 'hamstrings' as const, side: 'both' as const, scale: 0.4 }]),
    ],
    props: spec.kind === 'seated-box' ? (pal) => ({ back: [...SEAT.draw(pal), ...SEATED_BOX.draw(pal)] }) : undefined,
    propsBox: spec.kind === 'seated-box' ? [SEAT.box[0], SEATED_BOX.box[1]] : undefined,
    dynamic, poster: spec.kind === 'seated-box' ? 0.62 : spec.kind === 'swing-jump' ? 0.52 : 0.60,
    pose,
  };
}

type BallKind =
  | 'back-throw' | 'chest-pass' | 'chest-push' | 'chest-run' | 'chest-sprint' | 'kneel-single' | 'kneel-reset'
  | 'slam' | 'vertical-throw' | 'wall-throw' | 'single-slam' | 'supine-chest'
  | 'supine-overhead-single' | 'supine-overhead-two' | 'three-point-pass' | 'three-point-push';
type BallSpec = { id: string; name: string; en: string; sources: string[]; kind: BallKind };

const chestArms = (c: Vec2): Pose['arms'] => ({
  near: { target: [c[0] - 16, c[1]], side: [-1, 0], hand: 0 },
  far: { target: [c[0] - 20, c[1] + 3], side: [-1, 0], hand: 0 },
});
const oneArmTo = (c: Vec2): Pose['arms'] => ({
  near: { target: [c[0] - 12, c[1]], side: [-1, 0], hand: 0 },
  far: { a1: 85, a2: 92, hand: 92 },
});
const standingBall = (c: Vec2, armsAt: Pose['arms'] = chestArms(c)): Pose => ({
  hip: [220, 257], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
  legs: legsAt(floorAnkle(214), floorAnkle(208)), arms: armsAt,
});
const staggeredBall = (c: Vec2, armsAt: Pose['arms'] = chestArms(c)): Pose => ({
  hip: [220, 257], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
  legs: legsAt(floorAnkle(232), floorAnkle(188)), arms: armsAt,
});
const extendedPass = (): Pose => standingBall([363, 160], chestArms([363, 160]));
const sprintPose = (): Pose => ({
  hip: [225, 284], spine: { lumbar: -80, thoracic: -83 }, neck: -86, head: -84,
  legs: { near: { target: floorAnkle(276), foot: 0, side: [1, 0] }, far: { a1: -22, a2: 74, foot: 5 } },
  arms: arms(-25, 92),
});

function backThrowPose(t: number): Pose {
  const load = (): Pose => ({
    hip: [220, 315], spine: { lumbar: -47, thoracic: -50 }, neck: -53, head: -50,
    legs: legsAt(floorAnkle(214), floorAnkle(208)), arms: chestArms([258, 340]),
  });
  const overhead = () => standingBall([180, 75], chestArms([180, 75]));
  const follow = () => standingBall([165, 85], chestArms([180, 75]));
  return phase(t, [[0, load], [0.29, overhead], [0.51, follow], [0.74, load]]);
}

function chestPassPose(t: number, run: boolean): Pose {
  const ready = () => standingBall([260, 205]);
  const pass = () => extendedPass();
  const recover = () => standingBall([265, 205]);
  return phase(t, run ? [[0, ready], [0.24, pass], [0.45, sprintPose], [0.72, recover], [0.88, ready]] : [[0, ready], [0.28, pass], [0.50, recover], [0.82, ready]]);
}

/** The two-step sprint pass gathers a low ball, passes from the chest, then accelerates after release. */
function chestSprintPose(t: number): Pose {
  const low = (): Pose => ({
    hip: [210, 313], spine: { lumbar: -67, thoracic: -70 }, neck: -73, head: -70,
    legs: legsAt(floorAnkle(218), floorAnkle(190)), arms: chestArms([245, 326]),
  });
  const gather = (): Pose => ({
    hip: [225, 286], spine: { lumbar: -78, thoracic: -81 }, neck: -84, head: -82,
    legs: legsAt(floorAnkle(270), floorAnkle(190)), arms: chestArms([270, 225]),
  });
  const pass = (): Pose => ({
    hip: [237, 276], spine: { lumbar: -82, thoracic: -85 }, neck: -88, head: -86,
    legs: legsAt(floorAnkle(292), floorAnkle(202)), arms: chestArms([340, 190]),
  });
  return phase(t, [[0, low], [0.18, gather], [0.40, pass], [0.59, sprintPose], [0.80, low]]);
}

function kneelPose(t: number, reset: boolean): Pose {
  const upright = (): Pose => ({
    hip: [190, 350], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
    legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } },
    arms: chestArms([245, 278]),
  });
  const drive = (): Pose => ({
    hip: [190, 350], spine: { lumbar: -56, thoracic: -58 }, neck: -61, head: -59,
    legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } },
    arms: chestArms([310, 268]),
  });
  const catchHands = (): Pose => ({
    hip: [190, 350], spine: { lumbar: 0, thoracic: -2 }, neck: -5, head: -2,
    legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } },
    arms: { near: { target: [330, G - 13], side: [-1, 0], hand: 0 }, far: { target: [326, G - 13], side: [-1, 0], hand: 0 } },
  });
  return phase(t, reset ? [[0, upright], [0.22, drive], [0.45, catchHands], [0.72, upright]] : [[0, upright], [0.25, drive], [0.50, catchHands], [0.82, upright]]);
}

function slamPose(t: number, oneArm: boolean): Pose {
  const base = oneArm ? staggeredBall : standingBall;
  const lift = () => base([250, 45], oneArm ? oneArmTo([250, 45]) : chestArms([250, 45]));
  const finish = (): Pose => ({
    hip: [220, 315], spine: { lumbar: -44, thoracic: -47 }, neck: -50, head: -47,
    legs: oneArm ? legsAt(floorAnkle(232), floorAnkle(188)) : legsAt(floorAnkle(214), floorAnkle(208)),
    // Hands finish below the knees, while the released ball continues to the floor ahead.
    arms: oneArm ? oneArmTo([285, 335]) : chestArms([285, 335]),
  });
  const rebound = () => standingBall([275, 240], oneArm ? oneArmTo([275, 240]) : chestArms([275, 240]));
  return phase(t, [[0, lift], [0.26, finish], [0.52, rebound], [0.74, lift]]);
}

function verticalThrowPose(t: number): Pose {
  const squat = (): Pose => ({
    hip: [220, 310], spine: { lumbar: -68, thoracic: -70 }, neck: -73, head: -70,
    legs: legsAt(floorAnkle(214), floorAnkle(208)), arms: chestArms([260, 245]),
  });
  const throwUp = () => standingBall([250, 45], chestArms([250, 45]));
  const catchBall = () => standingBall([250, 115], chestArms([250, 115]));
  return phase(t, [[0, squat], [0.25, throwUp], [0.48, catchBall], [0.72, squat]]);
}

function wallThrowPose(t: number): Pose {
  const behind = () => standingBall([180, 75], chestArms([180, 75]));
  const release = () => extendedPass();
  const receive = () => standingBall([270, 180]);
  return phase(t, [[0, behind], [0.25, release], [0.51, receive], [0.73, behind]]);
}

const SUPINE_HIP: Vec2 = [274, 420];
const SUPINE_ANKLE: Vec2 = [380, G - A];
function supineChestPose(t: number): Pose {
  const loaded = (): Pose => ({
    hip: SUPINE_HIP, spine: { lumbar: -177, thoracic: -177 }, neck: 181, head: 181,
    legs: legsAt(SUPINE_ANKLE, [SUPINE_ANKLE[0] - 5, SUPINE_ANKLE[1]], [0, -1]),
    arms: {
      near: { target: [145, 325], side: [-1, 0], hand: -90 },
      far: { target: [141, 328], side: [-1, 0], hand: -90 },
    },
  });
  const extend = (): Pose => ({
    hip: SUPINE_HIP, spine: { lumbar: -177, thoracic: -177 }, neck: 181, head: 181,
    legs: legsAt(SUPINE_ANKLE, [SUPINE_ANKLE[0] - 5, SUPINE_ANKLE[1]], [0, -1]),
    arms: {
      near: { target: [150, 288], side: [-1, 0], hand: -90 },
      far: { target: [148, 293], side: [-1, 0], hand: -90 },
    },
  });
  return phase(t, [[0, loaded], [0.32, extend], [0.60, loaded]]);
}

function supineOverheadPose(t: number, single: boolean): Pose {
  const lying = (): Pose => ({
    hip: SUPINE_HIP, spine: { lumbar: -177, thoracic: -177 }, neck: 181, head: 181,
    legs: legsAt(SUPINE_ANKLE, [SUPINE_ANKLE[0] - 5, SUPINE_ANKLE[1]], [0, -1]),
    arms: single
      // The free arm rests across the torso. It must not hang through the floor from the supine shoulder.
      ? { near: { a1: 180, a2: 180, hand: 180 }, far: { a1: 0, a2: 0, hand: 0 } }
      : { near: { a1: 180, a2: 180, hand: 180 }, far: { a1: 177, a2: 177, hand: 177 } },
  });
  const sit = (): Pose => ({
    hip: [245, 330], spine: { lumbar: -52, thoracic: -55 }, neck: -58, head: -55,
    legs: legsAt(floorAnkle(350), floorAnkle(344)),
    arms: single ? oneArmTo([345, 215]) : chestArms([345, 215]),
  });
  return phase(t, [[0, lying], [0.34, sit], [0.62, lying]]);
}

function threePointPassPose(t: number): Pose {
  const start = (): Pose => ({
    hip: [185, 350], spine: { lumbar: 0, thoracic: -2 }, neck: -5, head: -2,
    legs: legsAt(floorAnkle(240), floorAnkle(150)),
    arms: {
      near: { target: [280, G - 13], side: [-1, 0], hand: 0 },
      // Only the near hand is grounded; keep the other hand beside the chest until it gathers the ball.
      far: { target: [230, 382], side: [-1, 0], hand: 0 },
    },
  });
  const grab = () => standingBall([260, 230]);
  const pass = () => extendedPass();
  return phase(t, [[0, start], [0.24, grab], [0.49, pass], [0.74, start]]);
}

function threePointPushPose(t: number): Pose {
  const ballStart = [HIGH_PLANK.wrist[0], HIGH_PLANK.wrist[1] + 28] as Vec2;
  const ballEnd = [ballStart[0] + 25, ballStart[1]] as Vec2;
  const c = t < 0.5 ? ballStart : t < 0.78 ? ballEnd : ballStart;
  return {
    ...HIGH_PLANK.body(HIGH_PLANK.top),
    arms: {
      near: { target: [c[0], c[1] - 28], side: [-1, 0], hand: 0 },
      far: { target: HIGH_PLANK.wristFar, side: [-1, 0], hand: 0 },
    },
  };
}

function ballCenter(kind: BallKind, t: number): Vec2 {
  if (kind === 'back-throw') return t < 0.29 ? [258, 340] : t < 0.55 ? [70, 65] : [180, 75];
  if (kind === 'chest-pass') return t < 0.28 ? [260, 205] : t < 0.53 ? [425, 160] : [265, 205];
  if (kind === 'chest-push') return t < 0.28 ? [260, 205] : t < 0.53 ? [363, 160] : [265, 205];
  if (kind === 'chest-run') return t < 0.24 ? [260, 205] : t < 0.47 ? [425, 160] : [390, 210];
  if (kind === 'chest-sprint') return t < 0.18 ? [245, 326] : t < 0.40 ? [270, 225] : t < 0.62 ? [425, 175] : [390, 210];
  if (kind === 'kneel-single' || kind === 'kneel-reset') return t < 0.24 ? [245, 278] : t < 0.52 ? [415, 258] : [285, 380];
  if (kind === 'slam') return t < 0.26 ? [250, 45] : t < 0.52 ? [300, G - 28] : [275, 240];
  if (kind === 'single-slam') return t < 0.26 ? [250, 45] : t < 0.52 ? [300, G - 28] : [275, 240];
  if (kind === 'vertical-throw') return t < 0.25 ? [260, 245] : t < 0.48 ? [250, 15] : [250, 115];
  if (kind === 'wall-throw') return t < 0.25 ? [180, 75] : t < 0.51 ? [430, 155] : [270, 180];
  if (kind === 'supine-chest') return t < 0.32 ? [145, 325] : t < 0.60 ? [145, 170] : [145, 325];
  if (kind === 'supine-overhead-single' || kind === 'supine-overhead-two') return t < 0.34 ? [70, 386] : t < 0.62 ? [430, 230] : [70, 386];
  if (kind === 'three-point-pass') return t < 0.24 ? [285, G - 32] : t < 0.49 ? [260, 230] : [425, 185];
  const b = [HIGH_PLANK.wrist[0], HIGH_PLANK.wrist[1] + 28] as Vec2;
  return t < 0.5 ? b : [b[0] + 25, b[1]];
}

export function ballExercise(spec: BallSpec): SideExercise {
  const pose = (t: number): Pose => {
    switch (spec.kind) {
      case 'back-throw': return backThrowPose(t);
      case 'chest-pass': return chestPassPose(t, false);
      case 'chest-push': return chestPassPose(t, false);
      case 'chest-run': return chestPassPose(t, true);
      case 'chest-sprint': return chestSprintPose(t);
      case 'kneel-single': return kneelPose(t, false);
      case 'kneel-reset': return kneelPose(t, true);
      case 'slam': return slamPose(t, false);
      case 'single-slam': return slamPose(t, true);
      case 'vertical-throw': return verticalThrowPose(t);
      case 'wall-throw': return wallThrowPose(t);
      case 'supine-chest': return supineChestPose(t);
      case 'supine-overhead-single': return supineOverheadPose(t, true);
      case 'supine-overhead-two': return supineOverheadPose(t, false);
      case 'three-point-pass': return threePointPassPose(t);
      case 'three-point-push': return threePointPushPose(t);
    }
  };
  const power = spec.kind === 'chest-pass' || spec.kind === 'chest-push' || spec.kind === 'chest-run' || spec.kind === 'chest-sprint' || spec.kind === 'three-point-pass'
    ? [{ m: 'pecs' as const }, { m: 'triceps' as const, side: 'both' as const, scale: 0.7 }, { m: 'delts' as const, side: 'both' as const, scale: 0.45 }]
    : spec.kind === 'slam' || spec.kind === 'single-slam'
      ? [{ m: 'lats' as const }, { m: 'abs' as const, scale: 0.7 }, { m: 'delts' as const, side: 'both' as const, scale: 0.55 }]
      : spec.kind === 'supine-overhead-single' || spec.kind === 'supine-overhead-two'
        ? [{ m: 'abs' as const }, { m: 'delts' as const, side: 'both' as const, scale: 0.55 }, { m: 'pecs' as const, scale: 0.35 }]
        : [{ m: 'delts' as const, side: 'both' as const }, { m: 'quads' as const, side: 'both' as const, scale: 0.45 }, { m: 'abs' as const, scale: 0.4 }];
  return {
    id: spec.id, name: spec.name,
    tl: timeline([{ d: 0.42, from: 0, to: 1, e: [0.55, 1] }, { d: 0.18, from: 1, to: 1, e: [1, 0.85] }, { d: 0.70, from: 1, to: 0, e: [0.8, 0.35] }]),
    meta: { en: spec.en, family: 'plyometric', equipment: ['medicine-ball'], sources: spec.sources },
    muscles: power,
    dynamic: [medicineBall((_J, t) => ({ p: ballCenter(spec.kind, t) }))],
    mat: spec.kind === 'supine-chest' || spec.kind === 'supine-overhead-single' || spec.kind === 'supine-overhead-two' || spec.kind === 'three-point-push',
    poster: spec.kind === 'slam' || spec.kind === 'single-slam' ? 0.33 : spec.kind === 'supine-chest' ? 0.44 : spec.kind === 'chest-sprint' ? 0.48 : spec.kind === 'chest-pass' || spec.kind === 'chest-push' || spec.kind === 'chest-run' || spec.kind === 'three-point-pass' ? 0.35 : 0.28,
    pose,
  };
}

/** Repeated two-foot hop over low hurdles. The barriers stay below knee height and the landing is visibly soft. */
export function hurdleExercise(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const crouch = (): Pose => planted([190, 335], floorAnkle(184), floorAnkle(178), -66, 143, 105);
  const air = (): Pose => flight([278, 215]);
  const land = (): Pose => planted([355, 324], floorAnkle(350), floorAnkle(344), -68, 18, 28);
  return {
    id: spec.id, name: spec.name,
    tl: timeline([{ d: 0.22, from: 0, to: 1, e: [0.65, 1] }, { d: 0.13, from: 1, to: 1, e: [1, 0.8] }, { d: 0.35, from: 1, to: 0, e: [0.8, 0.5] }]),
    meta: { en: spec.en, family: 'plyometric', equipment: ['other'], sources: spec.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.7 }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'hurdle-foot-a', color: pal.propDark, c: [285, G - 5], s: [76, 7], r: 3 },
      { kind: 'box', nm: 'hurdle-post-a', color: pal.metal, c: [285, G - 28], s: [7, 40], r: 3 },
      { kind: 'box', nm: 'hurdle-bar-a', color: pal.accent, c: [285, G - 47], s: [72, 7], r: 3 },
      { kind: 'box', nm: 'hurdle-foot-b', color: pal.propDark, c: [420, G - 5], s: [76, 7], r: 3 },
      { kind: 'box', nm: 'hurdle-post-b', color: pal.metal, c: [420, G - 28], s: [7, 40], r: 3 },
      { kind: 'box', nm: 'hurdle-bar-b', color: pal.accent, c: [420, G - 47], s: [72, 7], r: 3 },
    ] }),
    propsBox: [247, 458], poster: 0.42,
    pose: (t) => phase(t, [[0, crouch], [0.20, air], [0.55, land], [0.76, crouch]]),
  };
}

const SMITH = smithRails({ view: 'side', x: 250 });
/** The bar stays aligned to the rail while the athlete explodes upward and switches the split stance in flight. */
export function smithSplitJumpExercise(): SideExercise {
  const lunge = (nearX: number, farX: number): Pose => ({
    hip: [248, 341], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
    legs: legsAt(floorAnkle(nearX), floorAnkle(farX)),
    arms: {
      near: { target: (J) => [J.S[0] - 18, J.S[1] + 13], side: [-1, 0], hand: 180 },
      far: { target: (J) => [J.Sf[0] - 20, J.Sf[1] + 15], side: [-1, 0], hand: 180 },
    },
  });
  const air = (): Pose => ({
    hip: [248, 220], spine: { lumbar: -89, thoracic: -91 }, neck: -92, head: -90,
    legs: { near: { a1: 54, a2: 114, foot: 3 }, far: { a1: 130, a2: 70, foot: 3 } },
    arms: { near: { a1: 165, a2: 18, hand: 180 }, far: { a1: 168, a2: 20, hand: 180 } },
  });
  return {
    id: 'smith-machine-split-squat-jump', name: '史密斯分腿蹲跳',
    tl: timeline([{ d: 0.28, from: 0, to: 1, e: [0.65, 1] }, { d: 0.12, from: 1, to: 1, e: [1, 0.9] }, { d: 0.40, from: 1, to: 0, e: [0.85, 0.45] }]),
    meta: { en: 'Smith Machine Split Squat Jump', family: 'plyometric', equipment: ['smith', 'barbell'], sources: ['fe:Lunge_Sprint'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.8 }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'hamstrings', side: 'both', scale: 0.45 }],
    props: (pal) => ({ back: SMITH.draw(pal) }), propsBox: SMITH.box,
    dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: J.S }) })], poster: 0.62,
    pose: (t) => phase(t, [[0, () => lunge(300, 195)], [0.25, air], [0.57, () => lunge(195, 300)], [0.80, air], [0.92, () => lunge(300, 195)]]),
  };
}
