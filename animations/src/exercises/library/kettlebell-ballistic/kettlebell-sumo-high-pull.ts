// Start in a wide sumo squat with both hands on the kettlebell handle.
// Extend the knees and hips, then pull to the chest with high, wide elbows before lowering.
import type { FrontExercise } from '@/exercise.ts';
import { sumoHighPull } from './_kettlebell-ballistic.ts';

export default sumoHighPull({ id: 'kettlebell-sumo-high-pull', name: '壶铃相扑高拉', en: 'Kettlebell Sumo High Pull', sources: ['fe:Kettlebell_Sumo_High_Pull', 'hz:0548'] }) satisfies FrontExercise;
