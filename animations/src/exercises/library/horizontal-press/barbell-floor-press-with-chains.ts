// Lie inside a rack with feet planted and upper arms reaching the floor at the paused bottom.
// The chains hang from the bar and lift progressively as the tucked elbows extend.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-floor-press-with-chains', name: '杠铃铁链地板卧推', en: 'Barbell Floor Press with Chains', sources: ['fe:Floor_Press_with_Chains'], support: 'floor', grip: 'close', chains: true, floorRack: true,
});
