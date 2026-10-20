// Dumbbell deadlift, side view. Both weights remain close to the legs with feet flat and the chest lifted.
// The knees and hips extend together from the floor-level start to a controlled standing lockout.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'dumbbell-deadlift',name:'哑铃硬拉',en:'Dumbbell Deadlift',equipment:['dumbbell'],sources:['hz:0300'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'quads',side:'both',scale:0.65},{m:'lowerBack',scale:0.4}]},{implement:'dumbbell'}) satisfies SideExercise;
