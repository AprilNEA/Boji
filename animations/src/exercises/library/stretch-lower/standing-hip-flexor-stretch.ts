// Standing hip-flexor stretch, side view. The front foot stays flat while the rear heel lifts.
// Both knees bend and the rear hip presses forward without arching the spine.
// Hands remain on the hips so the lunge position stays clear.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { G, handOnHip } from '@/exercises/common.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;

export default {
  id: 'standing-hip-flexor-stretch',
  name: '站姿髋屈肌拉伸',
  tl,
  meta: { en: 'Standing Hip Flexor Stretch', family: 'stretch-lower', equipment: ['bodyweight'], sources: ['fe:Standing_Hip_Flexors'] },
  muscles: [{ m: 'hipFlexor', side: 'far' }, { m: 'quads', side: 'far', scale: 0.55 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [lerp(263, 284, p), lerp(255, 299, p)],
      spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: {
        near: { target: [lerp(263, 325, p), G - 13], foot: 0, side: [1, 0] },
        // Rear toes stay down as the ankle rises for the hip-flexor stretch.
        far: { target: [lerp(260, 230, p), lerp(G - 13, G - 40, p)], foot: 76 * p, side: [1, 0] },
      },
      arms: { near: handOnHip(0), far: handOnHip(-5) },
    };
  },
} satisfies SideExercise;
