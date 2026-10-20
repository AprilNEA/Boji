// Stand tall with plates held by their rims at arm's length in a neutral grip and feet shoulder-width apart.
// Let the plates descend toward nearly extended fingers, then close the hands to lift them back to the start.
import type { SideExercise } from '@/exercise.ts';
import { plateFingerCurl } from './_forearm-grip-2.ts';

export default plateFingerCurl({
  id: 'weight-plate-finger-curl', name: '杠铃片手指弯举', en: 'Weight Plate Finger Curl',
  sources: ['fe:Standing_Olympic_Plate_Hand_Squeeze'],
}) satisfies SideExercise;
