// Genera src/lib/thirdPlaceTable.ts con las 495 combinaciones C(12,8)
// Ejecutar: node scripts/generateTable.mjs

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Definición de slots (corregida: vs1I y vs1B ya con sus possibleGroups correctos)
const THIRD_PLACE_SLOTS = [
  { slot: 'vs1E', possibleGroups: ['A', 'B', 'C', 'D', 'F'] },
  { slot: 'vs1I', possibleGroups: ['E', 'F', 'G', 'I', 'J'] },
  { slot: 'vs1D', possibleGroups: ['B', 'E', 'F', 'I', 'J'] },
  { slot: 'vs1G', possibleGroups: ['A', 'E', 'H', 'I', 'J'] },
  { slot: 'vs1A', possibleGroups: ['C', 'E', 'F', 'H', 'I'] },
  { slot: 'vs1L', possibleGroups: ['E', 'H', 'I', 'J', 'K'] },
  { slot: 'vs1B', possibleGroups: ['C', 'D', 'F', 'G', 'H'] },
  { slot: 'vs1K', possibleGroups: ['D', 'E', 'I', 'J', 'L'] },
];

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

/** Genera todas las combinaciones de r elementos de arr */
function combinations(arr, r) {
  if (r === 0) return [[]];
  if (arr.length < r) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, r - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, r);
  return [...withFirst, ...withoutFirst];
}

/** Backtracking: asigna grupos a slots */
function assign(slots, selected, assignment, usedGroups) {
  if (slots.length === 0) return true;

  // Fail-first: ordenar por menor número de opciones disponibles
  const sorted = [...slots].sort((a, b) => {
    const aOpts = a.possibleGroups.filter(g => selected.includes(g) && !usedGroups.has(g)).length;
    const bOpts = b.possibleGroups.filter(g => selected.includes(g) && !usedGroups.has(g)).length;
    return aOpts - bOpts;
  });

  const [current, ...remaining] = sorted;
  const options = current.possibleGroups.filter(g => selected.includes(g) && !usedGroups.has(g));

  for (const group of options) {
    assignment[current.slot] = group;
    usedGroups.add(group);
    if (assign(remaining, selected, assignment, usedGroups)) return true;
    delete assignment[current.slot];
    usedGroups.delete(group);
  }

  return false;
}

const allCombos = combinations(ALL_GROUPS, 8);
let lines = [];
let nullCount = 0;

for (const combo of allCombos) {
  const key = combo.sort().join('');
  const assignment = {};
  const usedGroups = new Set();
  const ok = assign(THIRD_PLACE_SLOTS, combo, assignment, usedGroups);

  if (!ok) {
    console.warn(`No assignment for ${key}`);
    nullCount++;
    continue;
  }

  const slots = THIRD_PLACE_SLOTS.map(({ slot }) => `${slot}:'${assignment[slot]}'`).join(',');
  lines.push(`  ${key}:{${slots}},`);
}

console.log(`Generated ${lines.length} entries, ${nullCount} null`);

const output = `// AUTO-GENERATED — do not edit manually
// Run: node scripts/generateTable.mjs
import type { ThirdPlaceAssignment } from '@/types';

export const THIRD_PLACE_TABLE: Record<string, ThirdPlaceAssignment> = {
${lines.join('\n')}
};
`;

const outPath = join(__dirname, '../src/lib/thirdPlaceTable.ts');
writeFileSync(outPath, output, 'utf8');
console.log(`Written to ${outPath}`);
