// Start in a straight inclined plank with a visibly broad hand position on the fixed elevated bar.
// Lower the chest toward the bar with the torso rigid, then press through the palms to straight arms.
import type { Props, SideExercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { raisedSupport, supportPush } from './_push-up-2.ts';

const S = raisedSupport([402, 360]);
const smithProps = (pal: Palette): Props => ({ back: [
  { kind: 'box' as const, nm: 'smith-upright', color: pal.prop, c: [438, 250], s: [18, 390], r: 4 },
  { kind: 'box' as const, nm: 'smith-rail', color: pal.metal, c: [414, 250], s: [5, 380], r: 2.5 },
  { kind: 'box' as const, nm: 'smith-base', color: pal.metalDark, c: [420, 448], s: [85, 8], r: 3 },
  { kind: 'oval' as const, nm: 'smith-bar', color: pal.metal, c: S.wrist, s: [13, 13] },
] });

export default supportPush({
  id: 'wide-grip-incline-push-up', name: '宽距上斜俯卧撑', en: 'Wide-Grip Incline Push-Up',
  equipment: ['bodyweight', 'smith'], sources: ['fe:Incline_Push-Up_Wide'], props: smithProps, propsBox: [370, 447],
}, S) satisfies SideExercise;
