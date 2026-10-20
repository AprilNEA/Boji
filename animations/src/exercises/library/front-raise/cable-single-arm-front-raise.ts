// Face away from a low pulley with one cable handle held in front of the thigh.
// Raise that arm with a soft elbow to slightly above shoulder height, then lower without swinging.
// The free hand remains on the hip while the cable, torso and feet stay controlled.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'cable-single-arm-front-raise', name: '绳索单臂前平举', en: 'Cable Single-Arm Front Raise',
  sources: ['fe:Front_Cable_Raise'], implement: 'cable', unilateral: true, top: -6,
}) satisfies SideExercise;
