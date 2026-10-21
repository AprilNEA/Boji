// Barbell deadlift (conventional), side view. Feet hip-width, the bar over the middle of the feet, overhand grip
// just outside the legs. Start: hips above the knees, flat back about 26° above horizontal, shoulders a little in
// front of the bar, arms straight. The bar travels straight up. Below the knees the legs do the work and the back
// angle barely changes; above the knees the hips drive forward to a tall lockout with the bar against the thighs.
// The descent retraces the same path: hips back first, knees bend once the bar passes them.
// Everything follows from the bar height: shoulders sit at arm's length above the bar, the torso angle and the
// shoulder offset depend on the height, the hips hang below the shoulders, and the legs reach the planted feet by IK.
import type { SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import type { Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, hipForShoulder, standLegs } from '@/exercises/common.ts';
import { barbell, gripAt, PLATE } from '@/exercises/equipment/index.ts';

const tl = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.9, 0.75] },
  { d: 0.5, from: 1, to: 1, e: [0.55, 0.5] },
  { d: 1.6, from: 1, to: 0, e: [0.6, 0.7] },
  { d: 0.5, from: 0, to: 0, e: [0.3, 0.3] },
]);

const X0 = 262; // near ankle
const BX = X0 + 14; // bar path: over the middle of the foot
/** Bar center height above the floor: plates on the floor, at the knees, and at lockout (upper thighs). H_TOP follows
 * from straight legs, the hip-to-shoulder distance of the rig and straight arms; higher values overstretch the legs. */
const H_FLOOR = PLATE.full / 2, H_KNEE = 100, H_TOP = 168;

/** Torso direction (degrees, -90 is upright) and shoulder offset in front of the bar, at bar height h. */
function torso(h: number): { th: number; d: number } {
  if (h <= H_KNEE) {
    const u = (h - H_FLOOR) / (H_KNEE - H_FLOOR);
    return { th: lerp(-26, -36, u), d: lerp(9, 3, u) };
  }
  const u = smooth(clamp((h - H_KNEE) / (H_TOP - H_KNEE), 0, 1));
  // At lockout the shoulders are behind the bar: the bar rests on the front of the thighs.
  return { th: lerp(-36, -91, u), d: lerp(3, -15, u) };
}

function pose(h: number): Pose {
  const { th, d } = torso(h);
  const grip: Vec2 = [BX, G - h];
  const wrist: Vec2 = [BX, grip[1] - GRIP_IN_HAND];
  // The hands point straight down, so the wrist is directly above the grip and the arm runs from S to the wrist.
  const dy = Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - d * d);
  const S: Vec2 = [BX + d, wrist[1] - dy];
  // Lumbar and thoracic along almost the same direction: a flat, braced back.
  const spine = { lumbar: th + 1, thoracic: th - 1 };
  return {
    hip: hipForShoulder(S, spine), spine,
    // Neutral neck: the head continues the line of the back.
    neck: th + 3, head: th + 1,
    // Feet parallel, hip-width: in side view both hips and both ankles line up.
    farHip: 0,
    legs: standLegs(X0, 0),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 90 },
      // The far shoulder sits a little behind the near one; shift the far hand by the same amount so both arms
      // stay straight and parallel.
      far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
    },
  };
}
const height = (t: number): number => lerp(H_FLOOR, H_TOP, tl.at(t).p);

export default {
  id: 'barbell-deadlift',
  name: '杠铃硬拉',
  tl,
  meta: { en: 'Barbell Deadlift', family: 'hinge', equipment: ['barbell'], sources: ['fe:Barbell_Deadlift', 'hz:0032'] },
  muscles: [
    { m: 'glutes' }, { m: 'hamstrings', side: 'both' }, { m: 'lowerBack', scale: 0.8 },
    // Quads drive the bar off the floor; they matter less near lockout.
    { m: 'quads', side: 'both', scale: 0.7, e: (t) => 1 - smooth(clamp((height(t) - H_FLOOR) / (H_TOP - H_FLOOR), 0, 1)) },
    { m: 'traps', scale: 0.35 }, { m: 'forearms', side: 'both', scale: 0.4 },
  ],
  dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [BX - PLATE.full / 2, BX + PLATE.full / 2],
  // Lockout: the top of the lift.
  poster: (1.5 + 0.25) / 4.1,
  pose: (t) => pose(height(t)),
} satisfies SideExercise;
