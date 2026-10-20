// Start hinged with both bells swinging behind the legs.
// Drive through the hips and receive both bells overhead in one continuous locked-out motion.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_kettlebell-ballistic.ts';

export default snatch({ id: 'kettlebell-double-snatch', name: '双壶铃抓举', en: 'Kettlebell Double Snatch', sources: ['fe:Double_Kettlebell_Snatch', 'hz:0529'] }, true) satisfies SideExercise;
