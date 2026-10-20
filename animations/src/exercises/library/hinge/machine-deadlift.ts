// Leverage-machine deadlift, side view. The feet stay under the hips while both hands hold the low lever handle.
// The hips and knees extend to stand tall, then the loaded lever lowers under control.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'machine-deadlift',name:'器械硬拉',en:'Machine Deadlift',equipment:['machine'],sources:['fe:Leverage_Deadlift','hz:0578'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'quads',side:'both',scale:0.65}]},{implement:'machine'}) satisfies SideExercise;
