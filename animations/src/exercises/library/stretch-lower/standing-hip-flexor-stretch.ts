// Standing hip-flexor stretch, side view. The front foot stays flat while the rear heel lifts.
// Both knees bend and the rear hip presses forward without arching the spine.
// Hands remain on the hips so the lunge position stays clear.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { handOnHip } from '@/exercises/common.ts';
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
        near: { a1: lerp(90, 72, p), a2: lerp(90, 34, p), foot: 0 },
        // Rear ankle is raised, with the toes keeping contact on the floor.
        far: { a1: lerp(90, 165, p), a2: lerp(90, 80, p), foot: lerp(0, 76, p) },
      },
      arms: { near: handOnHip(0), far: handOnHip(-5) },
    };
  },
} satisfies SideExercise;
