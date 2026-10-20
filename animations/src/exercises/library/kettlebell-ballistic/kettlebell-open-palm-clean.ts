// Start with the bell on the floor and both hands on its handle.
// Drive through a hip hinge, flip the bell into open palms, then return it under control.
import type { SideExercise } from '@/exercise.ts';
import { openPalmClean } from './_kettlebell-ballistic.ts';
export default openPalmClean({ id: 'kettlebell-open-palm-clean', name: '壶铃掌心翻转上翻', en: 'Kettlebell Open-Palm Clean', sources: ['fe:Open_Palm_Kettlebell_Clean'] }, false) satisfies SideExercise;
