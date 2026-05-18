'use client';

import { useState } from 'react';
import type {
  GroupLetter,
  GroupStandings,
  GruposState,
  ThirdPlaceAssignment,
  MatchId,
  QFId,
  SFSupId,
  SFInfId,
  SFId,
} from '@/types';
import { GROUP_LETTERS } from '@/lib/data';
import {
  R16_TO_QF,
  QF_TO_QF4,
  QF4_TO_SF,
  getR16Matches,
  getQFMatches,
  getSFSupInfMatches,
  getSFMatches,
  getFinalMatch,
} from '@/lib/bracketLogic';
import DatosPersonales from '@/components/DatosPersonales';
import FaseGrupos from '@/components/FaseGrupos';
import MejoresTerceros from '@/components/MejoresTerceros';
import BracketPhase from '@/components/BracketPhase';
import BracketPreview from '@/components/BracketPreview';

const STEP_LABELS = [
  'Mis Datos',
  'Grupos',
  'Terceros',
  '1/16',
  '1/8',
  '1/4',
  'Semis',
  'Final',
  'Resumen',
];

const TOTAL_STEPS = 9;

function isGroupsComplete(grupos: GruposState): boolean {
  return GROUP_LETTERS.every((g) => {
    const s = grupos[g];
    return s && s[1] && s[2] && s[3] && s[4];
  });
}

export default function WizardContainer() {
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState('');
  const [seccion, setSeccion] = useState('');
  const [email, setEmail] = useState('');
  const [grupos, setGrupos] = useState<GruposState>({});
  const [mejoresTerceros, setMejoresTerceros] = useState<GroupLetter[]>([]);
  const [thirdPlaceAssignment, setThirdPlaceAssignment] =
    useState<ThirdPlaceAssignment | null>(null);
  const [r16Winners, setR16Winners] = useState<Partial<Record<MatchId, string>>>({});
  const [r8Winners, setR8Winners] = useState<Partial<Record<QFId, string>>>({});
  const [qfWinners, setQfWinners] = useState<
    Partial<Record<SFSupId | SFInfId, string>>
  >({});
  const [sfWinners, setSfWinners] = useState<Partial<Record<SFId, string>>>({});
  const [finalWinner, setFinalWinner] = useState<string | undefined>(undefined);

  // ─── Cascade clearing helpers ──────────────────────────────────────────────

  const clearBracket = () => {
    setR16Winners({});
    setR8Winners({});
    setQfWinners({});
    setSfWinners({});
    setFinalWinner(undefined);
  };

  const clearFromQF = (qfId: QFId) => {
    setR8Winners((prev) => {
      const next = { ...prev };
      delete next[qfId];
      return next;
    });
    const sfSupInf = QF_TO_QF4[qfId];
    clearFromQF4(sfSupInf);
  };

  const clearFromQF4 = (id: SFSupId | SFInfId) => {
    setQfWinners((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const sfId = QF4_TO_SF[id];
    clearFromSF(sfId);
  };

  const clearFromSF = (sfId: SFId) => {
    setSfWinners((prev) => {
      const next = { ...prev };
      delete next[sfId];
      return next;
    });
    setFinalWinner(undefined);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGruposChange = (g: GroupLetter, standings: GroupStandings) => {
    setGrupos((prev) => ({ ...prev, [g]: standings }));
    // Cascade: clear mejoresTerceros and full bracket
    setMejoresTerceros([]);
    setThirdPlaceAssignment(null);
    clearBracket();
  };

  const handleThirdPlaceConfirm = (
    sel: GroupLetter[],
    assignment: ThirdPlaceAssignment
  ) => {
    setMejoresTerceros(sel);
    setThirdPlaceAssignment(assignment);
    clearBracket();
  };

  const handleR16Winner = (matchId: string, winner: string) => {
    const id = matchId as MatchId;
    setR16Winners((prev) => ({ ...prev, [id]: winner }));
    // Cascade downstream
    const qfId = R16_TO_QF[id];
    clearFromQF(qfId);
  };

  const handleR8Winner = (matchId: string, winner: string) => {
    const id = matchId as QFId;
    setR8Winners((prev) => ({ ...prev, [id]: winner }));
    const sfSupInf = QF_TO_QF4[id];
    clearFromQF4(sfSupInf);
  };

  const handleQFWinner = (matchId: string, winner: string) => {
    const id = matchId as SFSupId | SFInfId;
    setQfWinners((prev) => ({ ...prev, [id]: winner }));
    const sfId = QF4_TO_SF[id];
    clearFromSF(sfId);
  };

  const handleSFWinner = (matchId: string, winner: string) => {
    const id = matchId as SFId;
    setSfWinners((prev) => ({ ...prev, [id]: winner }));
    setFinalWinner(undefined);
  };

  const handleFinalWinner = (_matchId: string, winner: string) => {
    setFinalWinner(winner);
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const canAdvance = (): boolean => {
    switch (paso) {
      case 1:
        return nombre.trim().length > 0 && seccion.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      case 2:
        return isGroupsComplete(grupos);
      case 3:
        return thirdPlaceAssignment !== null;
      case 4:
        return Object.keys(r16Winners).length === 16;
      case 5:
        return Object.keys(r8Winners).length === 8;
      case 6:
        return Object.keys(qfWinners).length === 4;
      case 7:
        return Object.keys(sfWinners).length === 2;
      case 8:
        return finalWinner !== undefined;
      case 9:
        return true;
      default:
        return false;
    }
  };

  const getMissingNote = (): string | null => {
    if (canAdvance()) return null;
    switch (paso) {
      case 1:
        return 'Rellena tu nombre, sección y email para continuar.';
      case 2: {
        const missing = GROUP_LETTERS.filter((g) => {
          const s = grupos[g];
          return !s || !s[1] || !s[2] || !s[3] || !s[4];
        }).length;
        return `Faltan ${missing} grupo${missing !== 1 ? 's' : ''} por completar.`;
      }
      case 3:
        return 'Selecciona exactamente 8 terceros y confirma la selección.';
      case 4:
        return `Faltan ${16 - Object.keys(r16Winners).length} partidos por decidir.`;
      case 5:
        return `Faltan ${8 - Object.keys(r8Winners).length} partidos por decidir.`;
      case 6:
        return `Faltan ${4 - Object.keys(qfWinners).length} partidos por decidir.`;
      case 7:
        return `Faltan ${2 - Object.keys(sfWinners).length} partidos por decidir.`;
      case 8:
        return 'Elige el campeón del mundo.';
      default:
        return null;
    }
  };

  // ─── Step content ──────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (paso) {
      case 1:
        return (
          <DatosPersonales
            nombre={nombre}
            seccion={seccion}
            email={email}
            onChange={(field, value) => {
              if (field === 'nombre') setNombre(value);
              else if (field === 'seccion') setSeccion(value);
              else setEmail(value);
            }}
          />
        );
      case 2:
        return (
          <FaseGrupos
            grupos={grupos}
            onChange={handleGruposChange}
          />
        );
      case 3:
        return (
          <MejoresTerceros
            grupos={grupos}
            selected={mejoresTerceros}
            assignment={thirdPlaceAssignment}
            onConfirm={handleThirdPlaceConfirm}
          />
        );
      case 4: {
        const matches = getR16Matches(grupos, thirdPlaceAssignment!, r16Winners);
        return (
          <BracketPhase
            title="Dieciseisavos de Final"
            matches={matches}
            onSelectWinner={handleR16Winner}
            sections={[
              {
                title: 'Mitad Superior',
                matchIds: ['R16-1', 'R16-2', 'R16-3', 'R16-4', 'R16-5', 'R16-6', 'R16-7', 'R16-8'],
              },
              {
                title: 'Mitad Inferior',
                matchIds: ['R16-9', 'R16-10', 'R16-11', 'R16-12', 'R16-13', 'R16-14', 'R16-15', 'R16-16'],
              },
            ]}
          />
        );
      }
      case 5: {
        const matches = getQFMatches(r16Winners, r8Winners);
        return (
          <BracketPhase
            title="Octavos de Final"
            matches={matches}
            onSelectWinner={handleR8Winner}
          />
        );
      }
      case 6: {
        const matches = getSFSupInfMatches(r8Winners, qfWinners);
        return (
          <BracketPhase
            title="Cuartos de Final"
            matches={matches}
            onSelectWinner={handleQFWinner}
          />
        );
      }
      case 7: {
        const matches = getSFMatches(qfWinners, sfWinners);
        return (
          <BracketPhase
            title="Semifinales"
            matches={matches}
            onSelectWinner={handleSFWinner}
          />
        );
      }
      case 8: {
        const matches = getFinalMatch(sfWinners, finalWinner);
        return (
          <BracketPhase
            title="Gran Final"
            matches={matches}
            onSelectWinner={handleFinalWinner}
          />
        );
      }
      case 9:
        return (
          <BracketPreview
            nombre={nombre}
            seccion={seccion}
            email={email}
            grupos={grupos}
            mejoresTerceros={mejoresTerceros}
            thirdPlaceAssignment={thirdPlaceAssignment}
            bracket={{
              r16: r16Winners,
              r8: r8Winners,
              qf: qfWinners,
              sf: sfWinners,
              final: finalWinner,
            }}
          />
        );
      default:
        return null;
    }
  };

  // ─── Stepper ───────────────────────────────────────────────────────────────

  const renderStepper = () => (
    <div className="w-full">
      {/* Mobile: show current step text */}
      <div className="flex items-center justify-between md:hidden px-1 mb-4">
        <span className="text-sm text-gray-500">
          Paso {paso} de {TOTAL_STEPS}
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {STEP_LABELS[paso - 1]}
        </span>
      </div>

      {/* Mobile: mini progress bar */}
      <div className="md:hidden w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((paso - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

      {/* Desktop: full step circles */}
      <div className="hidden md:flex items-center justify-between w-full">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isCurrent = stepNum === paso;
          const isCompleted = stepNum < paso;

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white border-2 border-gray-300 text-gray-400',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <span>&#10003;</span>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={[
                    'mt-1 text-xs font-medium whitespace-nowrap',
                    isCurrent
                      ? 'text-emerald-700'
                      : isCompleted
                      ? 'text-gray-500'
                      : 'text-gray-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {index < TOTAL_STEPS - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-1 mb-5',
                    isCompleted ? 'bg-emerald-300' : 'bg-gray-200',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Navigation ────────────────────────────────────────────────────────────

  const missingNote = getMissingNote();
  const isLastStep = paso === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-emerald-950 flex items-start justify-center py-6 px-3 sm:py-8 sm:px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Stepper */}
        <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-100">
          {renderStepper()}
        </div>

        {/* Content — scrollable on mobile */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          {missingNote && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {missingNote}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setPaso((p) => Math.max(1, p - 1))}
              disabled={paso === 1}
              className={[
                'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                paso === 1
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              Anterior
            </button>

            {isLastStep ? (
              <span /> /* actions are inside BracketPreview */
            ) : (
              <button
                onClick={() => setPaso((p) => Math.min(TOTAL_STEPS, p + 1))}
                disabled={!canAdvance()}
                className={[
                  'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  canAdvance()
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {paso === TOTAL_STEPS - 1 ? 'Ver resumen' : 'Siguiente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
