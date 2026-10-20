// Supported bodyweight squat, side view. Both hands hold a fixed rail in front while the hips sit back to parallel.
// The rail stays still, the spine stays neutral, and the heels press into the floor for the return.
import type { SideExercise } from '@/exercise.ts';
import { squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.3);
const RAIL_X = 332, RAIL_Y = 260;
export default {
  id: 'supported-bodyweight-squat', name: '扶物徒手深蹲', tl,
  meta: { en: 'Supported Bodyweight Squat', family: 'squat', equipment: ['bodyweight', 'wall'], sources: ['hz:3132'] },
  muscles: [{ m: 'glutes' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'support-post', color: pal.prop, c: [RAIL_X + 12, 337], s: [18, 220], r: 4 },
    { kind: 'box', nm: 'support-rail', color: pal.metal, c: [RAIL_X, RAIL_Y], s: [48, 10], r: 5 },
  ] }),
  propsBox: [270, RAIL_X + 24],
  pose: (t) => squatPose(tl.at(t).p, {
    near: { target: [RAIL_X, RAIL_Y], side: [-1, 0], hand: 0 },
    far: { target: [RAIL_X - 7, RAIL_Y - 2], side: [-1, 0], hand: 0 },
  }, { farDx: -6, back: 76, bottom: 104, lean: 37 }),
} satisfies SideExercise;
