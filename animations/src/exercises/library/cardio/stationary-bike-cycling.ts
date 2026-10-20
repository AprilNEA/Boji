// Sit tall on the saddle with each foot secured to a pedal.
// Pedal smoothly through opposite crank circles while the torso remains stable.
import type { SideExercise } from '@/exercise.ts';
import { bicycle } from './_cardio-2.ts';

export default {
  ...bicycle({ en: 'Stationary Bike Cycling', sources: ['fe:Bicycling_Stationary', 'hz:2138', 'hz:0798'] }, '固定自行车骑行', 'stationary'),
  id: 'stationary-bike-cycling',
} satisfies SideExercise;
