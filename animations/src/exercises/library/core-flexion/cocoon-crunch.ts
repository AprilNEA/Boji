// Start fully extended on the back with the arms behind the head and legs long.
// Tuck the knees and curl the torso at the same time into a compact cocoon, then extend smoothly.
import type { SideExercise } from '@/exercise.ts';
import { cocoon } from './_core-flexion-1.ts';
export default cocoon({ id: 'cocoon-crunch', name: '抱膝卷腹', meta: { en: 'Cocoon Crunch', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['fe:Cocoons', 'hz:0260'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }] }) satisfies SideExercise;
