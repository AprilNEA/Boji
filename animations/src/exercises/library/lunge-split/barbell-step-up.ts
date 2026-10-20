// Start upright behind a stable step with a barbell across the upper back.
// Place one whole foot on the step, drive through the heel and bring the other foot onto the platform.
// The bar stays over the upper back and both feet finish flat on the platform.
import { stepUp } from './_lunge-split-1.ts';

export default stepUp({
  id: 'barbell-step-up', name: '杠铃登阶', bar: true,
  meta: { en: 'Barbell Step-Up', family: 'lunge-split', equipment: ['barbell', 'step'], sources: ['fe:Barbell_Step_Ups'] },
});
