// Start tall with the working arm locked out above the shoulder.
// Walk forward with short alternating steps and a braced, vertical torso.
// The dumbbell stays stacked over the shoulder while the free arm hangs at the side.
import type { SideExercise } from '@/exercise.ts';
import { overheadCarry } from './_carry-strongman.ts';

export default overheadCarry({
  id: 'dumbbell-single-arm-overhead-carry', name: '哑铃单臂过顶行走', en: 'Dumbbell Single-Arm Overhead Carry',
  equipment: ['dumbbell'], sources: ['hz:3548'],
  muscles: [{ m: 'delts', side: 'near' }, { m: 'traps', scale: 0.55 }, { m: 'abs', scale: 0.55 }, { m: 'forearms', side: 'near', scale: 0.35 }],
}) satisfies SideExercise;
