// Machine seated good morning, side view. The hips stay on the seat and both feet remain flat on the footrest.
// The torso hinges forward against the pad, then returns with glutes and hamstrings while hands hold the seat handles.
import type { SideExercise } from '@/exercise.ts'; import { seatedGoodMorning } from './_hinge-2.ts';
export default seatedGoodMorning({id:'machine-seated-good-morning',name:'器械坐姿早安式',en:'Machine Seated Good Morning',equipment:['machine'],sources:['hz:3759'],muscles:[{m:'glutes'},{m:'hamstrings',side:'both',scale:0.75},{m:'lowerBack',scale:0.45}]}) satisfies SideExercise;
