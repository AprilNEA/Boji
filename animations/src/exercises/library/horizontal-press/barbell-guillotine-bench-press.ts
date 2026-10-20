// Lie on a flat bench with feet planted and hold the wide-grip bar above the neck.
// Lower the bar just above the neck with flared elbows, then press it back to lockout.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-guillotine-bench-press', name: '杠铃断头台卧推', en: 'Barbell Guillotine Bench Press', sources: ['fe:Barbell_Guillotine_Bench_Press', 'fe:Neck_Press', 'hz:0045'], support: 'flat', grip: 'wide', guillotine: true,
});
