// Dumbbell lateral raise, front view. Feet hip-width, knees soft, trunk tipped slightly forward.
// The arms rise out to the sides in a wide arc to shoulder height, elbows slightly bent, then lower under control.
// The shoulders stay down: no shrug.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math/vec3.ts';
import { D2R, lerp } from '@/math/vec2.ts';
import { BODY } from '@/rig/side.ts';
import { frontDumbbell, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.3);
/** Shoulder-to-wrist distance with the elbows slightly bent (about 162°). Full reach is 126. */
const REACH = 124.5;
/** Arm abduction from vertical, at the bottom and at the top. */
const LOW = 9, HIGH = 86;

export default {
  id: 'dumbbell-lateral-raise',
  name: '哑铃侧平举',
  view: 'front',
  tl,
  meta: {
    en: 'Dumbbell Lateral Raise',
    family: 'lateral-raise',
    equipment: ['dumbbell'],
    sources: ['fe:Dumbbell_Raise', 'fe:Power_Partials', 'hz:0332', 'hz:0334', 'hz:0376'],
  },
  muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.3 }],
  dynamic: [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')],
  pose(t) {
    const { p } = tl.at(t);
    const th = lerp(LOW, HIGH, p) * D2R;
    // Hands start in front of the thighs and rise in the scapular plane, about 15° in front of straight out to the side.
    const z = lerp(16, 40, p);
    // Keep the shoulder-to-wrist distance at REACH: the forward offset z takes part of it.
    const r = Math.sqrt(REACH * REACH - z * z);
    return {
      // Soft knees: about 171°.
      pelvis: [0, BODY.ankleH + 183.3, 0],
      hips: { pitch: 6 },
      spine: { pitch: -2 },
      head: { pitch: -4 },
      legs: { l: { target: [16, BODY.ankleH, 2] }, r: { target: [-16, BODY.ankleH, 2] } },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [Math.sin(th) * r, -Math.cos(th) * r, z]) },
        r: { target: (J) => add3(J.shoulder_r, [-Math.sin(th) * r, -Math.cos(th) * r, z]) },
      },
    };
  },
} satisfies FrontExercise;
