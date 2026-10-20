// Start upright behind a stable step with a band above both knees.
// Place one whole foot on the step, drive through that heel, then lower and switch sides.
// The band stays around the thighs and both feet finish flat on the platform.
import { stepUp } from './_lunge-split-1.ts';

export default stepUp({
  id: 'band-alternating-step-up', name: '弹力带交替登阶', band: true, alternate: true, extendTrail: true,
  meta: { en: 'Band Alternating Step-Up', family: 'lunge-split', equipment: ['band', 'step'], sources: ['hz:1008'] },
});
