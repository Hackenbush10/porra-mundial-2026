import type { GroupLetter, R16Match, ThirdPlaceSlotDef } from '@/types';

// ─── Grupos del Mundial 2026 ──────────────────────────────────────────────────

export const GRUPOS: Record<GroupLetter, string[]> = {
  A: ['México', 'Sudáfrica', 'Corea del Sur', 'Rep. Checa'],
  B: ['Canadá', 'Bosnia y H.', 'Catar', 'Suiza'],
  C: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
  D: ['EE UU', 'Paraguay', 'Australia', 'Turquía'],
  E: ['Alemania', 'Curazao', 'C. Marfil', 'Ecuador'],
  F: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
  G: ['Bélgica', 'Egipto', 'Irán', 'N. Zelanda'],
  H: ['España', 'Cabo Verde', 'Arabia Saudí', 'Uruguay'],
  I: ['Francia', 'Senegal', 'Irak', 'Noruega'],
  J: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
  K: ['Portugal', 'RD Congo', 'Uzbekistán', 'Colombia'],
  L: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
};

export const GROUP_LETTERS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// ─── Slots de mejores terceros ────────────────────────────────────────────────

export const THIRD_PLACE_SLOTS: ThirdPlaceSlotDef[] = [
  { slot: 'vs1E', possibleGroups: ['A', 'B', 'C', 'D', 'F'] },
  { slot: 'vs1I', possibleGroups: ['E', 'F', 'G', 'I', 'J'] },
  { slot: 'vs1D', possibleGroups: ['B', 'E', 'F', 'I', 'J'] },
  { slot: 'vs1G', possibleGroups: ['A', 'E', 'H', 'I', 'J'] },
  { slot: 'vs1A', possibleGroups: ['C', 'E', 'F', 'H', 'I'] },
  { slot: 'vs1L', possibleGroups: ['E', 'H', 'I', 'J', 'K'] },
  { slot: 'vs1B', possibleGroups: ['C', 'D', 'F', 'G', 'H'] },
  { slot: 'vs1K', possibleGroups: ['D', 'E', 'I', 'J', 'L'] },
];

// ─── Emparejamientos de dieciseisavos (1/16) ──────────────────────────────────
//
// Mitad superior → conduce a Semifinal 1
// Mitad inferior → conduce a Semifinal 2

export const R16_MATCHES: R16Match[] = [
  // ── Mitad superior ──────────────────────────────────────────────────────────
  { id: 'R16-1',  labelA: '1º Grupo E', labelB: '3º {A,B,C,D,F}', thirdPlaceSlot: 'vs1E' },
  { id: 'R16-2',  labelA: '1º Grupo I', labelB: '3º {E,F,G,I,J}', thirdPlaceSlot: 'vs1I' },
  { id: 'R16-3',  labelA: '2º Grupo A', labelB: '2º Grupo B' },
  { id: 'R16-4',  labelA: '1º Grupo F', labelB: '2º Grupo C' },
  { id: 'R16-5',  labelA: '2º Grupo K', labelB: '2º Grupo L' },
  { id: 'R16-6',  labelA: '1º Grupo H', labelB: '2º Grupo J' },
  { id: 'R16-7',  labelA: '1º Grupo D', labelB: '3º {B,E,F,I,J}', thirdPlaceSlot: 'vs1D' },
  { id: 'R16-8',  labelA: '1º Grupo G', labelB: '3º {A,E,H,I,J}', thirdPlaceSlot: 'vs1G' },

  // ── Mitad inferior ──────────────────────────────────────────────────────────
  { id: 'R16-9',  labelA: '1º Grupo C', labelB: '2º Grupo F' },
  { id: 'R16-10', labelA: '2º Grupo E', labelB: '2º Grupo I' },
  { id: 'R16-11', labelA: '1º Grupo A', labelB: '3º {C,E,F,H,I}', thirdPlaceSlot: 'vs1A' },
  { id: 'R16-12', labelA: '1º Grupo L', labelB: '3º {E,H,I,J,K}', thirdPlaceSlot: 'vs1L' },
  { id: 'R16-13', labelA: '1º Grupo J', labelB: '2º Grupo H' },
  { id: 'R16-14', labelA: '2º Grupo D', labelB: '2º Grupo G' },
  { id: 'R16-15', labelA: '1º Grupo B', labelB: '3º {C,D,F,G,H}', thirdPlaceSlot: 'vs1B' },
  { id: 'R16-16', labelA: '1º Grupo K', labelB: '3º {D,E,I,J,L}', thirdPlaceSlot: 'vs1K' },
];

// ─── Estructura de octavos (1/8) ──────────────────────────────────────────────
// Cada QF agrupa dos partidos de 1/16 cuyos ganadores se enfrentan.

export const QF_MATCHES = [
  // Mitad superior
  { id: 'QF1', r16A: 'R16-1', r16B: 'R16-2' },
  { id: 'QF2', r16A: 'R16-3', r16B: 'R16-4' },
  { id: 'QF3', r16A: 'R16-5', r16B: 'R16-6' },
  { id: 'QF4', r16A: 'R16-7', r16B: 'R16-8' },
  // Mitad inferior
  { id: 'QF5', r16A: 'R16-9',  r16B: 'R16-10' },
  { id: 'QF6', r16A: 'R16-11', r16B: 'R16-12' },
  { id: 'QF7', r16A: 'R16-13', r16B: 'R16-14' },
  { id: 'QF8', r16A: 'R16-15', r16B: 'R16-16' },
] as const;

// ─── Cuartos (1/4) ───────────────────────────────────────────────────────────

export const SEMIS_SUP_MATCHES = [
  { id: 'SF-sup-1', qfA: 'QF1', qfB: 'QF2' },
  { id: 'SF-sup-2', qfA: 'QF3', qfB: 'QF4' },
] as const;

export const SEMIS_INF_MATCHES = [
  { id: 'SF-inf-1', qfA: 'QF5', qfB: 'QF6' },
  { id: 'SF-inf-2', qfA: 'QF7', qfB: 'QF8' },
] as const;

// ─── Semifinales ─────────────────────────────────────────────────────────────

export const SEMIFINAL_MATCHES = [
  { id: 'SF1', sfA: 'SF-sup-1', sfB: 'SF-sup-2' }, // Ganador mitad superior
  { id: 'SF2', sfA: 'SF-inf-1', sfB: 'SF-inf-2' }, // Ganador mitad inferior
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el equipo que ocupa una posición en un grupo dado el estado de grupos */
export function getTeamFromGroup(
  grupos: Partial<Record<GroupLetter, { 1: string; 2: string; 3: string; 4: string }>>,
  group: GroupLetter,
  position: 1 | 2 | 3 | 4
): string | null {
  return grupos[group]?.[position] ?? null;
}

/** Resuelve el equipo A de un partido de 1/16 a partir del estado de grupos */
export function resolveTeamA(match: R16Match, grupos: Parameters<typeof getTeamFromGroup>[0]): string | null {
  const label = match.labelA;
  const m = label.match(/^([12])º Grupo ([A-L])$/);
  if (!m) return null;
  return getTeamFromGroup(grupos, m[2] as GroupLetter, Number(m[1]) as 1 | 2);
}

/** Resuelve el equipo B de un partido de 1/16 (si no es slot de tercero) */
export function resolveTeamB(
  match: R16Match,
  grupos: Parameters<typeof getTeamFromGroup>[0],
  thirdPlaceAssignment: Partial<Record<string, GroupLetter>> | null
): string | null {
  if (match.thirdPlaceSlot) {
    const group = thirdPlaceAssignment?.[match.thirdPlaceSlot];
    if (!group) return null;
    return getTeamFromGroup(grupos, group, 3);
  }
  const label = match.labelB;
  const m = label.match(/^([12])º Grupo ([A-L])$/);
  if (!m) return null;
  return getTeamFromGroup(grupos, m[2] as GroupLetter, Number(m[1]) as 1 | 2);
}
