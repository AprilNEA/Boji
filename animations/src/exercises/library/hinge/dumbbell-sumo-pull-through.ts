// Dumbbell sumo pull-through, side view. The feet are wide and the dumbbell hangs between the thighs.
// The hips and knees extend through the heels to bring the weight forward, then return between the legs.
import type { SideExercise } from '@/exercise.ts'; import { dumbbellSumoPullThrough } from './_hinge-2.ts';
export default dumbbellSumoPullThrough({id:'dumbbell-sumo-pull-through',name:'哑铃相扑式拉穿',en:'Dumbbell Sumo Pull-Through',equipment:['dumbbell'],sources:['hz:2808'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.75},{m:'quads',side:'both',scale:0.55}]}) satisfies SideExercise;
