'use client';

import type {
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
  R16_TO_QF,
  QF_TO_QF4,
  QF4_TO_SF,
  getR16Matches,
  getQFMatches,
  getSFSupInfMatches,
  getSFMatches,
  getFinalMatch,
} from '@/lib/bracketLogic';
import BracketMatch, { type BracketMatchData } from './BracketMatch';

// ─── Layout constants ─────────────────────────────────────────────────────────

const BRACKET_HEIGHT = 608; // 8 rows × 76px
const COL_W = 136;          // match card column width (px)
const CONN_W = 28;          // SVG connector zone width (px)
const CENTER_W = 168;       // final column width (px)

// ─── Phase colour palettes ────────────────────────────────────────────────────

const PHASE = {
  r16:   { border: 'border-blue-300',    winnerBg: 'bg-blue-100',    winnerText: 'text-blue-800',    svg: '#93c5fd' },
  r8:    { border: 'border-violet-400',  winnerBg: 'bg-violet-100',  winnerText: 'text-violet-800',  svg: '#a78bfa' },
  qf:    { border: 'border-amber-400',   winnerBg: 'bg-amber-100',   winnerText: 'text-amber-800',   svg: '#fbbf24' },
  sf:    { border: 'border-rose-400',    winnerBg: 'bg-rose-100',    winnerText: 'text-rose-800',    svg: '#fb7185' },
  final: { border: 'border-emerald-500', winnerBg: 'bg-emerald-100', winnerText: 'text-emerald-800', svg: '#34d399' },
} as const;

type Phase = keyof typeof PHASE;

// ─── Cascade winner selection ─────────────────────────────────────────────────

function applyWinner(
  phase: Phase,
  matchId: string,
  newTeam: string,
  prev: BracketState,
): BracketState {
  let s = { ...prev };

  if (phase === 'r16') {
    const id = matchId as MatchId;
    const old = s.r16[id];
    s = { ...s, r16: { ...s.r16, [id]: newTeam } };
    if (old && old !== newTeam) {
      const qfId = R16_TO_QF[id];
      if (s.r8[qfId] === old) {
        s = { ...s, r8: { ...s.r8 } }; delete (s.r8 as Record<string, unknown>)[qfId];
        const sfsiId = QF_TO_QF4[qfId];
        if (s.qf[sfsiId] === old) {
          s = { ...s, qf: { ...s.qf } }; delete (s.qf as Record<string, unknown>)[sfsiId];
          const sfId = QF4_TO_SF[sfsiId];
          if (s.sf[sfId] === old) {
            s = { ...s, sf: { ...s.sf } }; delete (s.sf as Record<string, unknown>)[sfId];
            if (s.final === old) s = { ...s, final: undefined };
          }
        }
      }
    }
  } else if (phase === 'r8') {
    const id = matchId as QFId;
    const old = s.r8[id];
    s = { ...s, r8: { ...s.r8, [id]: newTeam } };
    if (old && old !== newTeam) {
      const sfsiId = QF_TO_QF4[id];
      if (s.qf[sfsiId] === old) {
        s = { ...s, qf: { ...s.qf } }; delete (s.qf as Record<string, unknown>)[sfsiId];
        const sfId = QF4_TO_SF[sfsiId];
        if (s.sf[sfId] === old) {
          s = { ...s, sf: { ...s.sf } }; delete (s.sf as Record<string, unknown>)[sfId];
          if (s.final === old) s = { ...s, final: undefined };
        }
      }
    }
  } else if (phase === 'qf') {
    const id = matchId as SFSupId | SFInfId;
    const old = s.qf[id];
    s = { ...s, qf: { ...s.qf, [id]: newTeam } };
    if (old && old !== newTeam) {
      const sfId = QF4_TO_SF[id];
      if (s.sf[sfId] === old) {
        s = { ...s, sf: { ...s.sf } }; delete (s.sf as Record<string, unknown>)[sfId];
        if (s.final === old) s = { ...s, final: undefined };
      }
    }
  } else if (phase === 'sf') {
    const id = matchId as SFId;
    const old = s.sf[id];
    s = { ...s, sf: { ...s.sf, [id]: newTeam } };
    if (old && old !== newTeam && s.final === old) s = { ...s, final: undefined };
  } else {
    // final
    s = { ...s, final: newTeam };
  }

  return s;
}

// ─── SVG bracket connector ────────────────────────────────────────────────────
// mode='ltr': fromCount inputs on left, outputs on right (left half of bracket)
// mode='rtl': fromCount inputs on right, outputs on left (right half of bracket)

function ConnectorSVG({
  fromCount,
  toCount,
  mode,
  color,
}: {
  fromCount: number;
  toCount: number;
  mode: 'ltr' | 'rtl';
  color: string;
}) {
  const h = BRACKET_HEIGHT;
  const w = CONN_W;
  const mid = w / 2;
  const lines: React.ReactNode[] = [];

  for (let j = 0; j < toCount; j++) {
    const yOut = (j + 0.5) * (h / toCount);

    for (let k = 0; k < fromCount / toCount; k++) {
      const inputIdx = j * (fromCount / toCount) + k;
      const yIn = (inputIdx + 0.5) * (h / fromCount);
      if (mode === 'ltr') {
        lines.push(<line key={`in-${j}-${k}`} x1={0} y1={yIn} x2={mid} y2={yIn} stroke={color} strokeWidth={1.5} />);
      } else {
        lines.push(<line key={`in-${j}-${k}`} x1={mid} y1={yIn} x2={w} y2={yIn} stroke={color} strokeWidth={1.5} />);
      }
    }

    // Vertical connector between first and last input of this group
    const yFirst = (j * (fromCount / toCount) + 0.5) * (h / fromCount);
    const yLast  = ((j + 1) * (fromCount / toCount) - 0.5) * (h / fromCount);
    if (Math.abs(yFirst - yLast) > 1) {
      lines.push(<line key={`v-${j}`} x1={mid} y1={yFirst} x2={mid} y2={yLast} stroke={color} strokeWidth={1.5} />);
    }

    // Output horizontal to the next column
    if (mode === 'ltr') {
      lines.push(<line key={`out-${j}`} x1={mid} y1={yOut} x2={w} y2={yOut} stroke={color} strokeWidth={1.5} />);
    } else {
      lines.push(<line key={`out-${j}`} x1={0} y1={yOut} x2={mid} y2={yOut} stroke={color} strokeWidth={1.5} />);
    }
  }

  return (
    <svg width={w} height={h} style={{ display: 'block', flexShrink: 0 }}>
      {lines}
    </svg>
  );
}

// ─── Column of matches ────────────────────────────────────────────────────────

function BracketColumn({
  matches,
  phase,
  onSelect,
}: {
  matches: BracketMatchData[];
  phase: Phase;
  onSelect: (matchId: string, team: string) => void;
}) {
  const p = PHASE[phase];
  const slotH = BRACKET_HEIGHT / matches.length;

  return (
    <div style={{ width: COL_W, height: BRACKET_HEIGHT, flexShrink: 0 }}>
      {matches.map((m, i) => (
        <div
          key={m.id}
          style={{ height: slotH }}
          className="flex items-center justify-center"
        >
          <BracketMatch
            match={m}
            onSelect={onSelect}
            borderClass={p.border}
            winnerBgClass={p.winnerBg}
            winnerTextClass={p.winnerText}
            width={COL_W - 4}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  grupos: GruposState;
  thirdPlaceAssignment: ThirdPlaceAssignment;
  bracket: BracketState;
  onChange: (bracket: BracketState) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InteractiveBracket({ grupos, thirdPlaceAssignment, bracket, onChange }: Props) {
  function select(phase: Phase) {
    return (matchId: string, team: string) =>
      onChange(applyWinner(phase, matchId, team, bracket));
  }

  // Resolve all matches from bracket state
  const r16All    = getR16Matches(grupos, thirdPlaceAssignment, bracket.r16);
  const r8All     = getQFMatches(bracket.r16, bracket.r8);
  const qfAll     = getSFSupInfMatches(bracket.r8, bracket.qf);
  const sfAll     = getSFMatches(bracket.qf, bracket.sf);
  const finalAll  = getFinalMatch(bracket.sf, bracket.final);

  // Split into top (cols 1-4) and bottom (cols 6-9) halves
  const r16Top  = r16All.slice(0, 8)  as BracketMatchData[];
  const r16Bot  = r16All.slice(8, 16) as BracketMatchData[];
  const r8Top   = r8All.slice(0, 4)   as BracketMatchData[];
  const r8Bot   = r8All.slice(4, 8)   as BracketMatchData[];
  const qfTop   = qfAll.slice(0, 2)   as BracketMatchData[];
  const qfBot   = qfAll.slice(2, 4)   as BracketMatchData[];
  const sf1     = sfAll.slice(0, 1)   as BracketMatchData[];
  const sf2     = sfAll.slice(1, 2)   as BracketMatchData[];
  const final   = finalAll             as BracketMatchData[];

  const champion = bracket.final;

  return (
    <div className="flex flex-col gap-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs font-medium">
        {([['r16','1/16'], ['r8','1/8'], ['qf','1/4'], ['sf','Semi'], ['final','Final']] as [Phase, string][]).map(([ph, label]) => (
          <span key={ph} className={`px-2 py-0.5 rounded-full border ${PHASE[ph].border} ${PHASE[ph].winnerBg} ${PHASE[ph].winnerText}`}>
            {label}
          </span>
        ))}
        <span className="text-gray-400 ml-1">— Haz clic en un equipo para hacerlo avanzar</span>
      </div>

      {/* Bracket */}
      <div className="overflow-x-auto pb-2">
        <div
          className="flex items-stretch mx-auto"
          style={{ width: 4 * COL_W + 4 * CONN_W + CENTER_W + 4 * CONN_W + 4 * COL_W, minWidth: 'max-content' }}
        >
          {/* ── LEFT HALF ─────────────────────────────────────────────────── */}

          {/* Col 1: 1/16 sup */}
          <BracketColumn matches={r16Top} phase="r16" onSelect={select('r16')} />
          <ConnectorSVG fromCount={8} toCount={4} mode="ltr" color={PHASE.r8.svg} />

          {/* Col 2: 1/8 sup */}
          <BracketColumn matches={r8Top} phase="r8" onSelect={select('r8')} />
          <ConnectorSVG fromCount={4} toCount={2} mode="ltr" color={PHASE.qf.svg} />

          {/* Col 3: 1/4 sup */}
          <BracketColumn matches={qfTop} phase="qf" onSelect={select('qf')} />
          <ConnectorSVG fromCount={2} toCount={1} mode="ltr" color={PHASE.sf.svg} />

          {/* Col 4: Semifinal 1 */}
          <BracketColumn matches={sf1} phase="sf" onSelect={select('sf')} />
          <ConnectorSVG fromCount={1} toCount={1} mode="ltr" color={PHASE.final.svg} />

          {/* ── CENTER ────────────────────────────────────────────────────── */}
          <div style={{ width: CENTER_W, height: BRACKET_HEIGHT, flexShrink: 0 }} className="flex flex-col items-center justify-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Final</p>
            <BracketMatch
              match={final[0]}
              onSelect={select('final')}
              borderClass={PHASE.final.border}
              winnerBgClass={PHASE.final.winnerBg}
              winnerTextClass={PHASE.final.winnerText}
              width={CENTER_W - 8}
            />
            {champion ? (
              <div className="flex flex-col items-center gap-1 text-center mt-1">
                <span className="text-2xl">&#127942;</span>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Campeón</span>
                <span className="text-sm font-extrabold text-amber-900 leading-tight">{champion}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center mt-1 opacity-40">
                <span className="text-2xl">&#127942;</span>
                <span className="text-[10px] text-gray-400">Pendiente</span>
              </div>
            )}
          </div>

          {/* ── RIGHT HALF ────────────────────────────────────────────────── */}

          {/* Col 6 connector: Final → SF2 */}
          <ConnectorSVG fromCount={1} toCount={1} mode="rtl" color={PHASE.final.svg} />

          {/* Col 6: Semifinal 2 */}
          <BracketColumn matches={sf2} phase="sf" onSelect={select('sf')} />
          <ConnectorSVG fromCount={2} toCount={1} mode="rtl" color={PHASE.sf.svg} />

          {/* Col 7: 1/4 inf */}
          <BracketColumn matches={qfBot} phase="qf" onSelect={select('qf')} />
          <ConnectorSVG fromCount={4} toCount={2} mode="rtl" color={PHASE.qf.svg} />

          {/* Col 8: 1/8 inf */}
          <BracketColumn matches={r8Bot} phase="r8" onSelect={select('r8')} />
          <ConnectorSVG fromCount={8} toCount={4} mode="rtl" color={PHASE.r8.svg} />

          {/* Col 9: 1/16 inf */}
          <BracketColumn matches={r16Bot} phase="r16" onSelect={select('r16')} />
        </div>
      </div>

      {/* Mobile hint */}
      <p className="md:hidden text-center text-xs text-gray-400">
        ← Desliza horizontalmente para ver el bracket completo →
      </p>
    </div>
  );
}
