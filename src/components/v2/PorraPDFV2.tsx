// No 'use client' — only ever dynamically imported on the client.
// @react-pdf/renderer must NOT be imported at SSR time.

import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Line as SvgLine,
} from '@react-pdf/renderer';
import type {
  GruposState,
  ThirdPlaceAssignment,
  MatchId,
  QFId,
  SFSupId,
  SFInfId,
  SFId,
} from '@/types';
import {
  getR16Matches,
  getQFMatches,
  getSFSupInfMatches,
  getSFMatches,
  getFinalMatch,
  type ResolvedMatch,
} from '@/lib/bracketLogic';

// ─── Page constants ───────────────────────────────────────────────────────────

const PAGE_W = 842;
const PAGE_H = 595;

const X_R16 = 15;
const X_QF = 155;
const X_SFSI = 295;
const X_SF = 435;
const X_FINAL = 575;
const BOX_W = 115;
const BOX_H = 22;
const TEAM_H = BOX_H / 2;

const MX_R16_QF = 143;
const MX_QF_SFSI = 283;
const MX_SFSI_SF = 423;
const MX_SF_FIN = 563;

const R16_TOP_Y = [65, 93, 121, 149, 177, 205, 233, 261];
const R16_BOT_Y = [339, 367, 395, 423, 451, 479, 507, 535];
const QF_TOP_Y = [79, 135, 191, 247];
const QF_BOT_Y = [353, 409, 465, 521];
const SFSI_TOP_Y = [107, 219];
const SFSI_BOT_Y = [381, 493];
const SF1_Y = 163;
const SF2_Y = 437;
const FINAL_Y = 300;

const X_CHAMP = X_FINAL + BOX_W + 12;
const CHAMP_W = PAGE_W - X_CHAMP - 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bracketLines(
  sourceYs: number[],
  targetYs: number[],
  srcRightX: number,
  midX: number,
  tgtLeftX: number,
): Array<[number, number, number, number]> {
  const lines: Array<[number, number, number, number]> = [];
  for (let i = 0; i < targetYs.length; i++) {
    const ya = sourceYs[2 * i];
    const yb = sourceYs[2 * i + 1];
    const yc = targetYs[i];
    lines.push([srcRightX, ya, midX, ya]);
    lines.push([srcRightX, yb, midX, yb]);
    lines.push([midX, Math.min(ya, yb), midX, Math.max(ya, yb)]);
    lines.push([midX, yc, tgtLeftX, yc]);
  }
  return lines;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MatchBoxProps {
  match: ResolvedMatch;
  left: number;
  centerY: number;
}

function MatchBox({ match, left, centerY }: MatchBoxProps) {
  const winA = Boolean(match.winner && match.winner === match.teamA);
  const winB = Boolean(match.winner && match.winner === match.teamB);

  const rowStyle = (isWinner: boolean) => ({
    height: TEAM_H,
    paddingLeft: 3,
    paddingRight: 3,
    justifyContent: 'center' as const,
    backgroundColor: isWinner ? '#059669' : (winA || winB ? '#f9fafb' : '#ffffff'),
  });

  const textStyle = (isWinner: boolean) => ({
    fontSize: 6.5,
    color: isWinner ? '#ffffff' : '#1f2937',
    fontFamily: isWinner ? 'Helvetica-Bold' : 'Helvetica',
  });

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top: centerY - BOX_H / 2,
        width: BOX_W,
        height: BOX_H,
        borderWidth: 0.75,
        borderColor: '#d1d5db',
        borderStyle: 'solid',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <View style={rowStyle(winA)}>
        <Text style={textStyle(winA)}>{match.teamA ?? '---'}</Text>
      </View>
      <View style={{ height: 0.5, backgroundColor: '#e5e7eb' }} />
      <View style={rowStyle(winB)}>
        <Text style={textStyle(winB)}>{match.teamB ?? '---'}</Text>
      </View>
    </View>
  );
}

function PhaseLabel({ label, x }: { label: string; x: number }) {
  return (
    <Text
      style={{
        position: 'absolute',
        left: x,
        top: 53,
        width: BOX_W,
        textAlign: 'center',
        fontSize: 7,
        color: '#6b7280',
        fontFamily: 'Helvetica-Bold',
      }}
    >
      {label}
    </Text>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PorraPDFV2Props {
  nombre: string;
  seccion: string;
  grupos: GruposState;
  thirdPlaceAssignment: ThirdPlaceAssignment;
  r16Winners: Partial<Record<MatchId, string>>;
  r8Winners: Partial<Record<QFId, string>>;
  qfWinners: Partial<Record<SFSupId | SFInfId, string>>;
  sfWinners: Partial<Record<SFId, string>>;
  finalWinner?: string;
  /** PNG data URL of the logo, produced client-side from the SVG */
  logoDataUrl?: string;
}

// ─── Main document ────────────────────────────────────────────────────────────

export function PorraPDFV2({
  nombre,
  seccion,
  grupos,
  thirdPlaceAssignment,
  r16Winners,
  r8Winners,
  qfWinners,
  sfWinners,
  finalWinner,
  logoDataUrl,
}: PorraPDFV2Props) {
  const r16 = getR16Matches(grupos, thirdPlaceAssignment, r16Winners);
  const qf = getQFMatches(r16Winners, r8Winners);
  const sfsi = getSFSupInfMatches(r8Winners, qfWinners);
  const sf = getSFMatches(qfWinners, sfWinners);
  const [finalMatch] = getFinalMatch(sfWinners, finalWinner);

  const r16m = (id: string) => r16.find((m) => m.id === id) ?? { id, teamA: null, teamB: null };
  const qfm = (id: string) => qf.find((m) => m.id === id) ?? { id, teamA: null, teamB: null };
  const sfsim = (id: string) => sfsi.find((m) => m.id === id) ?? { id, teamA: null, teamB: null };
  const sfm = (id: string) => sf.find((m) => m.id === id) ?? { id, teamA: null, teamB: null };

  const allLines: Array<[number, number, number, number]> = [
    ...bracketLines(R16_TOP_Y, QF_TOP_Y, X_R16 + BOX_W, MX_R16_QF, X_QF),
    ...bracketLines(QF_TOP_Y, SFSI_TOP_Y, X_QF + BOX_W, MX_QF_SFSI, X_SFSI),
    ...bracketLines(SFSI_TOP_Y, [SF1_Y], X_SFSI + BOX_W, MX_SFSI_SF, X_SF),
    ...bracketLines(R16_BOT_Y, QF_BOT_Y, X_R16 + BOX_W, MX_R16_QF, X_QF),
    ...bracketLines(QF_BOT_Y, SFSI_BOT_Y, X_QF + BOX_W, MX_QF_SFSI, X_SFSI),
    ...bracketLines(SFSI_BOT_Y, [SF2_Y], X_SFSI + BOX_W, MX_SFSI_SF, X_SF),
    [X_SF + BOX_W, SF1_Y, MX_SF_FIN, SF1_Y],
    [X_SF + BOX_W, SF2_Y, MX_SF_FIN, SF2_Y],
    [MX_SF_FIN, SF1_Y, MX_SF_FIN, SF2_Y],
    [MX_SF_FIN, FINAL_Y, X_FINAL, FINAL_Y],
  ];

  const now = new Date();
  const today = now.toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) + ' · ' + now.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
  }) + 'h';

  // Logo dimensions: SVG is ~454×701 (portrait). Fit inside 30pt header height.
  const LOGO_H = 30;
  const LOGO_W = Math.round(LOGO_H * (454.57 / 701.33)); // ≈ 19pt

  return (
    <Document>
      <Page size={[PAGE_W, PAGE_H]}>
        <View style={{ position: 'relative', width: PAGE_W, height: PAGE_H }}>

          {/* ── Header ────────────────────────────────────────────────────────── */}
          <View
            style={{
              position: 'absolute',
              left: 15,
              top: 12,
              right: 15,
              height: 36,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
              borderBottomStyle: 'solid',
              paddingBottom: 6,
            }}
          >
            {/* Logo or fallback circle */}
            {logoDataUrl ? (
              <Image
                src={logoDataUrl}
                style={{ width: LOGO_W, height: LOGO_H, marginRight: 8 }}
              />
            ) : (
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: '#059669',
                  marginRight: 8,
                }}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: '#059669',
                  fontFamily: 'Helvetica-Bold',
                }}
              >
                PORRA MUNDIAL 2026
              </Text>
              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                {nombre}{'  ·  '}{seccion}{'  ·  '}{today}
              </Text>
            </View>
          </View>

          {/* ── Phase labels ──────────────────────────────────────────────────── */}
          <PhaseLabel label="1/16" x={X_R16} />
          <PhaseLabel label="1/8" x={X_QF} />
          <PhaseLabel label="1/4" x={X_SFSI} />
          <PhaseLabel label="Semis" x={X_SF} />
          <PhaseLabel label="Final" x={X_FINAL} />
          <Text
            style={{
              position: 'absolute',
              left: X_CHAMP,
              top: 53,
              width: CHAMP_W,
              textAlign: 'center',
              fontSize: 7,
              color: '#b45309',
              fontFamily: 'Helvetica-Bold',
            }}
          >
            CAMPEON
          </Text>

          {/* ── SVG bracket lines ─────────────────────────────────────────────── */}
          <Svg
            style={{ position: 'absolute', left: 0, top: 0, width: PAGE_W, height: PAGE_H }}
            viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
          >
            {allLines.map(([x1, y1, x2, y2], idx) => (
              <SvgLine key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d1d5db" strokeWidth={0.8} />
            ))}
          </Svg>

          {R16_TOP_Y.map((cy, i) => (
            <MatchBox key={`r16t${i}`} match={r16m(`R16-${i + 1}`)} left={X_R16} centerY={cy} />
          ))}
          {QF_TOP_Y.map((cy, i) => (
            <MatchBox key={`qft${i}`} match={qfm(`QF${i + 1}`)} left={X_QF} centerY={cy} />
          ))}
          {SFSI_TOP_Y.map((cy, i) => (
            <MatchBox key={`sfsit${i}`} match={sfsim(`SF-sup-${i + 1}`)} left={X_SFSI} centerY={cy} />
          ))}
          <MatchBox match={sfm('SF1')} left={X_SF} centerY={SF1_Y} />

          {R16_BOT_Y.map((cy, i) => (
            <MatchBox key={`r16b${i}`} match={r16m(`R16-${i + 9}`)} left={X_R16} centerY={cy} />
          ))}
          {QF_BOT_Y.map((cy, i) => (
            <MatchBox key={`qfb${i}`} match={qfm(`QF${i + 5}`)} left={X_QF} centerY={cy} />
          ))}
          {SFSI_BOT_Y.map((cy, i) => (
            <MatchBox key={`sfsib${i}`} match={sfsim(`SF-inf-${i + 1}`)} left={X_SFSI} centerY={cy} />
          ))}
          <MatchBox match={sfm('SF2')} left={X_SF} centerY={SF2_Y} />
          <MatchBox match={finalMatch} left={X_FINAL} centerY={FINAL_Y} />

          {/* ── Champion box ──────────────────────────────────────────────────── */}
          <View
            style={{
              position: 'absolute',
              left: X_CHAMP,
              top: FINAL_Y - 22,
              width: CHAMP_W,
              height: 44,
              borderWidth: 1.5,
              borderColor: '#f59e0b',
              borderStyle: 'solid',
              borderRadius: 4,
              backgroundColor: '#fffbeb',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 7, color: '#92400e', fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>
              CAMPEON DEL MUNDO
            </Text>
            <Text style={{ fontSize: finalWinner && finalWinner.length > 12 ? 9 : 12, color: '#059669', fontFamily: 'Helvetica-Bold' }}>
              {finalWinner ?? '---'}
            </Text>
          </View>

          <Svg
            style={{ position: 'absolute', left: 0, top: 0, width: PAGE_W, height: PAGE_H }}
            viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
          >
            <SvgLine x1={X_R16} y1={FINAL_Y} x2={X_FINAL - 5} y2={FINAL_Y} stroke="#f3f4f6" strokeWidth={0.5} />
          </Svg>

        </View>
      </Page>
    </Document>
  );
}
