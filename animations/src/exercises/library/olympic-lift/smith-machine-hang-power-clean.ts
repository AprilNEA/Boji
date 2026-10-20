// Start in the source-defined position with both feet planted and the load close to the body.
// Show the smith machine hang power clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'smith-machine-hang-power-clean', name: '史密斯悬垂高翻', en: 'Smith Machine Hang Power Clean', sources: ['fe:Smith_Machine_Hang_Power_Clean']}, 'smith', 'power') satisfies SideExercise;
