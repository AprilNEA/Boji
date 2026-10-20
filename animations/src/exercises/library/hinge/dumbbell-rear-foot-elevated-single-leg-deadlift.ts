// Rear-foot-supported single-leg dumbbell deadlift, side view. The working foot stays planted and the rear foot starts at a low step.
// The body hinges over the working leg as the free leg extends behind and the dumbbell lowers under the shoulder.
import type { SideExercise } from '@/exercise.ts'; import { singleLegDeadlift } from './_hinge-2.ts';
export default singleLegDeadlift({id:'dumbbell-rear-foot-elevated-single-leg-deadlift',name:'哑铃后脚垫高单腿硬拉',en:'Dumbbell Rear-Foot-Elevated Single-Leg Deadlift',equipment:['dumbbell','step'],sources:['hz:2805'],muscles:[{m:'glutes',side:'near'},{m:'hamstrings',side:'near',scale:0.85},{m:'lowerBack',scale:0.35}]},{rearStep:true}) satisfies SideExercise;
