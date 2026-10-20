// Lying on a flat bench, the straight upper arms remain vertical over the shoulders.
// A high-pulley straight bar travels from above the shoulders to the chin by elbow flexion.
// The bench, torso and upper-arm directions remain fixed through the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "cable-supine-close-grip-high-pulley-curl",
  "name": "绳索仰卧窄握高位弯举",
  "en": "Cable Supine Close-Grip High Pulley Curl",
  "sources": [
    "fe:Lying_Close-Grip_Bar_Curl_On_High_Pulley"
  ],
  "equipment": [
    "cable",
    "bench"
  ],
  "mode": "supine-cable"
}) satisfies import('@/exercise.ts').SideExercise;
