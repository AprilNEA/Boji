// Stand beside a low pulley with the working handle starting across the body.
// The free hand stays on the tower while the working arm raises laterally to shoulder height.
import type { FrontExercise } from '@/exercise.ts';
import { singleCableLateral } from './_lateral-raise.ts';
export default singleCableLateral({ id: 'cable-single-arm-lateral-raise', name: '绳索单臂侧平举', en: 'Cable Single-Arm Lateral Raise', sources: ['fe:Standing_Low-Pulley_Deltoid_Raise', 'hz:0192'] }) satisfies FrontExercise;
