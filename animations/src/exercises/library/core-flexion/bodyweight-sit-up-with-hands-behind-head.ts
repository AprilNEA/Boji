// Lie with knees bent and feet flat while the hands rest lightly behind the head and elbows stay open.
// Curl the torso to about 45 degrees without pulling the neck, then lower slowly to the mat.
import type { SideExercise } from '@/exercise.ts';
import { floorSitUp } from './_core-flexion-1.ts';
export default floorSitUp({ id: 'bodyweight-sit-up-with-hands-behind-head', name: '自重抱头仰卧起坐', meta: { en: 'Bodyweight Sit-Up with Hands Behind Head', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['hz:0735'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }] }) satisfies SideExercise;
