// Stand at a low cable with the underhand forearms supported by a raised flat bench.
// The wrists hang beyond the pad edge, curl upward, and lower while the elbows stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { cableBenchWristCurl } from './_forearm-grip-2.ts';

export default cableBenchWristCurl({
  id: 'cable-wrist-curl', name: '绳索腕弯举', en: 'Cable Wrist Curl', sources: ['hz:0247'],
}) satisfies SideExercise;
