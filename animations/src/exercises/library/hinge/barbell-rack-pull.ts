// Start in a deadlift position against a bar resting on pins just below the knees.
// Extend the knees and hips together, then pull the shoulders back at a tall lockout.
// The rack pins remain fixed and receive the bar again during the controlled descent.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift, rackProps } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-rack-pull', name: '杠铃架上硬拉', en: 'Barbell Rack Pull',
  sources: ['fe:Rack_Pulls', 'hz:0074'], start: 104, knee: 104, props: rackProps(348), propsBox: [110, 380],
}) satisfies SideExercise;
