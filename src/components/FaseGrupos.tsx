'use client';

import type { GroupLetter, GruposState, GroupStandings } from '@/types';
import { GRUPOS, GROUP_LETTERS } from '@/lib/data';
import GrupoSelector from '@/components/GrupoSelector';

interface FaseGruposProps {
  grupos: GruposState;
  onChange: (group: GroupLetter, standings: GroupStandings) => void;
}

function isComplete(s: GroupStandings | undefined): boolean {
  if (!s) return false;
  return !!(s[1] && s[2] && s[3] && s[4]);
}

export default function FaseGrupos({ grupos, onChange }: FaseGruposProps) {
  const completed = GROUP_LETTERS.filter((g) => isComplete(grupos[g])).length;
  const total = GROUP_LETTERS.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fase de Grupos</h2>
          <p className="text-sm text-gray-500">
            Indica el orden de clasificación en cada grupo
          </p>
        </div>
        <div
          className={[
            'text-sm font-semibold px-3 py-1.5 rounded-full',
            completed === total
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-600',
          ].join(' ')}
        >
          {completed}/{total} grupos completados
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUP_LETTERS.map((g) => (
          <GrupoSelector
            key={g}
            group={g}
            teams={GRUPOS[g]}
            value={grupos[g]}
            onChange={(standings) => onChange(g, standings)}
          />
        ))}
      </div>
    </div>
  );
}
