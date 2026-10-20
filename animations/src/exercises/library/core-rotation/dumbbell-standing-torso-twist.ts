// Stand wide and tall with one pronated dumbbell in each straight arm.
// Rotate the trunk to swing both dumbbells together from one hip to the other.
// The hips and knees stay extended while both feet remain flat on the floor.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbell } from '@/exercises/equipment/index.ts';
import { standing } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'dumbbell-standing-torso-twist', name: '哑铃站姿转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Dumbbell Standing Torso Twist', family: 'core-rotation', equipment: ['dumbbell'], sources: ['fe:Spell_Caster'] },
  muscles: [{ m: 'abs', e: () => 0.85 }, { m: 'obliques', scale: 0.75, e: () => 0.8 }, { m: 'glutes', scale: 0.35, e: () => 0.35, region: { view: 'front', part: 'pelvis', c: [0, 6], s: [22, 13] } }, { m: 'delts', scale: 0.3, e: () => 0.45 }],
  dynamic: [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')],
  poster: 0.25,
  pose(t) {
    const u = swing(t), x = 42 * u;
    return {
      ...standing(55, 188, 42 * u),
      arms: {
        l: { target: [x + 16, 230, 80], pole: [38, -18, 34] },
        r: { target: [x - 16, 230, 80], pole: [-38, -18, 34] },
      },
    };
  },
} satisfies FrontExercise;
