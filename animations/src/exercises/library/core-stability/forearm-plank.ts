// Support the body on the forearms and toes with elbows directly below the shoulders.
// Keep the hips level with the shoulders and heels during the sustained hold.
import type { SideExercise } from '@/exercise.ts';
import { FOREARM_PLANK } from './_core-stability-1.ts';

const breath = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);

export default {
  id: 'forearm-plank',
  name: '前臂平板支撑',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Forearm Plank', family: 'core-stability', equipment: ['bodyweight'], sources: ['fe:Plank'] },
  muscles: [
    { m: 'abs', e: (t) => 0.75 + 0.2 * breath(t) }, { m: 'glutes', e: () => 0.5 },
    { m: 'delts', side: 'near', scale: 0.4, e: () => 0.45 },
  ],
  poster: 0.25,
  pose: (t) => ({ ...FOREARM_PLANK.body(breath(t)), arms: FOREARM_PLANK.arms }),
} satisfies SideExercise;
