// Joint direction checks for the side rig.
// The side figure faces screen right, so each joint bends one way. A signed angle between two bones tells a real
// pose from a folded one, which the unsigned angles in scripts/inspect.ts cannot: a knee bent 90 degrees forward
// and one bent 90 degrees backward have the same unsigned angle.
// Bone directions are in degrees: 0 = screen right, 90 = down, -90 = up, 180 = screen left.
import { ang } from '@/math/vec2.ts';
import type { Joints, Side } from '@/rig/side.ts';

/** Limits for anatomyIssues(). Values are degrees past the anatomical stop. */
export const ANATOMY_LIMITS = {
  /** The thigh may swing behind the torso line by this much. */
  hipExtension: 70,
  /** The knee may bend backward by this much. */
  kneeReverse: 10,
  /** The neck may bend this far from the top of the thoracic spine, either way. */
  neck: 80,
  /** The thoracic spine may bend this far from the lumbar spine, either way. */
  spine: 80,
} as const;

/** Wrap an angle in degrees to (-180, 180]. */
export const wrapDeg = (d: number): number => {
  const x = ((((d + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
};

export interface Anatomy {
  /** Degrees the thigh is behind the torso line. 0 for any flexed hip. */
  hipExtension: Record<Side, number>;
  /** Degrees the knee bends backward. 0 for a straight or normally bent knee. */
  kneeReverse: Record<Side, number>;
  /**
   * Degrees the elbow bends backward. Report only: in side view, a rotated upper arm (rear-rack grip, upright row)
   * can make a correct elbow look reversed.
   */
  elbowReverse: Record<Side, number>;
  /** Absolute bend of the neck against the top of the thoracic spine. */
  neck: number;
  /** Absolute bend of the thoracic spine against the lumbar spine. */
  spine: number;
}

/** Measure the signed joint directions of one solved side-view frame. */
export function measureAnatomy(J: Joints): Anatomy {
  // The spine tangent points from the hip toward the neck base.
  const lumbar = ang(J.T(0.08));
  const thoracic = ang(J.T(0.95));
  const hipExtension = { n: 0, f: 0 }, kneeReverse = { n: 0, f: 0 }, elbowReverse = { n: 0, f: 0 };
  for (const s of ['n', 'f'] as const) {
    const thigh = J[`thigh_${s}`].a, shin = J[`shin_${s}`].a;
    // Standing: thigh 90, lumbar -90, hip = 180. Flexion lowers it toward 0. A negative value means the thigh is
    // behind the torso line. Between -30 and 0 the thigh lies along the torso (a pike or a tuck) and only the sign
    // has flipped, so it counts as flexion.
    const hip = wrapDeg(thigh - lumbar);
    hipExtension[s] = hip < -30 ? 180 + hip : 0;
    // Flexion turns the shin clockwise from the thigh (positive). Below -150 the knee is fully bent and only the
    // sign has flipped.
    const knee = wrapDeg(shin - thigh);
    kneeReverse[s] = knee < -150 ? 0 : Math.max(0, -knee);
    // Elbow flexion turns the forearm counterclockwise from the upper arm (negative).
    const elbow = wrapDeg(J[`fore_${s}`].a - J[`upper_${s}`].a);
    elbowReverse[s] = elbow > 150 ? 0 : Math.max(0, elbow);
  }
  return {
    hipExtension, kneeReverse, elbowReverse,
    neck: Math.abs(wrapDeg(J.neck.a - thoracic)),
    spine: Math.abs(wrapDeg(thoracic - lumbar)),
  };
}

/** Short labels for every limit that the frame exceeds, for example `knee_f reversed 85`. Elbows are not included. */
export function anatomyIssues(J: Joints): string[] {
  const a = measureAnatomy(J);
  const out: string[] = [];
  const L = ANATOMY_LIMITS;
  for (const s of ['n', 'f'] as const) {
    if (a.hipExtension[s] > L.hipExtension) out.push(`hip_${s} behind torso ${a.hipExtension[s].toFixed(0)}`);
    if (a.kneeReverse[s] > L.kneeReverse) out.push(`knee_${s} reversed ${a.kneeReverse[s].toFixed(0)}`);
  }
  if (a.neck > L.neck) out.push(`neck bent ${a.neck.toFixed(0)}`);
  if (a.spine > L.spine) out.push(`spine kinked ${a.spine.toFixed(0)}`);
  return out;
}
