// Start upright facing away from a low cable column, with the cable cuff around one ankle and the core braced.
// Alternate sides: the straight cuffed leg reaches 35 degrees behind vertical, then returns under cable control.
// The spine and support foot stay neutral and fixed, and no hand support is shown because the source does not specify it.
import type { SideExercise } from '@/exercise.ts';
import { cableColumn, cableLine } from '@/exercises/equipment/index.ts';
import { handOnHip } from '@/exercises/common.ts';
import { alternate, alternateTL, activeValue, alternatingAnkle, cableCuff, hipExtensionLegs, STAND_HIP, STAND_ANKLE_Y } from './_glute-kickback.ts';

const COLUMN = cableColumn({ x: 150, pulleyY: STAND_ANKLE_Y - 27, toward: 1 });

export default {
  id: 'cable-standing-hip-extension',
  name: '绳索站姿髋后伸',
  tl: alternateTL,
  props: (pal) => ({ back: COLUMN.draw(pal) }),
  propsBox: COLUMN.box,
  meta: {
    en: 'Cable Standing Hip Extension',
    family: 'glute-kickback',
    equipment: ['cable'],
    sources: ['hz:0228'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.4, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.4, e: (t) => activeValue(t, 'far') },
    { m: 'quads', side: 'both', scale: 0.3 },
  ],
  dynamic: [
    cableLine(COLUMN.pulley, alternatingAnkle, 'Low Cable'),
    cableCuff(alternatingAnkle),
  ],
  pose(t) {
    const { side, p } = alternate(t);
    return {
      hip: STAND_HIP,
      spine: { lumbar: -90, thoracic: -90 },
      neck: -90,
      head: -90,
      farHip: 0,
      farShoulder: 0,
      legs: hipExtensionLegs(side, p, STAND_HIP),
      arms: { near: handOnHip(0), far: handOnHip(-3) },
    };
  },
} satisfies SideExercise;
