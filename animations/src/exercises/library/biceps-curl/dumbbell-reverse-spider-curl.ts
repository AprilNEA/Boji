// The chest stays against a 45-degree incline pad while the upper arms hang down.
// Both overhand dumbbells curl to the shoulders without upper-arm travel.
// The chest support and wide foot placement remain fixed through the curl.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-reverse-spider-curl",
  "name": "哑铃反握蜘蛛弯举",
  "en": "Dumbbell Reverse Spider Curl",
  "sources": [
    "hz:1675"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "prone",
  "grip": "pronated"
}) satisfies import('@/exercise.ts').SideExercise;
