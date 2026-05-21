import type { GroupLetter, ThirdPlaceSlot, ThirdPlaceAssignment } from '@/types';
import { THIRD_PLACE_SLOTS } from './data';
import { THIRD_PLACE_TABLE } from './thirdPlaceTable';

/**
 * Asigna los 8 mejores terceros a sus slots de 1/16 mediante consulta a la tabla
 * precalculada (C(12,8) = 495 combinaciones).
 *
 * @param selectedGroups - Array de exactamente 8 letras de grupo
 * @returns Mapa { slot → grupo } o null si la combinación no tiene asignación válida
 */
export function assignThirdPlaces(
  selectedGroups: GroupLetter[],
): ThirdPlaceAssignment | null {
  if (selectedGroups.length !== 8) {
    throw new Error(`Se esperan exactamente 8 grupos, se recibieron ${selectedGroups.length}`);
  }

  const key = [...selectedGroups].sort().join('');
  const entry = THIRD_PLACE_TABLE[key];

  return (entry as ThirdPlaceAssignment) ?? null;
}

/**
 * Valida que un mapa de asignación es correcto:
 * - Cada slot recibe exactamente un grupo
 * - El grupo asignado está en la lista de posibles del slot
 * - No hay grupos repetidos
 */
export function validateAssignment(
  assignment: ThirdPlaceAssignment,
  selectedGroups: GroupLetter[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const usedGroups = new Set<GroupLetter>();

  for (const slotDef of THIRD_PLACE_SLOTS) {
    const group = assignment[slotDef.slot];

    if (!group) {
      errors.push(`Slot ${slotDef.slot} no tiene grupo asignado`);
      continue;
    }
    if (!selectedGroups.includes(group)) {
      errors.push(`Slot ${slotDef.slot}: el grupo ${group} no está en los seleccionados`);
    }
    if (!slotDef.possibleGroups.includes(group as GroupLetter)) {
      errors.push(
        `Slot ${slotDef.slot}: el grupo ${group} no es válido para este slot (posibles: ${slotDef.possibleGroups.join(', ')})`,
      );
    }
    if (usedGroups.has(group)) {
      errors.push(`Grupo ${group} asignado a más de un slot`);
    }
    usedGroups.add(group);
  }

  return { valid: errors.length === 0, errors };
}
