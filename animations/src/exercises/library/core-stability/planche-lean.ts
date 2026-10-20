// Begin in a high plank with the toes and palms fixed to the mat.
// Shift the shoulders beyond the wrists while keeping the body rigid and elbows soft.
// Return under control without allowing the hips to sag or pike.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { plancheLeanPose } from './_core-stability-2.ts';

const tl = workTL(0.8);

export default {
  id: 'planche-lean',
  name: '俄式挺身前倾',
  tl,
  mat: true,
  meta: { en: 'Planche Lean', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3300'] },
  muscles: [
    { m: 'abs' }, { m: 'delts', side: 'both', scale: 0.7 },
    { m: 'triceps', side: 'both', scale: 0.58 }, { m: 'pecs', scale: 0.38 },
  ],
  poster: 0.31,
  pose: (t) => plancheLeanPose(tl.at(t).p),
} satisfies SideExercise;
