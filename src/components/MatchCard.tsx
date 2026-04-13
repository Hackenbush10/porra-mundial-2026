'use client';

interface MatchCardProps {
  matchId: string;
  teamA: string | null;
  teamB: string | null;
  winner?: string;
  onSelect: (matchId: string, team: string) => void;
}

export default function MatchCard({
  matchId,
  teamA,
  teamB,
  winner,
  onSelect,
}: MatchCardProps) {
  const handleClick = (team: string | null) => {
    if (!team) return;
    onSelect(matchId, team);
  };

  const teamButton = (team: string | null, side: 'A' | 'B') => {
    const isWinner = winner && team && winner === team;
    const isLoser = winner && team && winner !== team;

    if (!team) {
      return (
        <div className="w-full h-10 rounded-md bg-gray-200 animate-pulse" />
      );
    }

    return (
      <button
        onClick={() => handleClick(team)}
        className={[
          'w-full px-3 py-2 rounded-md text-sm font-medium text-left transition-all border',
          isWinner
            ? 'bg-emerald-600 text-white border-emerald-600'
            : isLoser
            ? 'bg-white text-gray-400 border-gray-200'
            : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50',
        ].join(' ')}
      >
        <span className="flex items-center gap-2">
          {isWinner && <span className="text-white">&#10003;</span>}
          <span className="truncate">{team}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2">
      <p className="text-xs text-gray-400 font-mono">{matchId}</p>
      {teamButton(teamA, 'A')}
      <div className="text-center text-xs font-bold text-gray-400">VS</div>
      {teamButton(teamB, 'B')}
    </div>
  );
}
