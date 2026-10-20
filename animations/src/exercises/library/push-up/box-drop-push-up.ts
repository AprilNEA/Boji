// Start in a high plank with each hand on a separate low box and the feet on the mat.
// Press away from the boxes, drop the hands to the floor at shoulder width, and absorb the landing with bent elbows.
import type { SideExercise } from '@/exercise.ts';
import { plyoBox } from '@/exercises/equipment/index.ts';
import { plyoPush } from './_push-up-2.ts';

const rear = plyoBox({ x: 350, h: 40, w: 66 });
const front = plyoBox({ x: 440, h: 40, w: 66 });
export default plyoPush({
  id: 'box-drop-push-up', name: '跳箱落地俯卧撑', en: 'Box Drop Push-Up', equipment: ['bodyweight', 'box'], sources: ['fe:Drop_Push'],
  props: (pal) => ({ back: [...rear.draw(pal), ...front.draw(pal)] }), propsBox: [317, 473],
}) satisfies SideExercise;
