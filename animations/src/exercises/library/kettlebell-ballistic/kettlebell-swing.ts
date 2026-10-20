// Start in a hip hinge with the bell swinging between the legs.
// Snap the hips to swing the bell to chest height with straight arms. The feet remain flat.
import type { SideExercise } from '@/exercise.ts';
import { swing } from './_kettlebell-ballistic.ts';

export default swing({ id: 'kettlebell-swing', name: '壶铃摆荡', en: 'Kettlebell Swing', sources: ['hz:0549'] }, false) satisfies SideExercise;
