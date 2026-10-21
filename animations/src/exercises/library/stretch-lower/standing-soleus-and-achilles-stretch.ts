// Standing soleus and Achilles stretch, side view. The feet are staggered with both soles grounded.
// The knees travel forward together while the rear heel stays pressed into the floor.
// The torso remains upright and the hands rest on the hips.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { G, handOnHip } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;

export default {
  id: 'standing-soleus-and-achilles-stretch',
  name: '站姿比目鱼肌及跟腱拉伸',
  tl,
  meta: { en: 'Standing Soleus and Achilles Stretch', family: 'stretch-lower', equipment: ['bodyweight'], sources: ['fe:Standing_Soleus_And_Achilles_Stretch'] },
  muscles: [{ m: 'calves', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.3 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [lerp(267, 283, p), lerp(255, 306, p)],
      spine: { lumbar: lerp(-90, -82, p), thoracic: lerp(-90, -84, p) }, neck: -88, head: -88,
      legs: {
        near: { target: [lerp(267, 323, p), G - 13], foot: 0, side: [1, 0] },
        far: { target: [lerp(264, 222, p), G - 13], foot: 0, side: [1, 0] },
      },
      arms: { near: handOnHip(0), far: handOnHip(-5) },
    };
  },
} satisfies SideExercise;
