// Shared equipment for exercise scripts, for side and front views. Static props return PropShape lists in
// screen coordinates for Props.back or Props.front; held or moving equipment returns MovingPart objects for
// Exercise.dynamic. Scale: 2.09 px per cm (thigh 94 px = 45 cm). `pnpm gallery` renders every item.
export * from './core.ts';
export * from './place.ts';
export * from './free-weights.ts';
export * from './benches.ts';
export * from './stations.ts';
export * from './small.ts';
export * from './machines.ts';
