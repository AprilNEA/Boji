// Start in a rigid inclined plank with hands at shoulder width on a fixed elevated Smith bar.
// Bring the chest close to the bar through elbow flexion, then press back to straight arms without bending the hips.
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
  id: 'shoulder-width-incline-push-up', name: '肩宽上斜俯卧撑', en: 'Shoulder-Width Incline Push-Up',
  equipment: ['bodyweight', 'smith'], sources: ['fe:Incline_Push-Up_Medium'], props: smithProps, propsBox: [370, 447],
}, S) satisfies SideExercise;
