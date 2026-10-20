// Course registry. Course IDs, exercise IDs and their order mirror the app course definitions:
// ios/Boji/Models/BojiStore.swift and android/.../core/model/Workout.kt.
import type { Exercise } from './exercise.ts';
import bodyweightSquat from './exercises/bodyweight-squat.ts';
import wallPushUp from './exercises/wall-push-up.ts';
import gluteBridge from './exercises/glute-bridge.ts';
import birdDog from './exercises/bird-dog.ts';
import reverseLunge from './exercises/reverse-lunge.ts';
import kneePushUp from './exercises/knee-push-up.ts';
import deadBug from './exercises/dead-bug.ts';
import wallSit from './exercises/wall-sit.ts';
import plank from './exercises/plank.ts';
import chestPress from './exercises/chest-press.ts';
import seatedRow from './exercises/seated-row.ts';
import legPress from './exercises/leg-press.ts';
import latPulldown from './exercises/lat-pulldown.ts';
import catCow from './exercises/cat-cow.ts';
import hipFlexorStretch from './exercises/hip-flexor-stretch.ts';
import chestStretch from './exercises/chest-stretch.ts';
import pushUp from './exercises/push-up.ts';
import mountainClimber from './exercises/mountain-climber.ts';
import crunch from './exercises/crunch.ts';
import calfRaise from './exercises/calf-raise.ts';
import romanianDeadlift from './exercises/romanian-deadlift.ts';
import dumbbellShoulderPress from './exercises/dumbbell-shoulder-press.ts';
import bicepsCurl from './exercises/biceps-curl.ts';
import gobletSquat from './exercises/goblet-squat.ts';
import childsPose from './exercises/childs-pose.ts';

export type CourseId = 'home-beginner' | 'home-intermediate' | 'gym-beginner' | 'mobility';

export const COURSES: { id: CourseId; exercises: Exercise[] }[] = [
  { id: 'home-beginner', exercises: [bodyweightSquat, wallPushUp, gluteBridge, birdDog] },
  { id: 'home-intermediate', exercises: [reverseLunge, kneePushUp, deadBug, wallSit, plank] },
  { id: 'gym-beginner', exercises: [chestPress, seatedRow, legPress, latPulldown] },
  { id: 'mobility', exercises: [catCow, hipFlexorStretch, chestStretch] },
];

/** Exercises with animations that no app course uses yet. They go to lottie-library/, which no app bundles. */
export const LIBRARY: Exercise[] = [
  pushUp, mountainClimber, crunch, calfRaise, romanianDeadlift,
  dumbbellShoulderPress, bicepsCurl, gobletSquat, childsPose,
];

export interface CourseExercise extends Exercise {
  course: CourseId | null;
}

/** Flat list in course order, followed by the library. */
export const EXERCISES: CourseExercise[] = [
  ...COURSES.flatMap((c) => c.exercises.map((ex) => ({ ...ex, course: c.id }))),
  ...LIBRARY.map((ex) => ({ ...ex, course: null })),
];
