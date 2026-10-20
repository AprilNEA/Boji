// Start supine with bent knees, flat feet and arms on the floor beside the torso.
// Drive through the heels to raise the pelvis until the trunk and thighs align.
// The neck base stays on the mat and both feet stay planted throughout.
import type { SideExercise } from '@/exercise.ts';
import { bridgePose, bridgeTL } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();

export default {
  id: 'bodyweight-glute-bridge', name: '自重臀桥', tl, mat: true,
  meta: { en: 'Bodyweight Glute Bridge', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['fe:Butt_Lift_Bridge'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.55 }],
  pose: (t) => bridgePose(tl.at(t).p),
} satisfies SideExercise;
