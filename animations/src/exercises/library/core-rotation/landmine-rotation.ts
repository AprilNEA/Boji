// Begin in a wide stance with both hands on the free end of a floor-anchored bar.
// Keep the arms long while rotating the hips and trunk to arc the loaded end from side to side.
// The landmine pivot stays fixed at the floor and the hands remain connected to the bar.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { landmine } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, standing } from './_core-rotation-2.ts';

const PIVOT: [number, number] = [0, 444];
const sway = (t: number) => Math.sin(Math.PI * 2 * t);
const rig = landmine<FrontJoints>(PIVOT, (J) => meanGrip(J), 'front', 42, 'medium');
export default {
  id: 'landmine-rotation', name: '地雷杆转体', view: 'front', tl: { total: 3.1 },
  meta: { en: 'Landmine Rotation', family: 'core-rotation', equipment: ['landmine'], sources: ['fe:Landmine_180s', 'hz:0562'] },
  muscles: [{ m: 'abs', e: () => 0.85 }, { m: 'obliques', scale: 0.75, e: () => 0.8 }, { m: 'glutes', scale: 0.35, e: () => 0.35, region: { view: 'front', part: 'pelvis', c: [0, 6], s: [22, 13] } }, { m: 'delts', scale: 0.35, e: () => 0.5 }],
  props: (pal) => ({ back: rig.base(pal) }), propsBox: [-150, 150], dynamic: rig.parts,
  poster: 0.25,
  pose(t) {
    const u = sway(t);
    return { ...standing(58, 176, 42 * u), arms: pairedHands([55 * u, 220 - 10 * Math.abs(u), 65]) };
  },
} satisfies FrontExercise;
