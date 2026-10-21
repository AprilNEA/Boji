// Course registry. Course IDs, exercise IDs and their order mirror the app course definitions:
// ios/Boji/Models/BojiStore.swift and android/.../core/model/Workout.kt.
import type { Exercise } from './exercise.ts';
import bodyweightSquat from '@/exercises/course/bodyweight-squat.ts';
import wallPushUp from '@/exercises/course/wall-push-up.ts';
import gluteBridge from '@/exercises/course/glute-bridge.ts';
import birdDog from '@/exercises/course/bird-dog.ts';
import reverseLunge from '@/exercises/course/reverse-lunge.ts';
import kneePushUp from '@/exercises/course/knee-push-up.ts';
import deadBug from '@/exercises/course/dead-bug.ts';
import wallSit from '@/exercises/course/wall-sit.ts';
import plank from '@/exercises/course/plank.ts';
import chestPress from '@/exercises/course/chest-press.ts';
import seatedRow from '@/exercises/course/seated-row.ts';
import legPress from '@/exercises/course/leg-press.ts';
import latPulldown from '@/exercises/course/lat-pulldown.ts';
import catCow from '@/exercises/course/cat-cow.ts';
import hipFlexorStretch from '@/exercises/course/hip-flexor-stretch.ts';
import chestStretch from '@/exercises/course/chest-stretch.ts';
import { LIBRARY_FAMILIES } from '@/exercises/library/index.ts';

export type CourseId = 'home-beginner' | 'home-intermediate' | 'gym-beginner' | 'mobility';

export const COURSES: { id: CourseId; exercises: Exercise[] }[] = [
  { id: 'home-beginner', exercises: [bodyweightSquat, wallPushUp, gluteBridge, birdDog] },
  { id: 'home-intermediate', exercises: [reverseLunge, kneePushUp, deadBug, wallSit, plank] },
  { id: 'gym-beginner', exercises: [chestPress, seatedRow, legPress, latPulldown] },
  { id: 'mobility', exercises: [catCow, hipFlexorStretch, chestStretch] },
];

/**
 * Exercises with animations that no app course uses yet: every exercise of the families in src/exercises/library.
 * They go to lottie-library/, which no app bundles. A library exercise that a course imports leaves the library,
 * so its files move to lottie/.
 */
const courseIds = new Set(COURSES.flatMap((c) => c.exercises.map((ex) => ex.id)));
export const LIBRARY: Exercise[] = Object.values(LIBRARY_FAMILIES).flat().filter((ex) => !courseIds.has(ex.id));
export type CourseExercise = Exercise & {
  course: CourseId | null;
};

/** Flat list in course order, followed by the library. */
export const EXERCISES: CourseExercise[] = [
  ...COURSES.flatMap((c) => c.exercises.map((ex) => ({ ...ex, course: c.id }))),
  ...LIBRARY.map((ex) => ({ ...ex, course: null })),
];

const duplicates = EXERCISES.map((ex) => ex.id).filter((id, i, ids) => ids.indexOf(id) !== i);
if (duplicates.length) throw new Error(`Duplicate exercise IDs: ${[...new Set(duplicates)].join(', ')}`);
