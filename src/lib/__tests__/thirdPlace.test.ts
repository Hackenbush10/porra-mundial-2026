import { assignThirdPlaces, validateAssignment } from '../thirdPlace';
import { THIRD_PLACE_SLOTS } from '../data';
import { THIRD_PLACE_TABLE } from '../thirdPlaceTable';
import type { GroupLetter } from '@/types';

/** Comprueba que el resultado es un matching perfecto y válido */
function expectValidMatching(groups: GroupLetter[]) {
  const result = assignThirdPlaces(groups);
  expect(result).not.toBeNull();

  const { valid, errors } = validateAssignment(result!, groups);
  expect(errors).toEqual([]);
  expect(valid).toBe(true);

  // Todos los slots cubiertos
  for (const { slot } of THIRD_PLACE_SLOTS) {
    expect(result![slot]).toBeDefined();
  }

  // Sin grupos repetidos
  const assigned = Object.values(result!);
  expect(new Set(assigned).size).toBe(8);
}

describe('THIRD_PLACE_TABLE', () => {
  test('contiene exactamente 495 entradas', () => {
    expect(Object.keys(THIRD_PLACE_TABLE).length).toBe(495);
  });

  test('todas las claves tienen 8 caracteres y están ordenadas', () => {
    for (const key of Object.keys(THIRD_PLACE_TABLE)) {
      expect(key.length).toBe(8);
      const sorted = key.split('').sort().join('');
      expect(key).toBe(sorted);
    }
  });

  test('el resultado es idéntico independientemente del orden de entrada', () => {
    const a = assignThirdPlaces(['H', 'A', 'F', 'C', 'D', 'E', 'B', 'G']);
    const b = assignThirdPlaces(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(a).toEqual(b);
  });
});

describe('assignThirdPlaces', () => {
  // ── Caso 1: Grupos A B C D E F G H (todos en la primera mitad) ──────────────
  test('caso 1: A B C D E F G H', () => {
    expectValidMatching(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });

  // ── Caso 2: Grupos E F G H I J K L (todos en la segunda mitad) ──────────────
  test('caso 2: E F G H I J K L', () => {
    expectValidMatching(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']);
  });

  // ── Caso 3: Grupos A C E G I K + dos más ────────────────────────────────────
  test('caso 3: A C E G I K B D (grupos alternos)', () => {
    expectValidMatching(['A', 'C', 'E', 'G', 'I', 'K', 'B', 'D']);
  });

  // ── Caso 4: Grupos B D F H J L A C ──────────────────────────────────────────
  test('caso 4: B D F H J L A C', () => {
    expectValidMatching(['B', 'D', 'F', 'H', 'J', 'L', 'A', 'C']);
  });

  // ── Caso 5: Grupos C D E F I J K L ──────────────────────────────────────────
  test('caso 5: C D E F I J K L', () => {
    expectValidMatching(['C', 'D', 'E', 'F', 'I', 'J', 'K', 'L']);
  });

  // ── Caso 6: Grupos A B E F I J K L ──────────────────────────────────────────
  test('caso 6: A B E F I J K L', () => {
    expectValidMatching(['A', 'B', 'E', 'F', 'I', 'J', 'K', 'L']);
  });

  // ── Caso 7: Grupos A B C G H I J K ──────────────────────────────────────────
  test('caso 7: A B C G H I J K', () => {
    expectValidMatching(['A', 'B', 'C', 'G', 'H', 'I', 'J', 'K']);
  });

  // ── Error: menos de 8 grupos ─────────────────────────────────────────────────
  test('lanza error si no se pasan exactamente 8 grupos', () => {
    expect(() => assignThirdPlaces(['A', 'B', 'C'] as GroupLetter[])).toThrow();
  });

  // ── Verificación de asignación manual conocida ───────────────────────────────
  test('la asignación respeta los grupos posibles de cada slot', () => {
    const groups: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const result = assignThirdPlaces(groups)!;

    for (const { slot, possibleGroups } of THIRD_PLACE_SLOTS) {
      expect(possibleGroups).toContain(result[slot]);
    }
  });
});
