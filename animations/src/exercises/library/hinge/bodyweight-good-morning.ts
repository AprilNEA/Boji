// Bodyweight good morning, side view. Soft knees and planted feet stay fixed while the hips move back.
// The hands rest on the hips as the neutral torso hinges forward and returns upright.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-2.ts';
export default goodMorning({ id:'bodyweight-good-morning',name:'徒手早安式体前屈',en:'Bodyweight Good Morning',equipment:['bodyweight'],sources:['hz:3292'],muscles:[{m:'hamstrings',side:'both'},{m:'glutes',scale:0.8},{m:'lowerBack',scale:0.4}] },{bodyweight:true}) satisfies SideExercise;
