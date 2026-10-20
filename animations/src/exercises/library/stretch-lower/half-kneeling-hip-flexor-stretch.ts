// Start half-kneeling with the rear knee and front foot fixed on the mat.
// The pelvis glides forward without arching the lower back, lengthening the rear hip.
import type { SideExercise } from '@/exercise.ts';
import { halfKneel, libraryMeta, lowerStretch } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'half-kneeling-hip-flexor-stretch', name: '半跪姿髋屈肌拉伸',
  meta: libraryMeta('Half-Kneeling Hip Flexor Stretch', ['bodyweight'], ['fe:Kneeling_Hip_Flexor']),
  muscles: [{ m: 'hipFlexor', side: 'far' }, { m: 'quads', side: 'far', scale: 0.6 }], pose: halfKneel,
}) satisfies SideExercise;
