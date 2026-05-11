'use client';

import { useState } from 'react';
import type {
  GroupLetter,
  GruposState,
  ThirdPlaceAssignment,
  BracketState,
} from '@/types';
import { GROUP_LETTERS } from '@/lib/data';
import {
  getR16Matches,
  getQFMatches,
  getSFSupInfMatches,
  getSFMatches,
  getFinalMatch,
  type ResolvedMatch,
} from '@/lib/bracketLogic';

// ─── Convert SVG URL → PNG data URL using the browser canvas ─────────────────

async function svgToPng(svgUrl: string, w: number, h: number): Promise<string> {
  const resp = await fetch(svgUrl);
  const svgText = await resp.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('canvas ctx null')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('SVG image load failed')); };
    img.src = objectUrl;
  });
}

// ─── UI helpers (identical to BracketPreview) ─────────────────────────────────

function MatchRow({ match }: { match: ResolvedMatch }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
      <span className={['flex-1 truncate', match.winner === match.teamA ? 'font-semibold text-emerald-700' : 'text-gray-500'].join(' ')}>
        {match.teamA ?? '—'}
      </span>
      <span className="text-gray-400 text-xs flex-shrink-0">vs</span>
      <span className={['flex-1 truncate text-right', match.winner === match.teamB ? 'font-semibold text-emerald-700' : 'text-gray-500'].join(' ')}>
        {match.teamB ?? '—'}
      </span>
    </div>
  );
}

function PhaseSection({ title, matches, cols = 2 }: { title: string; matches: ResolvedMatch[]; cols?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
      <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {matches.map((m) => (
          <div key={m.id} className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 font-mono mb-1">{m.id}</p>
            <MatchRow match={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  nombre: string;
  seccion: string;
  grupos: GruposState;
  mejoresTerceros: GroupLetter[];
  thirdPlaceAssignment: ThirdPlaceAssignment | null;
  bracket: BracketState;
  onReset?: () => void;
}

// 'idle'          → nothing attempted yet
// 'busy'          → request in flight
// 'saved_ok'      → Supabase ok + PDF ok
// 'saved_pdf_fail'→ Supabase ok, PDF failed (don't re-save)
// 'save_fail'     → Supabase failed (retry everything)
type SaveStatus = 'idle' | 'busy' | 'saved_ok' | 'saved_pdf_fail' | 'save_fail';

// ─── Main component ───────────────────────────────────────────────────────────

export default function BracketPreviewV2({
  nombre,
  seccion,
  grupos,
  mejoresTerceros,
  thirdPlaceAssignment,
  bracket,
  onReset,
}: Props) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const generatePdf = async (logoDataUrl?: string) => {
    if (!thirdPlaceAssignment || !bracket.final) return;
    const [{ pdf }, { PorraPDFV2 }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('./PorraPDFV2'),
    ]);
    const doc = PorraPDFV2({
      nombre,
      seccion,
      grupos,
      thirdPlaceAssignment,
      r16Winners: bracket.r16,
      r8Winners: bracket.r8,
      qfWinners: bracket.qf,
      sfWinners: bracket.sf,
      finalWinner: bracket.final,
      logoDataUrl,
    });
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `porra-mundial-${nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchLogo = async () => {
    try { return await svgToPng('/logo-mundial-2026.svg', 200, 310); } catch { return undefined; }
  };

  const handleSaveAll = async () => {
    if (!thirdPlaceAssignment || !bracket.final) return;
    setStatus('busy');
    setPdfError(null);
    setSaveError(null);

    // 1. Save to Supabase first
    try {
      const res = await fetch('/api/apuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          seccion,
          grupos,
          mejores_terceros: mejoresTerceros,
          bracket: { r16: bracket.r16, r8: bracket.r8, qf: bracket.qf, sf: bracket.sf, final: bracket.final },
          campeon: bracket.final,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Error guardando apuesta:', err);
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la apuesta.');
      setStatus('save_fail');
      return;
    }

    // 2. Generate PDF (Supabase already saved — failure here is recoverable)
    const logoDataUrl = await fetchLogo();
    try {
      await generatePdf(logoDataUrl);
      setStatus('saved_ok');
    } catch (err) {
      console.error('Error generando PDF:', err);
      setPdfError('No se pudo generar el PDF. Inténtalo de nuevo.');
      setStatus('saved_pdf_fail');
    }
  };

  const handlePdfOnly = async () => {
    setStatus('busy');
    setPdfError(null);
    const logoDataUrl = await fetchLogo();
    try {
      await generatePdf(logoDataUrl);
      setStatus('saved_ok');
    } catch (err) {
      console.error('Error generando PDF:', err);
      setPdfError('No se pudo generar el PDF. Inténtalo de nuevo.');
      setStatus('saved_pdf_fail');
    }
  };

  const r16Matches = getR16Matches(grupos, thirdPlaceAssignment, bracket.r16);
  const qfMatches = getQFMatches(bracket.r16, bracket.r8);
  const sfSupInfMatches = getSFSupInfMatches(bracket.r8, bracket.qf);
  const sfMatches = getSFMatches(bracket.qf, bracket.sf);
  const finalMatch = getFinalMatch(bracket.sf, bracket.final);
  const champion = bracket.final;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">&#9917;</span>
          <div>
            <h2 className="text-xl font-bold">Porra Mundial 2026</h2>
            <p className="text-emerald-200 text-sm">Resumen de tu apuesta</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-emerald-300 text-xs uppercase tracking-wide">Nombre</p>
            <p className="font-semibold">{nombre || '—'}</p>
          </div>
          <div>
            <p className="text-emerald-300 text-xs uppercase tracking-wide">Sección</p>
            <p className="font-semibold">{seccion || '—'}</p>
          </div>
        </div>
      </div>

      {/* Fase de Grupos */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Fase de Grupos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 text-xs text-gray-500 uppercase tracking-wide font-medium">Grupo</th>
                <th className="text-left px-3 py-2 text-xs text-emerald-700 uppercase tracking-wide font-medium">1º</th>
                <th className="text-left px-3 py-2 text-xs text-emerald-600 uppercase tracking-wide font-medium">2º</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 uppercase tracking-wide font-medium">3º</th>
                <th className="text-left px-3 py-2 text-xs text-gray-400 uppercase tracking-wide font-medium">4º</th>
              </tr>
            </thead>
            <tbody>
              {GROUP_LETTERS.map((g) => {
                const s = grupos[g];
                return (
                  <tr key={g} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-semibold text-gray-700">{g}</td>
                    <td className="px-3 py-2 text-emerald-700 font-medium">{s?.[1] ?? '—'}</td>
                    <td className="px-3 py-2 text-emerald-600">{s?.[2] ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{s?.[3] ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-400">{s?.[4] ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bracket */}
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Fase final</h2>
        <PhaseSection title="1/16 — Dieciseisavos" matches={r16Matches} cols={2} />
        <PhaseSection title="1/8 — Octavos" matches={qfMatches} cols={2} />
        <PhaseSection title="1/4 — Cuartos" matches={sfSupInfMatches} cols={2} />
        <PhaseSection title="Semifinales" matches={sfMatches} cols={2} />
        <PhaseSection title="Gran Final" matches={finalMatch} cols={1} />
      </div>

      {/* Champion */}
      {champion ? (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-center shadow-lg">
          <div className="text-5xl mb-3">&#127942;</div>
          <p className="text-amber-900 text-sm font-medium uppercase tracking-widest mb-1">Tu campeón del mundo</p>
          <p className="text-3xl font-extrabold text-amber-950">{champion}</p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
          <div className="text-4xl mb-2 opacity-40">&#127942;</div>
          <p className="text-gray-400 text-sm">Completa el bracket para ver tu campeón</p>
        </div>
      )}

      {/* PDF download */}
      <div className="flex flex-col items-center gap-3">
        {/* Primary action button */}
        {(() => {
          const savedOk = status === 'saved_ok' || status === 'saved_pdf_fail';
          const busy = status === 'busy';
          if (!savedOk) {
            return (
              <button
                onClick={handleSaveAll}
                disabled={busy || !bracket.final}
                className={[
                  'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all shadow',
                  bracket.final && !busy
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {busy ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando…</>
                ) : (
                  <><span>&#128196;</span>Guardar apuesta y generar PDF</>
                )}
              </button>
            );
          }
          return (
            <button
              onClick={handlePdfOnly}
              disabled={busy}
              className={[
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all shadow',
                !busy
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ].join(' ')}
            >
              {busy ? (
                <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando PDF…</>
              ) : status === 'saved_pdf_fail' ? (
                <><span>&#128196;</span>Reintentar descarga PDF</>
              ) : (
                <><span>&#128196;</span>Descargar PDF de nuevo</>
              )}
            </button>
          );
        })()}

        {/* Status messages */}
        {!bracket.final && status === 'idle' && (
          <p className="text-xs text-gray-400">Completa el bracket para descargar el PDF</p>
        )}
        {status === 'saved_ok' && (
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span>&#10003;</span> Apuesta guardada correctamente
          </p>
        )}
        {status === 'save_fail' && saveError && (
          <p className="text-xs text-red-500">Error al guardar: {saveError}</p>
        )}
        {(status === 'saved_pdf_fail') && pdfError && (
          <p className="text-xs text-red-500">{pdfError}</p>
        )}
        {status === 'saved_pdf_fail' && (
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <span>&#10003;</span> Apuesta guardada — solo faltó el PDF
          </p>
        )}

        {/* Secondary: create new */}
        {onReset && (status === 'saved_ok' || status === 'saved_pdf_fail') && (
          <button
            onClick={onReset}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Crear nueva porra
          </button>
        )}
      </div>
    </div>
  );
}
