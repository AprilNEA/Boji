// Start flat on the stomach with long legs and the arms relaxed beside the body without a hand push.
// Extend the spine to lift the chest slightly, keep the neck aligned and return under control.
import type { SideExercise } from '@/exercise.ts';
import { proneBackExtension } from './_back-extension.ts';

export default proneBackExtension({
  id: 'prone-back-extension', name: '俯卧背伸展',
  meta: { en: 'Prone Back Extension', family: 'back-extension', equipment: ['bodyweight', 'mat'], sources: ['fe:Lower_Back_Curl', 'hz:1352'] },
}) satisfies SideExercise;
