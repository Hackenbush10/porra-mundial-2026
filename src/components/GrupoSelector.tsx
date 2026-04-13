'use client';

import type { GroupLetter, GroupStandings } from '@/types';

interface GrupoSelectorProps {
  group: GroupLetter;
  teams: string[];
  value: GroupStandings | undefined;
  onChange: (standings: GroupStandings) => void;
}

const BADGE_COLORS: Record<GroupLetter, string> = {
  A: 'bg-emerald-700',
  B: 'bg-teal-700',
  C: 'bg-green-700',
  D: 'bg-cyan-700',
  E: 'bg-emerald-800',
  F: 'bg-teal-800',
  G: 'bg-green-800',
  H: 'bg-cyan-800',
  I: 'bg-emerald-600',
  J: 'bg-teal-600',
  K: 'bg-green-600',
  L: 'bg-cyan-600',
};

export default function GrupoSelector({
  group,
  teams,
  value,
  onChange,
}: GrupoSelectorProps) {
  const pos1 = value?.[1] ?? '';
  const pos2 = value?.[2] ?? '';
  const pos3 = value?.[3] ?? '';

  // Compute 4th automatically
  const selected3 = [pos1, pos2, pos3].filter(Boolean);
  const fourth = teams.find((t) => !selected3.includes(t)) ?? null;

  const available = (exclude: string[]) =>
    teams.filter((t) => !exclude.includes(t));

  // Builds a GroupStandings-shaped object even when some positions are empty.
  // WizardContainer's isGroupsComplete() rejects any entry with empty strings,
  // so partial state never causes a false "complete" reading.
  const partial = (fields: { 1: string; 2: string; 3: string; 4: string }) =>
    fields as GroupStandings;

  const handleChange1 = (v: string) => {
    onChange(partial({ 1: v, 2: '', 3: '', 4: '' }));
  };

  const handleChange2 = (v: string) => {
    if (!pos1) return;
    onChange(partial({ 1: pos1, 2: v, 3: '', 4: '' }));
  };

  const handleChange3 = (v: string) => {
    if (!pos1 || !pos2) return;
    const auto4 = teams.find((t) => ![pos1, pos2, v].includes(t)) ?? '';
    onChange(partial({ 1: pos1, 2: pos2, 3: v, 4: auto4 }));
  };

  const selectClass =
    'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-400';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={`${BADGE_COLORS[group]} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0`}
        >
          {group}
        </span>
        <h3 className="font-semibold text-gray-800 text-sm">Grupo {group}</h3>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-5 flex-shrink-0">1º</span>
          <select
            value={pos1}
            onChange={(e) => handleChange1(e.target.value)}
            className={selectClass}
          >
            <option value="">— Seleccionar —</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-5 flex-shrink-0">2º</span>
          <select
            value={pos2}
            onChange={(e) => handleChange2(e.target.value)}
            disabled={!pos1}
            className={selectClass}
          >
            <option value="">— Seleccionar —</option>
            {available([pos1]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-5 flex-shrink-0">3º</span>
          <select
            value={pos3}
            onChange={(e) => handleChange3(e.target.value)}
            disabled={!pos1 || !pos2}
            className={selectClass}
          >
            <option value="">— Seleccionar —</option>
            {available([pos1, pos2]).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400 w-5 flex-shrink-0">4º</span>
          <p className="text-sm text-gray-400 italic">
            {fourth && pos3 ? fourth : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
