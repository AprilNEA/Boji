// Stand upright holding a plate at shoulder height with both arms long and the hands at three and nine o’clock.
// Turn the plate like a steering wheel from one lock to the other without bending the elbows.
import type { FrontExercise } from '@/exercise.ts';
import { steeringWheel } from './_rotator-cuff.ts';
export default steeringWheel({ id: 'weight-plate-steering-wheel-rotation', name: '杠铃片方向盘转动', en: 'Weight Plate Steering Wheel Rotation', sources: ['fe:Car_Drivers'] }) satisfies FrontExercise;
