// Stand sideways to a waist-high anchor with the feet planted and the torso square.
// The hands start at the chest, press forward, then return without rotating the trunk.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, bandLine, workTL } from '@/exercises/equipment/index.ts';
import { pallofPose } from './_core-stability-1.ts';

const tl = workTL(0.8);
const ANCHOR: [number, number] = [92, 166];

export default {
  id: 'band-standing-pallof-press',
  name: '弹力带站姿抗旋转推',
  tl,
  meta: {
    en: 'Band Standing Pallof Press', family: 'core-stability', equipment: ['band'],
    sources: ['hz:0979', 'hz:1015'],
  },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.65 }, { m: 'glutes', scale: 0.35 }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'band-anchor-post', color: pal.metalDark, c: [76, 309], s: [14, 278], r: 4 },
    { kind: 'box', nm: 'band-anchor-foot', color: pal.metalDark, c: [76, 448], s: [62, 8], r: 3 },
    { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: ANCHOR, s: [18, 18] },
  ] }),
  propsBox: [45, 402],
  dynamic: [bandLine((J) => [ANCHOR, gripAt(J, 'n')])],
  poster: 0.28,
  pose: (t) => pallofPose(tl.at(t).p),
} satisfies SideExercise;
