// Single-arm Smith row, side view. Stand with a soft-knee hip hinge and brace the free hand on the thigh.
// Pull the guided bar toward the waist with one close elbow and a stable, flat torso.
// The rail fixes the bar path, so the working arm moves without twisting the trunk.
import type { SideExercise } from '@/exercise.ts';
import { makeSmithBentRow } from './_horizontal-row-3.ts';

export default makeSmithBentRow({
  id: 'smith-single-arm-row', name: '史密斯单臂划船', en: 'Smith Single-Arm Row',
  equipment: ['smith', 'barbell'], sources: ['hz:1360'],
}, { single: true }) satisfies SideExercise;
