// Start supine with one leg long and the working hip and knee bent at ninety degrees.
// The working knee extends toward vertical, then bends again while the hip angle and back stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, supineNinety } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: '90-90-hamstring-stretch', name: '九十度腘绳肌拉伸',
  meta: libraryMeta('90/90 Hamstring Stretch', ['bodyweight'], ['fe:90_90_Hamstring']),
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.35 }],
  pose: supineNinety,
}) satisfies SideExercise;
