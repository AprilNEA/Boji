// Stand tall with an EZ bar held at shoulder height in an overhand grip.
// Press the bar overhead to a soft lockout while the feet remain planted and the torso remains upright.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, ezBarPress } from './_vertical-press-2.ts';

const info = {
  id: 'ez-bar-anti-gravity-press', name: '曲杆站姿肩上推举', en: 'EZ-Bar Anti-Gravity Press',
  equipment: ["ez-bar"],
  sources: ["hz:0445"],
} satisfies PressInfo;

const exercise = ezBarPress(info);
export default exercise satisfies SideExercise;
