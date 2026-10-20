// Cable deadlift, side view. The lifter stands between low pulleys and keeps both handles beside the legs.
// Hips and knees extend together while the cables remain taut, then lower under control.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'cable-deadlift',name:'绳索硬拉',en:'Cable Deadlift',equipment:['cable'],sources:['fe:Cable_Deadlifts','hz:0157'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'quads',side:'both',scale:0.65},{m:'lowerBack',scale:0.4},{m:'forearms',side:'both',scale:0.3}]},{implement:'cable'}) satisfies SideExercise;
