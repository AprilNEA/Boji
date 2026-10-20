// Smith stiff-leg deadlift, side view. Soft knees stay still while both hands keep the bar near the legs.
// The hips travel back into a long neutral-spine hinge, then drive forward to the tall start position.
import type { SideExercise } from '@/exercise.ts'; import { stiffLegDeadlift } from './_hinge-2.ts';
export default stiffLegDeadlift({id:'smith-machine-stiff-leg-deadlift',name:'史密斯直腿硬拉',en:'Smith Machine Stiff-Leg Deadlift',equipment:['smith'],sources:['fe:Smith_Machine_Stiff-Legged_Deadlift'],muscles:[{m:'hamstrings',side:'both'},{m:'glutes',scale:0.8},{m:'lowerBack',scale:0.45}]},{implement:'barbell',smith:true}) satisfies SideExercise;
