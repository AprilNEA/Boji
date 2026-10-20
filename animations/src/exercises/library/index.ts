// Library registry, discovered at load time with load.ts. No file lists the exercises, so parallel authors only
// add files and never edit a shared registry. Importing this module loads every family; scripts that need one
// family import load.ts instead.
import type { Exercise } from '@/exercise.ts';
import { familyNames, loadFamily } from './load.ts';

export { familyNames, loadFamily };

export const LIBRARY_FAMILIES: Record<string, Exercise[]> = {};
for (const family of familyNames()) LIBRARY_FAMILIES[family] = await loadFamily(family);
