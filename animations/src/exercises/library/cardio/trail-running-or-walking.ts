// Trail running or walking, side view. The runner takes short, bent-knee strides over an uneven sloping trail.
// Each foot contacts the path before the other foot swings forward. The trunk stays tall with a slight forward lean.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose, trailProps } from './_cardio-1.ts';

export default {
  id: 'trail-running-or-walking',
  name: '越野跑或徒步',
  tl: cardioTL(1.25),
  poster: 0.25,
  meta: { en: 'Trail Running or Walking', family: 'cardio', equipment: ['bodyweight'], sources: ['fe:Trail_Running_Walking'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'glutes', scale: 0.35 }],
  props: trailProps,
  propsBox: [70, 445],
  pose: (t) => sideRunPose(t, { stride: 21, lift: 19, lean: -82, hipY: 268 }),
} satisfies SideExercise;
