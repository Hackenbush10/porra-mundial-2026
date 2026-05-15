'use client';

import { useEffect, useState, useDeferredValue, useCallback } from 'react';
import { assignThirdPlaces } from '@/lib/thirdPlace';
import type {
  GroupLetter,
  GruposState,
  MatchId,
  QFId,
  SFSupId,
  SFInfId,
  SFId,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BracketData {
  r16: Partial<Record<string, string>>;
  r8: Partial<Record<string, string>>;
  qf: Partial<Record<string, string>>;
  sf: Partial<Record<string, string>>;
  final?: string;
}

interface ApuestaRow {
  id: string;
  nombre: string;
  seccion: string;
  campeon: string;
  created_at: string;
  grupos: GruposState;
  mejores_terceros: GroupLetter[];
  bracket: BracketData;
}

// ─── SVG → PNG helper (canvas) ────────────────────────────────────────────────

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
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('SVG load failed')); };
    img.src = objectUrl;
  });
}

// ─── PDF download for a single row ───────────────────────────────────────────

async function downloadRowPdf(row: ApuestaRow): Promise<void> {
  const thirdPlaceAssignment = assignThirdPlaces(row.mejores_terceros);
  if (!thirdPlaceAssignment) throw new Error('No se pudo calcular la asignación de terceros');

  let logoDataUrl: string | undefined;
  try { logoDataUrl = await svgToPng('/logo-mundial-2026.svg', 200, 310); } catch { /* non-fatal */ }

  const [{ pdf }, { PorraPDFV2 }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/v2/PorraPDFV2'),
  ]);

  const doc = PorraPDFV2({
    nombre: row.nombre,
    seccion: row.seccion,
    grupos: row.grupos,
    thirdPlaceAssignment,
    r16Winners: row.bracket.r16 as Partial<Record<MatchId, string>>,
    r8Winners: row.bracket.r8 as Partial<Record<QFId, string>>,
    qfWinners: row.bracket.qf as Partial<Record<SFSupId | SFInfId, string>>,
    sfWinners: row.bracket.sf as Partial<Record<SFId, string>>,
    finalWinner: row.bracket.final,
    logoDataUrl,
  });

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `porra-${row.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Sort types ──────────────────────────────────────────────────────────────

type SortKey = 'index' | 'nombre' | 'seccion' | 'campeon' | 'created_at';
type SortDir = 'asc' | 'desc';

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [apuestas, setApuestas] = useState<ApuestaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfErrors, setPdfErrors] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    fetch('/api/apuestas')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ apuestas: ApuestaRow[] }>;
      })
      .then(({ apuestas: rows }) => setApuestas(rows))
      .catch((err: unknown) => setFetchError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else { setSortDir('asc'); }
      return key;
    });
  }, []);

  const filtered = deferredSearch.trim()
    ? apuestas.filter((a) =>
        a.nombre.toLowerCase().includes(deferredSearch.trim().toLowerCase()),
      )
    : apuestas;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'index') {
      // index is position in the filtered array — already stable, no-op sort
      cmp = 0;
    } else if (sortKey === 'created_at') {
      cmp = a.created_at.localeCompare(b.created_at);
    } else {
      cmp = a[sortKey].localeCompare(b[sortKey], 'es', { sensitivity: 'base' });
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleDownload = async (row: ApuestaRow) => {
    setDownloadingId(row.id);
    setPdfErrors((prev) => { const next = { ...prev }; delete next[row.id]; return next; });
    try {
      await downloadRowPdf(row);
    } catch (err) {
      setPdfErrors((prev) => ({
        ...prev,
        [row.id]: err instanceof Error ? err.message : 'Error al generar el PDF',
      }));
    }
    setDownloadingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apuestas — Admin</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Cargando…' : `${apuestas.length} apuesta${apuestas.length !== 1 ? 's' : ''} guardada${apuestas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <span className="text-3xl">&#9917;</span>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">&#128269;</span>
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-12 justify-center">
            <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Cargando apuestas…
          </div>
        )}

        {!loading && fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            Error al cargar las apuestas: {fetchError}
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && (
          filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">
              {search ? `Sin resultados para "${search}"` : 'No hay apuestas todavía.'}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {(
                        [
                          { key: 'index', label: '#' },
                          { key: 'nombre', label: 'Nombre' },
                          { key: 'seccion', label: 'Sección' },
                          { key: 'campeon', label: 'Campeón' },
                          { key: 'created_at', label: 'Fecha' },
                        ] as { key: SortKey; label: string }[]
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap cursor-pointer select-none hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {sortKey === key ? (
                              <span className="text-emerald-600">{sortDir === 'asc' ? '▲' : '▼'}</span>
                            ) : (
                              <span className="text-gray-300">▼</span>
                            )}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.map((row, i) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.nombre}</td>
                        <td className="px-4 py-3 text-gray-600">{row.seccion}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-xs">
                            <span>&#127942;</span>
                            {row.campeon}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handleDownload(row)}
                              disabled={downloadingId === row.id}
                              className={[
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                                downloadingId === row.id
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer',
                              ].join(' ')}
                            >
                              {downloadingId === row.id ? (
                                <>
                                  <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                  Generando…
                                </>
                              ) : (
                                <><span>&#128196;</span>Descargar PDF</>
                              )}
                            </button>
                            {pdfErrors[row.id] && (
                              <p className="text-xs text-red-500 max-w-36 text-right">{pdfErrors[row.id]}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
