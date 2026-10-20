// Start tall on a low platform with the bar at arm's length against the thighs.
// Keep a soft knee bend as the hips travel back for more range below the knees.
// The spine stays extended and the platform remains fixed beneath both feet.
import type { SideExercise } from '@/exercise.ts';
import { barRdl, deficitPlatform } from './_hinge-1.ts';

const platform = deficitPlatform(12);

export default barRdl({
  id: 'barbell-deficit-romanian-deadlift', name: '杠铃垫高罗马尼亚硬拉', en: 'Barbell Deficit Romanian Deadlift',
  sources: ['fe:Romanian_Deadlift_from_Deficit'], floor: platform.floor,
  equipment: ['barbell', 'box'], props: platform.props, propsBox: platform.box,
}) satisfies SideExercise;
