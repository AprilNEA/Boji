// Stand tall with dumbbells by the sides, soft elbows, and a stationary trunk.
// Raise both arms laterally to shoulder height and lower them under controlled tension.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-standing-lateral-raise', name: '哑铃站姿侧平举', en: 'Dumbbell Standing Lateral Raise', sources: ['fe:Side_Lateral_Raise'] }) satisfies FrontExercise;
