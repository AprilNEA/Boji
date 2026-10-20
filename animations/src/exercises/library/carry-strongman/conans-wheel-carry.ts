// Start upright with the padded beam cradled in both elbow crooks near the chest.
// Hold the wrists, brace the trunk and take short steps around the wheel pivot.
// The long loaded beam remains in the elbow cradle while the central wheel stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { conansWheel } from './_carry-strongman.ts';

export default conansWheel({
  id: 'conans-wheel-carry', name: '柯南转轮行走', en: "Conan's Wheel Carry",
  equipment: ['other'], sources: ['fe:Conans_Wheel'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'abs', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.4 }, { m: 'traps', scale: 0.35 }],
}) satisfies SideExercise;
