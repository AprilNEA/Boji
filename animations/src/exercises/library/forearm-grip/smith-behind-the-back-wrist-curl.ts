// Stand upright with the Smith bar behind the hips and the elbows held just behind the torso.
// Flex the wrists to raise the overhand bar, then lower it without moving the elbows or trunk.
import type { SideExercise } from '@/exercise.ts';
import { smithBehindBackWristCurl } from './_forearm-grip-2.ts';

export default smithBehindBackWristCurl({
  id: 'smith-behind-the-back-wrist-curl', name: '史密斯背后腕弯举',
  en: 'Smith Behind-the-Back Wrist Curl', sources: ['hz:0771'],
}) satisfies SideExercise;
