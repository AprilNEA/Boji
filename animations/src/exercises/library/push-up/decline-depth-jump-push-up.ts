// Start with the feet on a low box and the hands between two raised aerobic steps.
// Bend the elbows, explode upward, and land with the hands on the steps before returning to the floor position.
import type { SideExercise } from '@/exercise.ts';
import { aerobicStep, plyoBox } from '@/exercises/equipment/index.ts';
import { elevatedFeetPush, PLYO_TL } from './_push-up-2.ts';

const box = plyoBox({ x: 145, h: 48, w: 90 });
const step = aerobicStep({ x: 400, h: 30, w: 86 });
export default elevatedFeetPush({
  id: 'decline-depth-jump-push-up', name: '下斜跳深俯卧撑', en: 'Decline Depth-Jump Push-Up', equipment: ['bodyweight', 'box', 'step'], tl: PLYO_TL, sources: ['fe:Incline_Push-Up_Depth_Jump'],
  props: (pal) => ({ back: [...box.draw(pal), ...step.draw(pal)] }), propsBox: [100, 443],
}, [145, 363]) satisfies SideExercise;
