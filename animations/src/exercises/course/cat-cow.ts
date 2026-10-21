// 猫牛式 (cat-cow). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { IK_WARNINGS } from '@/rig/ik.ts';
import { add, dir, len, lerp, mul, sub } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, solve, type Joints, type Pose } from '@/rig/side.ts';
import { QUAD, kneelLeg, plantedArm } from '@/exercises/common.ts';

const catCowTL = timeline([
  { d: 1.9, from: -1, to: 1, ease: 'sine' },
  { d: 0.6, from: 1, to: 1 },
  { d: 1.9, from: 1, to: -1, ease: 'sine' },
  { d: 0.6, from: -1, to: -1 },
]);
const catCowC = (t: number) => catCowTL.at((t + 0.95 / 5.0) % 1).p; // start near neutral
const catCow = {
  id: 'cat-cow', name: '猫牛式', tl: catCowTL, mat: true,
  muscles: [
    { m: 'abs', e: (t: number) => Math.max(0, -catCowC(t)) },
    { m: 'lowerBack', e: (t: number) => Math.max(0, catCowC(t)) },
  ],
  pose(t) {
    const c = catCowC(t);
    const hip = add(QUAD.K, mul(dir(-90 + 4 * c), BODY.thigh));
    const chord = 124 - 10 * Math.pow(Math.abs(c), 1.2);
    const neck = c < 0 ? lerp(-12, 22, -c) : lerp(-12, -34, c);
    const head = c < 0 ? lerp(-10, 36, -c) : lerp(-10, -46, c);
    const make = (beta: number): Pose => ({
      hip,
      spine: { target: add(hip, mul(dir(beta), chord)), side: c < 0 ? [0, -1] : [0, 1] },
      neck, head, farHip: 0, farShoulder: 0,
      legs: { near: kneelLeg(hip), far: kneelLeg(hip) },
      arms: { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) },
    });
    // Bisect the chord angle so both shoulders stay one soft arm length from the wrists.
    const reach = (J: Joints) => Math.max(len(sub(J.S, QUAD.wrist)), len(sub(J.Sf, QUAD.wristFar)));
    const warned = IK_WARNINGS.length;
    let lo = -40, hi = 5;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (reach(solve(make(mid))) < 123.5) hi = mid; else lo = mid;
    }
    IK_WARNINGS.length = warned; // search probes may overshoot; only the final solve counts
    return make((lo + hi) / 2);
  },
} satisfies Exercise;

export default catCow;
