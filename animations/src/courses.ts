// Course registry. Course IDs, exercise IDs and their order mirror the app course definitions:
// ios/Boji/Models/BojiStore.swift and android/.../core/model/Workout.kt.
// A bundled course ships its animations in the apps (lottie/). The apps download the animations of the other
// courses from the asset host. Every course exercise is in the asset catalog. See docs/integration.md.
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

export type CourseId =
  | 'home-beginner' | 'home-intermediate' | 'gym-beginner' | 'mobility'
  | 'home-strength' | 'home-core' | 'home-cardio' | 'home-dumbbell'
  | 'gym-free-weights' | 'gym-upper' | 'gym-lower'
  | 'stretch-lower' | 'stretch-desk' | 'morning-wake-up';

export interface Course {
  id: CourseId;
  /** true: the apps bundle the animations of this course. false: the apps download them from the asset host. */
  bundled: boolean;
  exercises: Exercise[];
}

const libraryExercises = Object.values(LIBRARY_FAMILIES).flat();
const libraryById = new Map(libraryExercises.map((ex) => [ex.id, ex]));

/** A library exercise by ID. A course that uses it takes it out of the library. */
function lib(...ids: string[]): Exercise[] {
  return ids.map((id) => {
    const ex = libraryById.get(id);
    if (!ex) throw new Error(`Unknown library exercise: ${id}`);
    return ex;
  });
}

export const COURSES: Course[] = [
  { id: 'home-beginner', bundled: true, exercises: [bodyweightSquat, wallPushUp, gluteBridge, birdDog] },
  { id: 'home-intermediate', bundled: true, exercises: [reverseLunge, kneePushUp, deadBug, wallSit, plank] },
  { id: 'gym-beginner', bundled: true, exercises: [chestPress, seatedRow, legPress, latPulldown] },
  { id: 'mobility', bundled: true, exercises: [catCow, hipFlexorStretch, chestStretch] },
  {
    id: 'home-strength', bundled: false,
    exercises: lib('push-up', 'bodyweight-split-squat', 'single-leg-glute-bridge', 'bench-dip', 'superman',
      'bodyweight-forearm-side-plank'),
  },
  {
    id: 'home-core', bundled: false,
    exercises: [...lib('crunch', 'reverse-crunch', 'bicycle-crunch', 'russian-twist', 'flutter-kick'), plank],
  },
  {
    id: 'home-cardio', bundled: false,
    exercises: lib('jumping-jack', 'wall-high-knees', 'mountain-climber', 'jump-squat', 'bear-crawl', 'bodyweight-burpee'),
  },
  {
    id: 'home-dumbbell', bundled: false,
    exercises: lib('dumbbell-goblet-squat', 'dumbbell-floor-press', 'dumbbell-bent-over-row',
      'dumbbell-romanian-deadlift', 'dumbbell-reverse-lunge', 'dumbbell-lateral-raise'),
  },
  {
    id: 'gym-free-weights', bundled: false,
    exercises: lib('dumbbell-goblet-squat', 'dumbbell-bench-press', 'dumbbell-bent-over-row',
      'dumbbell-romanian-deadlift', 'dumbbell-seated-shoulder-press', 'dumbbell-biceps-curl'),
  },
  {
    id: 'gym-upper', bundled: false,
    exercises: lib('machine-chest-press', 'machine-shoulder-press', 'machine-assisted-pull-up', 'machine-pec-deck-fly',
      'cable-face-pull', 'cable-rope-triceps-pushdown'),
  },
  {
    id: 'gym-lower', bundled: false,
    exercises: [legPress, ...lib('machine-leg-extension', 'machine-seated-leg-curl', 'machine-seated-hip-abduction',
      'machine-seated-hip-adduction', 'back-extension')],
  },
  {
    id: 'stretch-lower', bundled: false,
    exercises: lib('standing-hamstring-stretch', 'prone-quadriceps-stretch', 'supine-figure-four-glute-stretch',
      'runners-lunge-stretch', 'wall-standing-calf-stretch'),
  },
  {
    id: 'stretch-desk', bundled: false,
    exercises: lib('neck-side-stretch', 'cross-body-shoulder-stretch', 'overhead-triceps-stretch',
      'chair-seated-chest-and-shoulder-stretch', 'seated-chair-hamstring-stretch'),
  },
  {
    id: 'morning-wake-up', bundled: false,
    exercises: lib('worlds-greatest-stretch', 'inchworm', 'bodyweight-good-morning', 'knees-to-chest-stretch',
      'childs-pose'),
  },
];

export type CourseExercise = Exercise & {
  /** The first course that uses the exercise. null: no course uses it, so it is a library exercise. */
  course: CourseId | null;
  /** Every course that uses the exercise, in course order. Empty for a library exercise. */
  courses: CourseId[];
  /** true: a bundled course uses the exercise, so its files go to lottie/. */
  bundled: boolean;
};

// One entry per exercise ID, in order of first use. An exercise may belong to several courses,
// but two different exercise objects must not share an ID.
const origin = new Map<string, Exercise>();
const courseExercises: CourseExercise[] = [];
for (const course of COURSES) {
  const ids = course.exercises.map((ex) => ex.id);
  const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (repeated.length) throw new Error(`Course ${course.id} lists an exercise twice: ${repeated.join(', ')}`);
  for (const ex of course.exercises) {
    const seen = origin.get(ex.id);
    if (seen && seen !== ex) throw new Error(`Duplicate exercise IDs: ${ex.id}`);
    if (!seen) {
      origin.set(ex.id, ex);
      courseExercises.push({ ...ex, course: course.id, courses: [course.id], bundled: course.bundled });
      continue;
    }
    const entry = courseExercises.find((e) => e.id === ex.id)!;
    entry.courses.push(course.id);
    entry.bundled ||= course.bundled;
  }
}

/**
 * Exercises with animations that no app course uses yet: every exercise of the families in src/exercises/library
 * that no course uses. They go to lottie-library/, which no app bundles and Git ignores.
 */
export const LIBRARY: Exercise[] = libraryExercises.filter((ex) => {
  const seen = origin.get(ex.id);
  if (seen && seen !== ex) throw new Error(`Duplicate exercise IDs: ${ex.id}`);
  return !seen;
});

/** Flat list: course exercises in order of first use, followed by the library. */
export const EXERCISES: CourseExercise[] = [
  ...courseExercises,
  ...LIBRARY.map((ex) => ({ ...ex, course: null, courses: [], bundled: false })),
];

const duplicates = EXERCISES.map((ex) => ex.id).filter((id, i, ids) => ids.indexOf(id) !== i);
if (duplicates.length) throw new Error(`Duplicate exercise IDs: ${[...new Set(duplicates)].join(', ')}`);
