'use client';

export interface BracketMatchData {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner: string | undefined;
}

interface Props {
  match: BracketMatchData;
  onSelect: (matchId: string, team: string) => void;
  // Tailwind classes injected by parent so this component stays phase-agnostic
  borderClass: string;       // e.g. 'border-blue-400'
  winnerBgClass: string;     // e.g. 'bg-blue-100'
  winnerTextClass: string;   // e.g. 'text-blue-700'
  width: number;             // px, set as inline style
}

export default function BracketMatch({
  match,
  onSelect,
  borderClass,
  winnerBgClass,
  winnerTextClass,
  width,
}: Props) {
  const { id, teamA, teamB, winner } = match;
  const canInteract = teamA !== null && teamB !== null;

  function rowClass(team: string | null): string {
    if (!team) return 'text-gray-300 italic text-[10px] select-none';
    if (winner === team) return `${winnerBgClass} ${winnerTextClass} font-semibold rounded`;
    if (winner && winner !== team) return 'text-gray-400 line-through';
    return canInteract
      ? 'text-gray-700 hover:bg-gray-100 rounded cursor-pointer'
      : 'text-gray-400 cursor-default';
  }

  function handleClick(team: string | null) {
    if (!canInteract || !team) return;
    onSelect(id, team);
  }

  return (
    <div
      className={`border ${borderClass} rounded-lg bg-white shadow-sm overflow-hidden`}
      style={{ width }}
    >
      {/* Team A */}
      <div
        className={`px-2 py-1 text-[11px] leading-tight truncate transition-colors ${rowClass(teamA)}`}
        onClick={() => handleClick(teamA)}
        title={teamA ?? undefined}
      >
        {teamA ?? 'Por definir'}
      </div>

      {/* Divider */}
      <div className={`border-t ${borderClass} opacity-40`} />

      {/* Team B */}
      <div
        className={`px-2 py-1 text-[11px] leading-tight truncate transition-colors ${rowClass(teamB)}`}
        onClick={() => handleClick(teamB)}
        title={teamB ?? undefined}
      >
        {teamB ?? 'Por definir'}
      </div>
    </div>
  );
}
