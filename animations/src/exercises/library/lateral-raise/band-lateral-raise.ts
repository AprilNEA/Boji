// Stand on the band with both feet planted and each handle beside its thigh.
// Raise both arms in the scapular plane to shoulder height, then lower without moving the torso.
import type { FrontExercise } from '@/exercise.ts';
import { bandLateral } from './_lateral-raise.ts';
export default bandLateral({ id: 'band-lateral-raise', name: '弹力带侧平举', en: 'Band Lateral Raise', sources: ['fe:Lateral_Raise_-_With_Bands'] }) satisfies FrontExercise;
