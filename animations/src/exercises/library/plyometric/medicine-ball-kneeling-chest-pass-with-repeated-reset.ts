// From tall kneeling, drive forward and pass the ball from the chest. Catch the forward fall with both hands.
// Return upright before the next repetition. The reset distinguishes this cycle from the single-response drill.
import { ballExercise } from './_plyometric-2.ts';

export default ballExercise({
  id: 'medicine-ball-kneeling-chest-pass-with-repeated-reset', name: '药球跪姿连续胸前推掷', en: 'Medicine Ball Kneeling Chest Pass with Repeated Reset',
  sources: ['fe:Chest_Push_multiple_response'], kind: 'kneel-reset',
});
