// Standing gastrocnemius stretch, side view. The working heel rests on a low step with the knee long.
// The torso folds from the hips so one hand can draw the raised toes back.
// The support leg stays planted and the free hand rests on its thigh.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { G } from '@/exercises/common.ts';
import { step, stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const hip = (p: number): [number, number] => [lerp(258, 242, p), lerp(255, 255, p)];

export default {
  id: 'standing-gastrocnemius-stretch',
  name: '站姿腓肠肌拉伸',
  tl,
  meta: { en: 'Standing Gastrocnemius Stretch', family: 'stretch-lower', equipment: ['bodyweight', 'step'], sources: ['fe:Standing_Gastrocnemius_Calf_Stretch'] },
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.35 }],
  props: step(338, G - 17, 126),
  pose(t) {
    const p = tl.at(t).p, H = hip(p);
    return {
      hip: H,
      spine: { lumbar: lerp(-90, -4, p), thoracic: lerp(-90, -7, p) },
      neck: lerp(-90, -10, p), head: lerp(-88, -11, p),
      legs: {
        // The near leg remains nearly straight as the heel sits on the step.
        near: { a1: 62, a2: 62, foot: lerp(0, -66, p) },
        far: { a1: 90, a2: 90, foot: 0 },
      },
      arms: {
        near: { a1: lerp(90, 106, p), a2: lerp(90, 106, p), hand: lerp(90, -66, p) },
        far: { a1: lerp(92, 110, p), a2: lerp(92, 110, p), hand: lerp(92, -66, p) },
      },
    };
  },
} satisfies SideExercise;
