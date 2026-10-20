// Axle deadlift, side view. The thick axle begins over mid-foot with straight arms and a braced chest.
// Hips and knees extend together until the axle reaches the thighs, then it returns to the floor under control.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'axle-deadlift',name:'粗轴杠硬拉',en:'Axle Deadlift',equipment:['other'],sources:['fe:Axle_Deadlift'],muscles:[{m:'lowerBack'},{m:'glutes',scale:0.85},{m:'hamstrings',side:'both',scale:0.75},{m:'quads',side:'both',scale:0.65},{m:'forearms',side:'both',scale:0.4}]},{implement:'axle'}) satisfies SideExercise;
