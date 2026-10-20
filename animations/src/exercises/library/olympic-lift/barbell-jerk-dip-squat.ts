// Start in the source-defined position with both feet planted and the load close to the body.
// Keep the bar in the front rack while the knees dip forward under a vertical torso.
import type { SideExercise } from '@/exercise.ts';
import { jerkDip } from './_olympic-lift.ts';

export default jerkDip({id: 'barbell-jerk-dip-squat', name: '杠铃挺举预蹲', en: 'Barbell Jerk Dip Squat', sources: ['fe:Jerk_Dip_Squat']}) satisfies SideExercise;
