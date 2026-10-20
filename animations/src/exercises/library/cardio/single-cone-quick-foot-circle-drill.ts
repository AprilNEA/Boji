// Single-cone quick-foot drill, front view. Rapid alternating knees stay light beside a fixed training cone.
// The arms block opposite the driving knee. The cone remains clear of the feet throughout the step cycle.
import type { FrontExercise } from '@/exercise.ts';
import { cardioTL, coneProps, frontRunPose } from './_cardio-1.ts';

export default {
  id: 'single-cone-quick-foot-circle-drill',
  name: '单锥桶绕圈快步跑',
  view: 'front',
  tl: cardioTL(0.72),
  poster: 0.25,
  meta: { en: 'Single-Cone Quick-Foot Circle Drill', family: 'cardio', equipment: ['bodyweight', 'other'], sources: ['fe:Single-Cone_Sprint_Drill'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.6 }, { m: 'glutes', scale: 0.35, region: { view: 'front', part: 'pelvis', c: [0, 3], s: [24, 14] } }],
  props: coneProps,
  propsBox: [-50, 305],
  pose: (t) => frontRunPose(t, { lift: 48, spread: 24 }),
} satisfies FrontExercise;
