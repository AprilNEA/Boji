// Lie on the back with the pelvis and shoulders supported by the mat.
// Hold below both knees and draw them gently toward the chest without pulling over the kneecaps.
import type { SideExercise } from '@/exercise.ts';
import { kneesToChestPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'supine-knees-to-chest-stretch', name: '仰卧抱膝拉伸', tl: stretchTL, mat: true,
  meta: { en: 'Supine Knees-to-Chest Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['fe:Hug_Knees_To_Chest'] },
  muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.55 }],
  poster: 0.44, pose: (t) => kneesToChestPose(stretchTL.at(t).p),
} satisfies SideExercise;
