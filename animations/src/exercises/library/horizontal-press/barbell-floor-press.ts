// Lie inside a rack with feet planted and upper arms reaching the floor at the paused bottom.
// Press the racked bar from a locked-out start while keeping the elbows tucked.
import { barbellPress } from './_horizontal-press-1.ts';

export default barbellPress({
  id: 'barbell-floor-press', name: '杠铃地板卧推', en: 'Barbell Floor Press', sources: ['fe:Floor_Press'], support: 'floor', grip: 'close', floorRack: true,
});
