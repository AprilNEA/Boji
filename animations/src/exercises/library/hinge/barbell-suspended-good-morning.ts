// Suspended barbell good morning, side view. The bar rests across the rear shoulders beneath a chain-supported rack.
// Soft knees stay fixed while the hips hinge from a near-parallel torso back to a tall neutral finish.
import type { SideExercise } from '@/exercise.ts'; import { goodMorning } from './_hinge-2.ts';
export default goodMorning({id:'barbell-suspended-good-morning',name:'杠铃悬吊早安式体前屈',en:'Barbell Suspended Good Morning',equipment:['barbell','suspension'],sources:['fe:Hanging_Bar_Good_Morning'],muscles:[{m:'hamstrings',side:'both'},{m:'glutes',scale:0.8},{m:'lowerBack',scale:0.5}]},{suspended:true}) satisfies SideExercise;
