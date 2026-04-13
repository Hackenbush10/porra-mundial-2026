'use client';

import type { ResolvedMatch } from '@/lib/bracketLogic';
import MatchCard from '@/components/MatchCard';

interface BracketPhaseProps {
  title: string;
  subtitle?: string;
  matches: ResolvedMatch[];
  onSelectWinner: (matchId: string, winner: string) => void;
  sections?: Array<{ title: string; matchIds: string[] }>;
}

export default function BracketPhase({
  title,
  subtitle,
  matches,
  onSelectWinner,
  sections,
}: BracketPhaseProps) {
  const completed = matches.filter((m) => m.winner).length;
  const total = matches.length;

  const isR16 = total === 16;

  const renderMatchGrid = (matchList: ResolvedMatch[], gridClass: string) => (
    <div className={gridClass}>
      {matchList.map((m) => (
        <MatchCard
          key={m.id}
          matchId={m.id}
          teamA={m.teamA}
          teamB={m.teamB}
          winner={m.winner}
          onSelect={onSelectWinner}
        />
      ))}
    </div>
  );

  const gridClass = isR16
    ? 'grid grid-cols-2 lg:grid-cols-4 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div
          className={[
            'text-sm font-semibold px-3 py-1.5 rounded-full',
            completed === total
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-600',
          ].join(' ')}
        >
          {completed} / {total} partidos completados
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
        />
      </div>

      {sections ? (
        <div className="flex flex-col gap-6">
          {sections.map((section) => {
            const sectionMatches = section.matchIds
              .map((id) => matches.find((m) => m.id === id))
              .filter((m): m is ResolvedMatch => m !== undefined);
            return (
              <div key={section.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {section.title}
                </h3>
                {renderMatchGrid(sectionMatches, gridClass)}
              </div>
            );
          })}
        </div>
      ) : (
        renderMatchGrid(matches, gridClass)
      )}
    </div>
  );
}
