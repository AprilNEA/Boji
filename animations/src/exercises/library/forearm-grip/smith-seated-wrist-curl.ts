// Sit at a Smith machine with an underhand bar and both forearms supported across the thighs.
// The wrists hang past the knees, flex the bar toward the forearms, pause, and lower under control.
import type { SideExercise } from '@/exercise.ts';
import { smithSeatedWristCurl } from './_forearm-grip-2.ts';

export default smithSeatedWristCurl({
  id: 'smith-seated-wrist-curl', name: '史密斯坐姿腕弯举', en: 'Smith Seated Wrist Curl', sources: ['hz:1426'],
}) satisfies SideExercise;
