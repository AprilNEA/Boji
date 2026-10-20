// Car deadlift, side view. The lifter stands inside the vehicle-loaded lever frame and grips its neutral handles.
// The planted feet drive knees and hips to stand, raising the frame before a controlled return.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'car-deadlift',name:'汽车硬拉',en:'Car Deadlift',equipment:['other'],sources:['fe:Car_Deadlift'],muscles:[{m:'quads',side:'both'},{m:'glutes',scale:0.85},{m:'hamstrings',side:'both',scale:0.7},{m:'lowerBack',scale:0.45},{m:'forearms',side:'both',scale:0.35}]},{implement:'car'}) satisfies SideExercise;
