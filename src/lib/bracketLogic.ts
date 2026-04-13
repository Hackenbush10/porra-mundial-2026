import type {
  GroupLetter,
  GruposState,
  ThirdPlaceAssignment,
  MatchId,
  QFId,
  SFSupId,
  SFInfId,
  SFId,
} from '@/types';
import {
  R16_MATCHES,
  QF_MATCHES,
  SEMIS_SUP_MATCHES,
  SEMIS_INF_MATCHES,
  SEMIFINAL_MATCHES,
  resolveTeamA,
  resolveTeamB,
} from '@/lib/data';

export interface ResolvedMatch {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner?: string;
}

// ─── Dependency maps ──────────────────────────────────────────────────────────

export const R16_TO_QF: Record<MatchId, QFId> = {
  'R16-1': 'QF1', 'R16-2': 'QF1',
  'R16-3': 'QF2', 'R16-4': 'QF2',
  'R16-5': 'QF3', 'R16-6': 'QF3',
  'R16-7': 'QF4', 'R16-8': 'QF4',
  'R16-9': 'QF5', 'R16-10': 'QF5',
  'R16-11': 'QF6', 'R16-12': 'QF6',
  'R16-13': 'QF7', 'R16-14': 'QF7',
  'R16-15': 'QF8', 'R16-16': 'QF8',
};

export const QF_TO_QF4: Record<QFId, SFSupId | SFInfId> = {
  QF1: 'SF-sup-1', QF2: 'SF-sup-1',
  QF3: 'SF-sup-2', QF4: 'SF-sup-2',
  QF5: 'SF-inf-1', QF6: 'SF-inf-1',
  QF7: 'SF-inf-2', QF8: 'SF-inf-2',
};

export const QF4_TO_SF: Record<SFSupId | SFInfId, SFId> = {
  'SF-sup-1': 'SF1', 'SF-sup-2': 'SF1',
  'SF-inf-1': 'SF2', 'SF-inf-2': 'SF2',
};

// ─── Pure resolver functions ──────────────────────────────────────────────────

/**
 * Resolve label like "1º Grupo E" or "2º Grupo A" to a team name.
 * Returns null if not found.
 */
function resolveLabel(
  label: string,
  grupos: GruposState
): string | null {
  const m = label.match(/^([1-4])º Grupo ([A-L])$/);
  if (!m) return null;
  const pos = Number(m[1]) as 1 | 2 | 3 | 4;
  const group = m[2] as GroupLetter;
  return grupos[group]?.[pos] ?? null;
}

export function getR16Matches(
  grupos: GruposState,
  thirdPlaceAssignment: ThirdPlaceAssignment | null,
  r16Winners: Partial<Record<MatchId, string>>
): ResolvedMatch[] {
  return R16_MATCHES.map((match) => {
    const teamA = resolveTeamA(match, grupos);
    const teamB = resolveTeamB(match, grupos, thirdPlaceAssignment);
    return {
      id: match.id,
      teamA,
      teamB,
      winner: r16Winners[match.id],
    };
  });
}

export function getQFMatches(
  r16Winners: Partial<Record<MatchId, string>>,
  r8Winners: Partial<Record<QFId, string>>
): ResolvedMatch[] {
  return QF_MATCHES.map((match) => {
    const teamA = r16Winners[match.r16A as MatchId] ?? null;
    const teamB = r16Winners[match.r16B as MatchId] ?? null;
    return {
      id: match.id,
      teamA,
      teamB,
      winner: r8Winners[match.id as QFId],
    };
  });
}

export function getSFSupInfMatches(
  r8Winners: Partial<Record<QFId, string>>,
  qfWinners: Partial<Record<SFSupId | SFInfId, string>>
): ResolvedMatch[] {
  const all = [...SEMIS_SUP_MATCHES, ...SEMIS_INF_MATCHES];
  return all.map((match) => {
    const teamA = r8Winners[match.qfA as QFId] ?? null;
    const teamB = r8Winners[match.qfB as QFId] ?? null;
    return {
      id: match.id,
      teamA,
      teamB,
      winner: qfWinners[match.id as SFSupId | SFInfId],
    };
  });
}

export function getSFMatches(
  qfWinners: Partial<Record<SFSupId | SFInfId, string>>,
  sfWinners: Partial<Record<SFId, string>>
): ResolvedMatch[] {
  return SEMIFINAL_MATCHES.map((match) => {
    const teamA = qfWinners[match.sfA as SFSupId | SFInfId] ?? null;
    const teamB = qfWinners[match.sfB as SFSupId | SFInfId] ?? null;
    return {
      id: match.id,
      teamA,
      teamB,
      winner: sfWinners[match.id as SFId],
    };
  });
}

export function getFinalMatch(
  sfWinners: Partial<Record<SFId, string>>,
  finalWinner: string | undefined
): ResolvedMatch[] {
  const teamA = sfWinners['SF1'] ?? null;
  const teamB = sfWinners['SF2'] ?? null;
  return [
    {
      id: 'FINAL',
      teamA,
      teamB,
      winner: finalWinner,
    },
  ];
}
