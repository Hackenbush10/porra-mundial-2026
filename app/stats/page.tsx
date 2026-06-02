'use client';

import { useEffect, useState } from 'react';

// ── Flag map ──────────────────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  Alemania: '🇩🇪', 'Arabia Saudí': '🇸🇦', Argentina: '🇦🇷',
  Australia: '🇦🇺', Bélgica: '🇧🇪', Bolivia: '🇧🇴',
  Brasil: '🇧🇷', Camerún: '🇨🇲', Canadá: '🇨🇦',
  Chile: '🇨🇱', Colombia: '🇨🇴', 'Corea del Sur': '🇰🇷',
  'Costa Rica': '🇨🇷', Croacia: '🇭🇷', Dinamarca: '🇩🇰',
  Ecuador: '🇪🇨', Egipto: '🇪🇬', Escocia: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Eslovenia: '🇸🇮', España: '🇪🇸', 'Estados Unidos': '🇺🇸',
  Francia: '🇫🇷', Gales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', Ghana: '🇬🇭',
  Honduras: '🇭🇳', Hungría: '🇭🇺', Indonesia: '🇮🇩',
  Inglaterra: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Irán: '🇮🇷', Irlanda: '🇮🇪',
  Israel: '🇮🇱', Italia: '🇮🇹', Jamaica: '🇯🇲',
  Japón: '🇯🇵', Mali: '🇲🇱', Marruecos: '🇲🇦',
  México: '🇲🇽', Nigeria: '🇳🇬', Noruega: '🇳🇴',
  'Nueva Zelanda': '🇳🇿', 'Países Bajos': '🇳🇱', Panamá: '🇵🇦',
  Paraguay: '🇵🇾', Perú: '🇵🇪', Polonia: '🇵🇱',
  Portugal: '🇵🇹', Qatar: '🇶🇦', 'República Checa': '🇨🇿',
  Rumanía: '🇷🇴', Rusia: '🇷🇺', Senegal: '🇸🇳',
  Serbia: '🇷🇸', Sudáfrica: '🇿🇦', Suecia: '🇸🇪',
  Suiza: '🇨🇭', 'Trinidad y Tobago': '🇹🇹', Turquía: '🇹🇷',
  Ucrania: '🇺🇦', Uruguay: '🇺🇾', Venezuela: '🇻🇪',
};

function flag(country: string): string {
  return FLAG_MAP[country] ?? '🏳️';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Apuesta {
  nombre: string;
  seccion: string;
  campeon: string;
  created_at: string;
}

interface StatsData {
  pagadas: Apuesta[];
  totalRegistros: number;
}

// ── Derived computations ──────────────────────────────────────────────────────

function computeStats(data: StatsData) {
  const { pagadas, totalRegistros } = data;
  const nPagados = pagadas.length;
  const nNoPagados = totalRegistros - nPagados;
  const bote = nPagados * 10;

  // Campeón ranking
  const campeonCount: Record<string, number> = {};
  for (const a of pagadas) {
    campeonCount[a.campeon] = (campeonCount[a.campeon] ?? 0) + 1;
  }
  const campeonRanking = Object.entries(campeonCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: nPagados > 0 ? (count / nPagados) * 100 : 0 }));

  // Sección ranking
  const seccionCount: Record<string, number> = {};
  for (const a of pagadas) {
    seccionCount[a.seccion] = (seccionCount[a.seccion] ?? 0) + 1;
  }
  const seccionRanking = Object.entries(seccionCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Dates
  const dates = pagadas.map((a) => new Date(a.created_at));
  const firstDate = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
  const lastDate = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;

  // Original selections (all with the minimum vote count)
  const minVotes = campeonRanking.length ? campeonRanking[campeonRanking.length - 1].count : 0;
  const leastVoted = campeonRanking.filter((c) => c.count === minVotes);
  const distinctCount = campeonRanking.length;

  return {
    nPagados,
    nNoPagados,
    bote,
    campeonRanking,
    seccionRanking,
    firstDate,
    lastDate,
    leastVoted,
    minVotes,
    distinctCount,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eur(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<StatsData>;
      })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="stats-loading">
          <div className="stats-spinner" />
          <p>Cargando estadísticas…</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <style>{css}</style>
        <div className="stats-loading">
          <p className="stats-error-msg">Error al cargar los datos: {error}</p>
        </div>
      </>
    );
  }

  const stats = computeStats(data);
  const maxCampeonCount = stats.campeonRanking[0]?.count ?? 1;
  const maxSeccionCount = stats.seccionRanking[0]?.count ?? 1;

  return (
    <>
      <style>{css}</style>
      <div className="stats-page">

        {/* Header */}
        <header className="stats-header">
          <div>
            <h1 className="stats-title">Estadísticas de la Porra ⚽</h1>
            <p className="stats-subtitle">Mundial 2026 · El País</p>
          </div>
        </header>

        {/* ── 1. Resumen económico ────────────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="stats-section-title">💰 Resumen económico</h2>
          <div className="stats-cards">
            <div className="stats-card">
              <span className="stats-card-label">Participantes</span>
              <span className="stats-card-value">{stats.nPagados}</span>
            </div>
            <div className="stats-card stats-card-highlight">
              <span className="stats-card-label">Bote total</span>
              <span className="stats-card-value">{eur(stats.bote)}</span>
            </div>
          </div>

          <div className="stats-prizes">
            <div className="stats-prize">
              <span className="stats-prize-medal">🥇</span>
              <div>
                <div className="stats-prize-label">1.º premio</div>
                <div className="stats-prize-amount">{eur(Math.round(stats.bote * 0.5))}</div>
                <div className="stats-prize-pct">50% del bote</div>
              </div>
            </div>
            <div className="stats-prize">
              <span className="stats-prize-medal">🥈</span>
              <div>
                <div className="stats-prize-label">2.º premio</div>
                <div className="stats-prize-amount">{eur(Math.round(stats.bote * 0.3))}</div>
                <div className="stats-prize-pct">30% del bote</div>
              </div>
            </div>
            <div className="stats-prize">
              <span className="stats-prize-medal">🥉</span>
              <div>
                <div className="stats-prize-label">3.º premio</div>
                <div className="stats-prize-amount">{eur(Math.round(stats.bote * 0.2))}</div>
                <div className="stats-prize-pct">20% del bote</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Campeones más votados ────────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="stats-section-title">🏆 Campeones más votados</h2>
          <p className="stats-section-sub">{stats.distinctCount} selecciones distintas entre {stats.nPagados} participantes</p>
          <div className="stats-campeon-list">
            {stats.campeonRanking.map((item, i) => (
              <div key={item.name} className="stats-campeon-row">
                <div className="stats-campeon-top">
                  <span className="stats-campeon-rank">{i + 1}</span>
                  <span className="stats-campeon-flag">{flag(item.name)}</span>
                  <span className="stats-campeon-name">{item.name}</span>
                  <span className="stats-campeon-count">{item.count} votos</span>
                  <span className="stats-campeon-pct">{item.pct.toFixed(1)}%</span>
                </div>
                <div className="stats-campeon-bar-wrap">
                  <div
                    className="stats-campeon-bar"
                    style={{ width: `${(item.count / maxCampeonCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Ranking por secciones ────────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="stats-section-title">🏢 Participantes por sección</h2>
          <div className="stats-seccion-list">
            {stats.seccionRanking.map((item) => (
              <div key={item.name} className="stats-seccion-row">
                <span className="stats-seccion-name">{item.name}</span>
                <div className="stats-seccion-bar-wrap">
                  <div
                    className="stats-seccion-bar"
                    style={{ width: `${(item.count / maxSeccionCount) * 100}%` }}
                  />
                </div>
                <span className="stats-seccion-count">{item.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Listado de participantes ─────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="stats-section-title">👥 Participantes ({stats.nPagados})</h2>
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sección</th>
                  <th>Campeón</th>
                </tr>
              </thead>
              <tbody>
                {data.pagadas.map((a, i) => (
                  <tr key={`${a.nombre}-${i}`}>
                    <td className="td-nombre">{a.nombre}</td>
                    <td className="td-seccion">{a.seccion}</td>
                    <td className="td-campeon">
                      <span>{flag(a.campeon)}</span>
                      {a.campeon}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 5. Datos extra ──────────────────────────────────────────────── */}
        <section className="stats-section">
          <h2 className="stats-section-title">📊 Datos extra</h2>
          <div className="stats-extras">
            {stats.firstDate && (
              <div className="stats-extra-item">
                <span className="stats-extra-icon">🕐</span>
                <div>
                  <div className="stats-extra-label">Primera apuesta</div>
                  <div className="stats-extra-value">{formatDate(stats.firstDate)}</div>
                </div>
              </div>
            )}
            {stats.lastDate && (
              <div className="stats-extra-item">
                <span className="stats-extra-icon">🕐</span>
                <div>
                  <div className="stats-extra-label">Última apuesta</div>
                  <div className="stats-extra-value">{formatDate(stats.lastDate)}</div>
                </div>
              </div>
            )}
            <div className="stats-extra-item">
              <span className="stats-extra-icon">🎯</span>
              <div>
                <div className="stats-extra-label">Campeones distintos elegidos</div>
                <div className="stats-extra-value">{stats.distinctCount}</div>
              </div>
            </div>
            {stats.leastVoted.length > 0 && stats.minVotes < (stats.campeonRanking[0]?.count ?? 0) && (
              <div className="stats-extra-item">
                <span className="stats-extra-icon">💎</span>
                <div>
                  <div className="stats-extra-label">Apuesta más original</div>
                  <div className="stats-extra-value" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {stats.leastVoted.map((c) => (
                      <span key={c.name}>
                        {flag(c.name)} {c.name}{' '}
                        <span className="stats-extra-note">
                          ({c.count} voto{c.count !== 1 ? 's' : ''})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="stats-footer">
          Porra Mundial 2026 · El País · <a href="mailto:rsilva@elpais.es">Rodrigo Silva</a>
        </footer>
      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

@keyframes spin { to { transform: rotate(360deg); } }

*, *::before, *::after { box-sizing: border-box; }

.stats-page {
  font-family: 'DM Sans', system-ui, sans-serif;
  background-color: #0f1117;
  color: #e4e4e7;
  min-height: 100vh;
  padding: 32px 20px 48px;
  max-width: 860px;
  margin: 0 auto;
}

.stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 16px;
  font-family: 'DM Sans', system-ui, sans-serif;
  background-color: #0f1117;
  color: #8b8d98;
  font-size: 14px;
}

.stats-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #2a2d3a;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.stats-error-msg {
  color: #f87171;
  font-size: 14px;
}

/* Header */
.stats-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.stats-subtitle {
  font-size: 13px;
  color: #8b8d98;
  margin: 4px 0 0;
}

.stats-back-link {
  font-size: 13px;
  color: #22c55e;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  padding: 6px 12px;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  background-color: #1a1d27;
  transition: border-color 0.2s;
}
.stats-back-link:hover { border-color: #22c55e; }

/* Notice */
.stats-notice {
  background-color: #2d2007;
  color: #fbbf24;
  border: 1px solid #4a3a10;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 20px;
}

/* Sections */
.stats-section {
  background-color: #1a1d27;
  border: 1px solid #2a2d3a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.stats-section-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.stats-section-sub {
  font-size: 12px;
  color: #8b8d98;
  margin: 0 0 16px;
}

/* Cards */
.stats-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stats-card {
  flex: 1;
  min-width: 130px;
  background-color: #13151d;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-card-highlight {
  border-color: #166534;
  background-color: #052e16;
}

.stats-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8b8d98;
}

.stats-card-value {
  font-size: 26px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #e4e4e7;
  letter-spacing: -0.02em;
}

.stats-card-highlight .stats-card-value { color: #4ade80; }

/* Prizes */
.stats-prizes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-prize {
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #13151d;
  border: 1px solid #2a2d3a;
  border-radius: 10px;
  padding: 12px 14px;
}

.stats-prize-medal { font-size: 24px; flex-shrink: 0; }

.stats-prize-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b8d98;
  margin-bottom: 2px;
}

.stats-prize-amount {
  font-size: 20px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: #fbbf24;
}

.stats-prize-pct {
  font-size: 11px;
  color: #6b7280;
  margin-top: 1px;
}

/* Campeón ranking */
.stats-campeon-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 16px;
}

.stats-campeon-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 0;
  border-bottom: 1px solid #2a2d3a;
}
.stats-campeon-row:last-child { border-bottom: none; }

.stats-campeon-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-campeon-rank {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #6b7280;
  width: 16px;
  flex-shrink: 0;
  text-align: right;
}

.stats-campeon-flag { font-size: 20px; flex-shrink: 0; }

.stats-campeon-name {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
}

.stats-campeon-bar-wrap {
  height: 14px;
  background-color: #2a2d3a;
  border-radius: 7px;
  overflow: hidden;
}

.stats-campeon-bar {
  height: 100%;
  background: linear-gradient(90deg, #166534, #22c55e);
  border-radius: 7px;
  transition: width 0.5s ease;
  min-width: 6px;
}

.stats-campeon-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #e4e4e7;
  margin-left: auto;
  flex-shrink: 0;
}

.stats-campeon-pct {
  font-size: 12px;
  color: #8b8d98;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
  width: 48px;
  text-align: right;
}

/* Sección ranking */
.stats-seccion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.stats-seccion-row {
  display: grid;
  grid-template-columns: 160px 1fr 40px;
  align-items: center;
  gap: 10px;
}

.stats-seccion-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #d1d5db;
}

.stats-seccion-bar-wrap {
  height: 12px;
  background-color: #2a2d3a;
  border-radius: 6px;
  overflow: hidden;
}

.stats-seccion-bar {
  height: 100%;
  background: linear-gradient(90deg, #1d4ed8, #60a5fa);
  border-radius: 6px;
  transition: width 0.4s ease;
  min-width: 6px;
}

.stats-seccion-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #e4e4e7;
  text-align: right;
}

/* Table */
.stats-table-wrap {
  overflow: auto;
  max-height: 480px;
  border-radius: 8px;
  border: 1px solid #2a2d3a;
  margin-top: 16px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.stats-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.stats-table th {
  background-color: #13151d;
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8b8d98;
  border-bottom: 1px solid #2a2d3a;
  white-space: nowrap;
}

.stats-table tbody tr:nth-child(even) { background-color: #13151d; }
.stats-table tbody tr:nth-child(odd) { background-color: #181b25; }
.stats-table tbody tr:hover { background-color: #1e2130; }

.stats-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #1e2130;
}

.td-nombre { font-weight: 500; color: #e4e4e7; }
.td-seccion { color: #8b8d98; }
.td-campeon { display: flex; align-items: center; gap: 6px; color: #d1d5db; }

/* Extras */
.stats-extras {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.stats-extra-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: #13151d;
  border: 1px solid #2a2d3a;
  border-radius: 8px;
  padding: 12px 14px;
}

.stats-extra-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }

.stats-extra-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8b8d98;
  margin-bottom: 3px;
}

.stats-extra-value {
  font-size: 14px;
  font-weight: 500;
  color: #e4e4e7;
}

.stats-extra-note {
  font-size: 12px;
  color: #8b8d98;
  font-weight: 400;
}

/* Footer */
.stats-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  padding-top: 20px;
  border-top: 1px solid #2a2d3a;
}

.stats-footer a { color: #22c55e; text-decoration: none; }
.stats-footer a:hover { text-decoration: underline; }

/* Mobile */
@media (max-width: 600px) {
  .stats-page { padding: 20px 14px 40px; }
  .stats-title { font-size: 18px; }
  .stats-campeon-row { grid-template-columns: 20px 24px 1fr auto 32px 44px; gap: 5px; }
  .stats-campeon-name { font-size: 12px; }
  .stats-seccion-row { grid-template-columns: 110px 1fr 32px; }
  .stats-seccion-name { font-size: 12px; }
  .stats-prizes { flex-direction: column; }
  .stats-cards { flex-direction: column; }
}
`;
