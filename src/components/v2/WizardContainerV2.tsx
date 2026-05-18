'use client';

import { useState } from 'react';
import type {
  GroupLetter,
  GroupStandings,
  GruposState,
  ThirdPlaceAssignment,
  BracketState,
  MatchId,
  QFId,
  SFSupId,
  SFInfId,
  SFId,
} from '@/types';
import {
  GRUPOS,
  GROUP_LETTERS,
  R16_MATCHES,
  QF_MATCHES,
  SEMIS_SUP_MATCHES,
  SEMIS_INF_MATCHES,
  SEMIFINAL_MATCHES,
  resolveTeamA,
  resolveTeamB,
} from '@/lib/data';
import { assignThirdPlaces } from '@/lib/thirdPlace';
import DatosPersonales from '@/components/DatosPersonales';
import FaseGrupos from '@/components/FaseGrupos';
import MejoresTerceros from '@/components/MejoresTerceros';
import BracketPreviewV2 from '@/components/v2/BracketPreviewV2';
import InteractiveBracket from '@/components/v2/InteractiveBracket';

const STEP_LABELS = ['Mis Datos', 'Grupos', 'Terceros', 'Fase final', 'Resumen'];
const TOTAL_STEPS = 5;

const EMPTY_BRACKET: BracketState = {
  r16: {},
  r8: {},
  qf: {},
  sf: {},
  final: undefined,
};

function isGroupsComplete(grupos: GruposState): boolean {
  return GROUP_LETTERS.every((g) => {
    const s = grupos[g];
    return s && s[1] && s[2] && s[3] && s[4];
  });
}

function RandomBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all"
    >
      Relleno aleatorio 🎲
    </button>
  );
}

export default function WizardContainerV2() {
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState('');
  const [seccion, setSeccion] = useState('');
  const [email, setEmail] = useState('');
  const [grupos, setGrupos] = useState<GruposState>({});
  const [mejoresTerceros, setMejoresTerceros] = useState<GroupLetter[]>([]);
  const [thirdPlaceAssignment, setThirdPlaceAssignment] =
    useState<ThirdPlaceAssignment | null>(null);
  const [bracket, setBracket] = useState<BracketState>(EMPTY_BRACKET);
  const [step2Key, setStep2Key] = useState(0);
  const [step3Key, setStep3Key] = useState(0);

  // ─── Random fill ──────────────────────────────────────────────────────────────

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const randomFillGrupos = () => {
    const newGrupos: GruposState = {};
    for (const g of GROUP_LETTERS) {
      const [t1, t2, t3, t4] = shuffle(GRUPOS[g]);
      newGrupos[g] = { 1: t1, 2: t2, 3: t3, 4: t4 };
    }
    setGrupos(newGrupos);
    setMejoresTerceros([]);
    setThirdPlaceAssignment(null);
    setBracket(EMPTY_BRACKET);
    setStep2Key((k) => k + 1);
  };

  const randomFillTerceros = () => {
    const sel = shuffle(GROUP_LETTERS).slice(0, 8).sort() as GroupLetter[];
    const assignment = assignThirdPlaces(sel);
    if (!assignment) return;
    setMejoresTerceros(sel);
    setThirdPlaceAssignment(assignment);
    setBracket(EMPTY_BRACKET);
    setStep3Key((k) => k + 1);
  };

  const randomFillBracket = () => {
    if (!thirdPlaceAssignment) return;
    const pick = <T,>(a: T, b: T) => (Math.random() < 0.5 ? a : b);

    const newR16: Partial<Record<MatchId, string>> = {};
    for (const m of R16_MATCHES) {
      const a = resolveTeamA(m, grupos);
      const b = resolveTeamB(m, grupos, thirdPlaceAssignment);
      if (a && b) newR16[m.id] = pick(a, b);
    }

    const newR8: Partial<Record<QFId, string>> = {};
    for (const m of QF_MATCHES) {
      const a = newR16[m.r16A as MatchId];
      const b = newR16[m.r16B as MatchId];
      if (a && b) newR8[m.id as QFId] = pick(a, b);
    }

    const newQF: Partial<Record<SFSupId | SFInfId, string>> = {};
    for (const m of [...SEMIS_SUP_MATCHES, ...SEMIS_INF_MATCHES]) {
      const a = newR8[m.qfA as QFId];
      const b = newR8[m.qfB as QFId];
      if (a && b) newQF[m.id as SFSupId | SFInfId] = pick(a, b);
    }

    const newSF: Partial<Record<SFId, string>> = {};
    for (const m of SEMIFINAL_MATCHES) {
      const a = newQF[m.sfA as SFSupId | SFInfId];
      const b = newQF[m.sfB as SFSupId | SFInfId];
      if (a && b) newSF[m.id as SFId] = pick(a, b);
    }

    const finalA = newSF['SF1'];
    const finalB = newSF['SF2'];
    setBracket({
      r16: newR16,
      r8: newR8,
      qf: newQF,
      sf: newSF,
      final: finalA && finalB ? pick(finalA, finalB) : undefined,
    });
  };

  const handleReset = () => {
    setNombre('');
    setSeccion('');
    setEmail('');
    setGrupos({});
    setMejoresTerceros([]);
    setThirdPlaceAssignment(null);
    setBracket(EMPTY_BRACKET);
    setStep2Key((k) => k + 1);
    setStep3Key((k) => k + 1);
    setPaso(1);
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleGruposChange = (g: GroupLetter, standings: GroupStandings) => {
    setGrupos((prev) => ({ ...prev, [g]: standings }));
    setMejoresTerceros([]);
    setThirdPlaceAssignment(null);
    setBracket(EMPTY_BRACKET);
  };

  const handleThirdPlaceConfirm = (
    sel: GroupLetter[],
    assignment: ThirdPlaceAssignment
  ) => {
    setMejoresTerceros(sel);
    setThirdPlaceAssignment(assignment);
    setBracket(EMPTY_BRACKET);
  };

  // ─── Validation ──────────────────────────────────────────────────────────────

  const canAdvance = (): boolean => {
    switch (paso) {
      case 1:
        return nombre.trim().length > 0 && seccion.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      case 2:
        return isGroupsComplete(grupos);
      case 3:
        return thirdPlaceAssignment !== null;
      case 4:
        return bracket.final !== undefined;
      case 5:
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
        return 'Completa el bracket eligiendo un campeón para continuar.';
      default:
        return null;
    }
  };

  // ─── Step content ─────────────────────────────────────────────────────────────

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
          <div>
            <div className="flex justify-end mb-3">
              <RandomBtn onClick={randomFillGrupos} />
            </div>
            <FaseGrupos
              key={step2Key}
              grupos={grupos}
              onChange={handleGruposChange}
            />
          </div>
        );
      case 3:
        return (
          <div>
            <div className="flex justify-end mb-3">
              <RandomBtn onClick={randomFillTerceros} />
            </div>
            <MejoresTerceros
              key={step3Key}
              grupos={grupos}
              selected={mejoresTerceros}
              assignment={thirdPlaceAssignment}
              onConfirm={handleThirdPlaceConfirm}
            />
          </div>
        );
      case 4:
        return (
          <div>
            <div className="flex justify-end mb-3">
              <RandomBtn onClick={randomFillBracket} />
            </div>
            <InteractiveBracket
              grupos={grupos}
              thirdPlaceAssignment={thirdPlaceAssignment!}
              bracket={bracket}
              onChange={setBracket}
            />
          </div>
        );
      case 5:
        return (
          <BracketPreviewV2
            nombre={nombre}
            seccion={seccion}
            email={email}
            grupos={grupos}
            mejoresTerceros={mejoresTerceros}
            thirdPlaceAssignment={thirdPlaceAssignment}
            bracket={bracket}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  // ─── Stepper ─────────────────────────────────────────────────────────────────

  const renderStepper = () => (
    <div className="w-full">
      <div className="flex items-center justify-between md:hidden px-1 mb-4">
        <span className="text-sm text-gray-500">
          Paso {paso} de {TOTAL_STEPS}
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {STEP_LABELS[paso - 1]}
        </span>
      </div>

      <div className="md:hidden w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((paso - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>

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
                  {isCompleted ? <span>&#10003;</span> : stepNum}
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

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const missingNote = getMissingNote();
  const isLastStep = paso === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-emerald-950 flex flex-col items-center justify-start py-6 px-3 sm:py-8 sm:px-4 gap-4">
      <div className="text-center pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Generador de Porras del Mundial 2026</h1>
        <p className="text-emerald-300 text-sm mt-1">Creado por Rodrigo Silva</p>
      </div>
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col">
        <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-gray-100">
          {renderStepper()}
        </div>

        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 overflow-y-auto">
          {renderStep()}
        </div>

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
              <span />
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
