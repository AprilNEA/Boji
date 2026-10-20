// Smith deadlift, side view. The hands keep the bar close to the body as it slides along the vertical rail.
// A braced chest and planted feet support simultaneous hip and knee extension to standing.
import type { SideExercise } from '@/exercise.ts'; import { floorDeadlift } from './_hinge-2.ts';
export default floorDeadlift({id:'smith-deadlift',name:'史密斯硬拉',en:'Smith Deadlift',equipment:['smith'],sources:['hz:0752'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'quads',side:'both',scale:0.65},{m:'lowerBack',scale:0.4}]},{implement:'barbell',smith:true}) satisfies SideExercise;
