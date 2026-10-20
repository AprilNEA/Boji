// Contralateral dumbbell single-leg deadlift, side view. The working leg stays softly bent and grounded.
// The free leg reaches straight back as the opposite hand lowers the weight beneath the shoulder.
import type { SideExercise } from '@/exercise.ts'; import { singleLegDeadlift } from './_hinge-2.ts';
export default singleLegDeadlift({id:'dumbbell-single-leg-deadlift',name:'哑铃单腿硬拉',en:'Dumbbell Single-Leg Deadlift',equipment:['dumbbell'],sources:['hz:1757'],muscles:[{m:'glutes',side:'near'},{m:'hamstrings',side:'near',scale:0.85},{m:'lowerBack',scale:0.35}]},{opposite:true}) satisfies SideExercise;
