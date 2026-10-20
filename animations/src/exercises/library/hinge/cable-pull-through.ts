// Rope cable pull-through, side view. The low cable passes between the planted feet to hands behind the hips.
// Straight arms stay passive while a neutral hip hinge extends to a tall glute lockout.
import type { SideExercise } from '@/exercise.ts'; import { cablePullThrough } from './_hinge-2.ts';
export default cablePullThrough({id:'cable-pull-through',name:'绳索胯下拉',en:'Cable Pull-Through',equipment:['cable'],sources:['fe:Pull_Through','hz:0196'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.8},{m:'lowerBack',scale:0.4}]}) satisfies SideExercise;
