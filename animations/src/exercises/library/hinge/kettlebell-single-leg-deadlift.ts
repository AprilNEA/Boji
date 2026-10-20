// Kettlebell single-leg deadlift, side view. The bell and the planted working leg stay on the same side.
// The free leg extends back for balance while the torso and leg form a straight horizontal line.
import type { SideExercise } from '@/exercise.ts'; import { singleLegDeadlift } from './_hinge-2.ts';
export default singleLegDeadlift({id:'kettlebell-single-leg-deadlift',name:'壶铃单腿硬拉',en:'Kettlebell Single-Leg Deadlift',equipment:['kettlebell'],sources:['fe:Kettlebell_One-Legged_Deadlift'],muscles:[{m:'hamstrings',side:'near'},{m:'glutes',side:'near',scale:0.85},{m:'lowerBack',scale:0.35}]},{kettlebell:true}) satisfies SideExercise;
