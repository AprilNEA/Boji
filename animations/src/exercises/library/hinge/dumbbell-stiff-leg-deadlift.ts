// Dumbbell stiff-leg deadlift, side view. The knees keep a small fixed bend and both weights track above the feet.
// The hips hinge back with a long neutral spine, then extend without changing the knee bend.
import type { SideExercise } from '@/exercise.ts'; import { stiffLegDeadlift } from './_hinge-2.ts';
export default stiffLegDeadlift({id:'dumbbell-stiff-leg-deadlift',name:'哑铃直腿硬拉',en:'Dumbbell Stiff-Leg Deadlift',equipment:['dumbbell'],sources:['fe:Stiff-Legged_Dumbbell_Deadlift','hz:0432','hz:0434'],muscles:[{m:'hamstrings',side:'both'},{m:'glutes',scale:0.8},{m:'lowerBack',scale:0.45}]},{implement:'dumbbell'}) satisfies SideExercise;
