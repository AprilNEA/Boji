// Stand upright with one dumbbell in each hand and both feet planted at hip width.
// Raise one arm to shoulder height and lower it before the opposite arm completes the same motion.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-standing-alternating-lateral-raise', name: '哑铃站姿交替侧平举', en: 'Dumbbell Standing Alternating Lateral Raise', sources: ['hz:0415'] }, { alternating: true }) satisfies FrontExercise;
