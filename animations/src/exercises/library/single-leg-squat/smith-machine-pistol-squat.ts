// Smith-machine pistol squat, side view. The upper-back bar slides vertically on the rail above a planted near heel.
// The support foot stays in front of the rail and the far leg remains straight and lifted forward.
// The hips and knee flex together, pause at depth, then extend through the heel without moving the bar sideways.
import type { SideExercise } from '@/exercise.ts';
import { barbell, smithRails } from '@/exercises/equipment/index.ts';
import { pistolTL, smithBarY, smithPistolPose, SMITH_RAIL_X } from './_single-leg-squat.ts';

const rails = smithRails({ view: 'side', x: SMITH_RAIL_X, top: 32 });

export default {
  id: 'smith-machine-pistol-squat',
  name: '史密斯机手枪深蹲',
  tl: pistolTL,
  meta: { en: 'Smith Machine Pistol Squat', family: 'single-leg-squat', equipment: ['smith'], sources: ['fe:Smith_Machine_Pistol_Squat'] },
  muscles: [
    { m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.6 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.35 },
  ],
  props: (pal) => ({ back: rails.draw(pal) }),
  propsBox: rails.box,
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (_J, t) => ({ p: [SMITH_RAIL_X, smithBarY(t)] }) })],
  pose: smithPistolPose,
} satisfies SideExercise;
