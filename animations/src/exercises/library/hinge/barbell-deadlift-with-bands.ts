// Start with the bar over mid-foot and short bands looped under the feet and over the sleeves.
// Keep straight arms and a braced back while the legs break the bar from the floor.
// The hips finish into the bar, and the descent returns the bar and bands to the floor setup.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift, footBands } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-deadlift-with-bands', name: '弹力带阻力杠铃硬拉', en: 'Barbell Deadlift with Bands',
  sources: ['fe:Deadlift_with_Bands'], equipment: ['barbell', 'band'], extra: footBands(),
}) satisfies SideExercise;
