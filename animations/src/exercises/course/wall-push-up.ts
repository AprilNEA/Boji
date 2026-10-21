// 墙壁俯卧撑 (wall-push-up). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, dir, lerp, mul } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { solve } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';

const wallTL = timeline([
  { d: 1.4, from: 0, to: 1, e: [0.25, 0.5] },
  { d: 0.2, from: 1, to: 1, e: [0.5, 0.7] },
  { d: 1.0, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.7, from: 0, to: 0, e: [0.85, 0.25] },
]);
const WALL = (() => {
  const xa = 150;
  const body = (th: number) => {
    const up = -90 + th;
    return {
      hip: add([xa, G - A], mul(dir(up), 181)),
      spine: { lumbar: up, thoracic: up - 1 },
      neck: up + 4, head: up + 2,
      legs: standLegs(xa, -6),
    };
  };
  const probe = solve({ ...body(22), arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } });
  const wrist = add(probe.S, mul(dir(9), 121));
  return { xa, body, wrist, wallX: wrist[0] + 7 };
})();
const wallPushUp = {
  id: 'wall-push-up', name: '墙壁俯卧撑', tl: wallTL,
  muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both' }],
  props: (pal: Palette) => ({
    back: [
      { kind: 'box', nm: 'wall', color: pal.prop, c: [WALL.wallX + 30, (G + 30) / 2], s: [60, G - 30], r: 6 },
      { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [WALL.wallX + 30, G - 8], s: [60, 16], r: 2 },
    ],
  }),
  propsBox: [WALL.wallX, WALL.wallX + 60],
  pose(t) {
    const { p } = wallTL.at(t);
    const b = WALL.body(lerp(22, 33, p));
    return {
      ...b,
      arms: {
        near: { target: WALL.wrist, side: [0, 1], hand: -88 },
        far: { target: add(WALL.wrist, [0, -5]), side: [0, 1], hand: -88 },
      },
    };
  },
} satisfies Exercise;

export default wallPushUp;
