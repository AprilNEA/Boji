// Trap-bar deadlift, side view. The athlete stands inside the hexagonal frame and holds the raised side handles.
// The frame leaves the floor through knee and hip extension, then returns straight down under control.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'trap-bar-deadlift',name:'六角杠硬拉',en:'Trap Bar Deadlift',equipment:['trap-bar'],sources:['fe:Trap_Bar_Deadlift','hz:0811'],muscles:[{m:'quads',side:'both'},{m:'glutes',scale:0.9},{m:'hamstrings',side:'both',scale:0.7},{m:'lowerBack',scale:0.35}]},{implement:'trap'}) satisfies SideExercise;
