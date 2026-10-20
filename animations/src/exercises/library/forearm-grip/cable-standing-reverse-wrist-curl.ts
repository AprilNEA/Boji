// Stand facing a low cable with the elbows close to the ribs and the forearms held still.
// The overhand grip extends upward at the wrists, then returns under control without moving the trunk.
import type { SideExercise } from '@/exercise.ts';
import { cableStandingReverseWristCurl } from './_forearm-grip-2.ts';

export default cableStandingReverseWristCurl({
  id: 'cable-standing-reverse-wrist-curl', name: '绳索站姿反握腕弯举', en: 'Cable Standing Reverse Wrist Curl',
  sources: ['hz:0224'],
}) satisfies SideExercise;
