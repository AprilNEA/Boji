// Jumping jack, front view. One loop: hop out to a wide stance with the arms overhead, then hop back in.
// Feet leave the ground in the middle of each transition; the knees soften at each landing.
import type { FrontExercise } from '@/exercise.ts';
import { add3, type Vec3 } from '@/math3.ts';
import { lerp } from '@/math.ts';
import { BODY } from '@/rig.ts';
import { FB, type FSide } from '@/front-rig.ts';

const TAU = Math.PI * 2;
/** 0 with the feet together (t = 0), 1 in the wide stance (t = 0.5). */
const open = (t: number): number => (1 - Math.cos(TAU * t)) / 2;
/** Height of the feet above the ground: peaks in the middle of each transition. */
const hop = (t: number): number => 12 * Math.sin(TAU * t) ** 2;
/** Knee bend at the landings: 1 at t = 0 and t = 0.5. */
const land = (t: number): number => Math.cos(TAU * t) ** 4;
const SIGN: Record<FSide, number> = { l: 1, r: -1 };

export default {
  id: 'jumping-jack',
  name: '开合跳',
  view: 'front',
  tl: { total: 1.1 },
  meta: { en: 'Jumping Jack', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:3224'] },
  muscles: [
    // Calves push off and absorb each landing.
    { m: 'calves', e: (t) => 0.2 + 0.7 * land(t) },
    // Deltoids work while the arms travel.
    { m: 'delts', e: (t) => 0.2 + 0.65 * Math.abs(Math.sin(TAU * t)) },
    { m: 'abductors', e: (t) => 0.15 + 0.6 * Math.max(0, Math.sin(TAU * t)) },
  ],
  pose(t) {
    const u = open(t), h = hop(t), k = land(t);
    const footX = lerp(13, 58, u);
    const ankleY = BODY.ankleH + h;
    // Straight-leg pelvis height for this stance, less 1 px of slack, then the landing bend.
    const reach = BODY.thigh + BODY.shin - 1;
    const pelvisY = ankleY + Math.sqrt(reach * reach - (footX - FB.hipHalf) ** 2) - 9 * k;
    const leg = (s: FSide) => ({ target: [footX * SIGN[s], ankleY, 2] as Vec3 });
    // Arms abduct in the frontal plane, nearly straight, slightly in front of the body.
    const theta = lerp(10, 172, u) * (Math.PI / 180);
    return {
      pelvis: [0, pelvisY, 0],
      legs: { l: leg('l'), r: leg('r') },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [Math.sin(theta) * 122, -Math.cos(theta) * 122, 8]) },
        r: { target: (J) => add3(J.shoulder_r, [-Math.sin(theta) * 122, -Math.cos(theta) * 122, 8]) },
      },
      // Shoulders rise as the arms go overhead.
      shoulders: { l: { up: 5 * u }, r: { up: 5 * u } },
      head: { pitch: -3 * u },
    };
  },
} satisfies FrontExercise;
