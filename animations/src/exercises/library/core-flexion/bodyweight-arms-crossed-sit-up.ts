// Lie with bent knees and flat feet while both arms remain crossed over the chest.
// Curl the torso toward the knees without swinging the arms, then descend under control.
import type { SideExercise } from '@/exercise.ts';
import { floorSitUp } from './_core-flexion-1.ts';
export default floorSitUp({ id: 'bodyweight-arms-crossed-sit-up', name: '自重交叉抱胸仰卧起坐', meta: { en: 'Bodyweight Arms-Crossed Sit-Up', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['hz:3679'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }] }, { arms: 'cross' }) satisfies SideExercise;
