// Course registry. Course IDs, exercise IDs and their order mirror the app course definitions:
// ios/Boji/Models/BojiStore.swift and android/.../core/model/Workout.kt.
import type { Exercise } from './exercise.ts';
import bodyweightSquat from './exercises/bodyweight-squat.ts';
import wallPushUp from './exercises/wall-push-up.ts';
import gluteBridge from './exercises/glute-bridge.ts';
import birdDog from './exercises/bird-dog.ts';
import chestPress from './exercises/chest-press.ts';
import seatedRow from './exercises/seated-row.ts';
import legPress from './exercises/leg-press.ts';
import latPulldown from './exercises/lat-pulldown.ts';
import catCow from './exercises/cat-cow.ts';
import hipFlexorStretch from './exercises/hip-flexor-stretch.ts';
import chestStretch from './exercises/chest-stretch.ts';
import plank from './exercises/plank.ts';
import kneePushUp from './exercises/knee-push-up.ts';
import reverseLunge from './exercises/reverse-lunge.ts';
import wallSit from './exercises/wall-sit.ts';
import deadBug from './exercises/dead-bug.ts';

export type CourseId = 'home-beginner' | 'gym-beginner' | 'mobility';

export const COURSES: { id: CourseId; exercises: Exercise[] }[] = [
  { id: 'home-beginner', exercises: [bodyweightSquat, wallPushUp, gluteBridge, birdDog] },
  { id: 'gym-beginner', exercises: [chestPress, seatedRow, legPress, latPulldown] },
  { id: 'mobility', exercises: [catCow, hipFlexorStretch, chestStretch] },
];

/** Exercises with animations that no app course uses yet. index.json lists them with `course: null`. */
export const LIBRARY: Exercise[] = [plank, kneePushUp, reverseLunge, wallSit, deadBug];

export interface CourseExercise extends Exercise {
  course: CourseId | null;
}

/** Flat list in course order, followed by the library. */
export const EXERCISES: CourseExercise[] = [
  ...COURSES.flatMap((c) => c.exercises.map((ex) => ({ ...ex, course: c.id }))),
  ...LIBRARY.map((ex) => ({ ...ex, course: null })),
];
