// Hang from a pronated pull-up bar with straight arms and a long neutral body below the hands.
// Depress and retract the shoulder girdle to lift the torso a few centimetres without bending the elbows.
import type { FrontExercise } from '@/exercise.ts';
import { scapularPullUp } from './_rotator-cuff.ts';
export default scapularPullUp({ id: 'pull-up-bar-scapular-pull-up', name: '单杠肩胛引体向上', en: 'Pull-Up Bar Scapular Pull-Up', sources: ['fe:Scapular_Pull-Up', 'hz:0688'] }) satisfies FrontExercise;
