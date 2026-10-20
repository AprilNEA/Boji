// Stand tall with thumbs up and dumbbells hanging at the sides.
// Raise both straight arms 30 degrees forward of the body to shoulder height, then lower under control.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-scaption', name: '哑铃肩胛平面上举', en: 'Dumbbell Scaption', sources: ['fe:Dumbbell_Scaption'] }, { scaption: 30 }) satisfies FrontExercise;
