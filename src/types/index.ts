// ─── Grupos ───────────────────────────────────────────────────────────────────

export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface GroupStandings {
  1: string;
  2: string;
  3: string;
  4: string;
}

/** Clasificación de todos los grupos: { A: { 1: 'México', 2: ..., 3: ..., 4: ... }, ... } */
export type GruposState = Partial<Record<GroupLetter, GroupStandings>>;

// ─── Terceros ─────────────────────────────────────────────────────────────────

/** Los 8 slots de terceros clasificados, identificados por qué 1º de grupo se enfrentan */
export type ThirdPlaceSlot =
  | 'vs1E'
  | 'vs1I'
  | 'vs1D'
  | 'vs1G'
  | 'vs1A'
  | 'vs1L'
  | 'vs1B'
  | 'vs1K';

/** Mapa slot → letra de grupo del que proviene el mejor 3º */
export type ThirdPlaceAssignment = Record<ThirdPlaceSlot, GroupLetter>;

// ─── Bracket ──────────────────────────────────────────────────────────────────

export type MatchId =
  | 'R16-1' | 'R16-2' | 'R16-3' | 'R16-4'
  | 'R16-5' | 'R16-6' | 'R16-7' | 'R16-8'
  | 'R16-9' | 'R16-10' | 'R16-11' | 'R16-12'
  | 'R16-13' | 'R16-14' | 'R16-15' | 'R16-16';

export type QFId = 'QF1' | 'QF2' | 'QF3' | 'QF4' | 'QF5' | 'QF6' | 'QF7' | 'QF8';
export type SFSupId = 'SF-sup-1' | 'SF-sup-2';
export type SFInfId = 'SF-inf-1' | 'SF-inf-2';
export type SFId = 'SF1' | 'SF2';

export interface BracketState {
  r16: Partial<Record<MatchId, string>>;   // 16 ganadores de 1/16
  r8: Partial<Record<QFId, string>>;       // 8 ganadores de 1/8
  qf: Partial<Record<SFSupId | SFInfId, string>>; // 4 ganadores de 1/4
  sf: Partial<Record<SFId, string>>;       // 2 finalistas
  final?: string;                          // campeón
}

// ─── Match definition ─────────────────────────────────────────────────────────

/** Descripción de un partido del bracket con sus equipos resueltos */
export interface Match {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner?: string;
}

// ─── Estado global del wizard ─────────────────────────────────────────────────

export interface WizardState {
  // Paso 1
  nombre: string;
  seccion: string;
  // Paso 2
  grupos: GruposState;
  // Paso 3
  mejoresTerceros: GroupLetter[];          // 8 grupos seleccionados
  thirdPlaceAssignment: ThirdPlaceAssignment | null;
  // Pasos 4-9
  bracket: BracketState;
}

// ─── Datos estáticos ──────────────────────────────────────────────────────────

export interface R16Match {
  id: MatchId;
  /** Descripción del equipo A (p.ej. "1º Grupo E") */
  labelA: string;
  /** Descripción del equipo B */
  labelB: string;
  /** Si B es un slot de tercero, aquí está el slot */
  thirdPlaceSlot?: ThirdPlaceSlot;
}

export interface ThirdPlaceSlotDef {
  slot: ThirdPlaceSlot;
  /** Grupos posibles para este slot */
  possibleGroups: GroupLetter[];
}
