'use client';

import { useState } from 'react';
import type { GroupLetter, GruposState, ThirdPlaceAssignment } from '@/types';
import { GROUP_LETTERS, THIRD_PLACE_SLOTS } from '@/lib/data';
import { assignThirdPlaces } from '@/lib/thirdPlace';

interface MejoresTercerosProps {
  grupos: GruposState;
  selected: GroupLetter[];
  assignment: ThirdPlaceAssignment | null;
  onConfirm: (
    selected: GroupLetter[],
    assignment: ThirdPlaceAssignment
  ) => void;
}

export default function MejoresTerceros({
  grupos,
  selected,
  assignment,
  onConfirm,
}: MejoresTercerosProps) {
  const [localSelected, setLocalSelected] = useState<GroupLetter[]>(selected);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ThirdPlaceAssignment | null>(
    assignment
  );

  const toggle = (g: GroupLetter) => {
    setError(null);
    setConfirmed(null);
    setLocalSelected((prev) => {
      if (prev.includes(g)) return prev.filter((x) => x !== g);
      if (prev.length >= 8) return prev;
      return [...prev, g];
    });
  };

  const handleConfirm = () => {
    if (localSelected.length !== 8) return;
    const result = assignThirdPlaces(localSelected);
    if (!result) {
      setError(
        'La combinación seleccionada no tiene una asignación válida de slots. Por favor, cambia algún grupo.'
      );
      return;
    }
    setError(null);
    setConfirmed(result);
    onConfirm(localSelected, result);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mejores Terceros</h2>
        <p className="text-sm text-gray-500">
          Selecciona los 8 terceros clasificados que pasarán a 1/16 de final
        </p>
      </div>

      <div
        className={[
          'text-sm font-semibold px-3 py-1.5 rounded-full self-start',
          localSelected.length === 8
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-gray-100 text-gray-600',
        ].join(' ')}
      >
        {localSelected.length} / 8 seleccionados
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {GROUP_LETTERS.map((g) => {
          const team = grupos[g]?.[3] ?? null;
          const isSelected = localSelected.includes(g);
          const isDisabled = !isSelected && localSelected.length >= 8;

          return (
            <button
              key={g}
              onClick={() => toggle(g)}
              disabled={isDisabled || !team}
              className={[
                'rounded-xl border-2 p-3 text-left transition-all',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : isDisabled
                  ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-emerald-300',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={[
                    'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600',
                  ].join(' ')}
                >
                  {g}
                </span>
                <span className="text-xs text-gray-500">Grupo {g}</span>
              </div>
              <p
                className={[
                  'text-sm font-medium truncate',
                  team ? 'text-gray-800' : 'text-gray-400 italic',
                ].join(' ')}
              >
                {team ?? 'Sin clasificar'}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={localSelected.length !== 8}
        className={[
          'w-full sm:w-auto self-start rounded-lg px-6 py-3 text-sm font-semibold transition-all',
          localSelected.length === 8
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed',
        ].join(' ')}
      >
        Confirmar selección
      </button>

      {confirmed && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-800 mb-1">
            Asignación confirmada:
          </p>
          {THIRD_PLACE_SLOTS.map(({ slot }) => {
            const groupLetter = confirmed[slot];
            const teamName = grupos[groupLetter]?.[3] ?? '?';
            // Format slot label: vs1E → vs 1º Grupo E
            const slotLabel = slot.replace('vs1', 'vs 1º Grupo ');
            return (
              <div key={slot} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-700 font-mono text-xs w-28 flex-shrink-0">
                  {slotLabel}
                </span>
                <span className="text-gray-400">&#8594;</span>
                <span className="text-gray-700">
                  Mejor 3º Grupo{' '}
                  <span className="font-semibold">{groupLetter}</span> (
                  {teamName})
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
