// Smith bent-knee good morning, side view. The bar slides on the rails behind the shoulders while both feet stay planted.
// The knees stay bent as the hips hinge to a flat back, then extend to return under the guided bar.
import type { SideExercise } from '@/exercise.ts'; import { smithGoodMorning } from './_hinge-2.ts';
export default smithGoodMorning({id:'smith-bent-knee-good-morning',name:'史密斯屈膝早安式',en:'Smith Bent-Knee Good Morning',equipment:['smith'],sources:['hz:0749'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'lowerBack',scale:0.45}]}) satisfies SideExercise;
