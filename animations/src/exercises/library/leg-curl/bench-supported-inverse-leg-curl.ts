// Bench-supported inverse leg curl, side view. The chest and hips stay on the bench while the hands hold its front.
// Start with both knees straight behind the bench edge. Curl both heels toward the glutes to about 70° of knee flexion.
// The bench, pelvis, upper legs, and hands remain fixed throughout the repetition.
import type { SideExercise } from '@/exercise.ts';
import { curlAngle, curlTL, PRONE, proneCurlPose } from './_leg-curl.ts';

export default {
  id: 'bench-supported-inverse-leg-curl',
  name: '凳支撑俯卧腿弯举',
  tl: curlTL,
  meta: {
    en: 'Bench-Supported Inverse Leg Curl', family: 'leg-curl', equipment: ['bench'], sources: ['hz:0496'],
  },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.4 }, { m: 'calves', side: 'both', scale: 0.3 }],
  props: (pal) => ({
    back: [
      ...PRONE.bench.draw(pal),
      { kind: 'box', nm: 'bench-handle', color: pal.metalDark, c: PRONE.handle, s: [34, 8], r: 4 },
    ],
  }),
  propsBox: PRONE.bench.box,
  pose: (t) => proneCurlPose(curlAngle(t)),
} satisfies SideExercise;
