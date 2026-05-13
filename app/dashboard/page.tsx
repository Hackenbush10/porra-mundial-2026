// app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

interface Participant {
  name: string;
  section: string;
  pts16: number;
  pts8: number;
  pts4: number;
  ptsSemis: number;
  ptsFinal: number;
  ptsChamp: number;
  total: number;
  position?: number;
}

const PHASES = [
  { key: 'pts16' as const, label: '1/16', color: '#1a6b3c' },
  { key: 'pts8' as const, label: '1/8', color: '#2a9d5c' },
  { key: 'pts4' as const, label: '1/4', color: '#f59e0b' },
  { key: 'ptsSemis' as const, label: 'Semis', color: '#e85d2a' },
  { key: 'ptsFinal' as const, label: 'Final', color: '#dc2626' },
  { key: 'ptsChamp' as const, label: 'Campeón', color: '#7c1ddb' },
];

type PhaseKey = (typeof PHASES)[number]['key'];

export default function DashboardPage() {
  const [data, setData] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/scores');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const entries: Participant[] = await res.json();

      // Assign positions with ties
      let pos = 1;
      for (let i = 0; i < entries.length; i++) {
        if (i > 0 && entries[i].total < entries[i - 1].total) {
          pos = i + 1;
        }
        entries[i].position = pos;
      }

      setData(entries);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxPoints = Math.max(1, ...data.map((d) => d.total));

  if (loading) {
    return (
      <>
        <style>{globalCSS}</style>
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p>Cargando clasificación…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalCSS}</style>
      <div className="dashboard-page">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">
              Clasificación de la Porra del Mundial 2026
            </h1>
            <a
              href="mailto:rsilva@elpais.es?subject=Clasificaci%C3%B3n%20Porra%20Mundial%202026"
              className="dashboard-author"
            >
              Rodrigo Silva
            </a>
          </div>
          <div className="dashboard-header-right">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="dashboard-refresh-btn"
              style={{ opacity: refreshing ? 0.6 : 1 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={refreshing ? 'dashboard-spin' : ''}
              >
                <path
                  d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 .01 3.58.01 8S3.58 16 8 16c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 8 14 6 6 0 0 1 8 2c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"
                  fill="currentColor"
                />
              </svg>
              <span>{refreshing ? 'Actualizando…' : 'Actualizar'}</span>
            </button>
            {lastUpdate && (
              <span className="dashboard-last-update">
                {lastUpdate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </header>

        {error && <div className="dashboard-error">Error: {error}</div>}

        {/* Legend */}
        <div className="dashboard-legend">
          {PHASES.map((p) => (
            <div key={p.key} className="dashboard-legend-item">
              <span
                className="dashboard-legend-dot"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th className="col-pos">#</th>
                <th className="col-name">Nombre</th>
                <th className="col-section">Sección</th>
                <th className="col-points">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, i) => {
                const barPct =
                  maxPoints > 0 ? (entry.total / maxPoints) * 100 : 0;
                const isTop = entry.position === 1 && entry.total > 0;
                return (
                  <tr
                    key={`${entry.name}-${i}`}
                    className={i % 2 === 0 ? 'row-even' : 'row-odd'}
                  >
                    <td className={`td-pos ${isTop ? 'td-pos-top' : ''}`}>
                      {entry.position}º
                    </td>
                    <td className="td-name">{entry.name}</td>
                    <td className="td-section">{entry.section}</td>
                    <td className="td-bar">
                      <div className="bar-container">
                        {entry.total > 0 ? (
                          <div
                            className="bar-track"
                            style={{ width: `${barPct}%` }}
                          >
                            {PHASES.map((ph) => {
                              const val = entry[ph.key as PhaseKey];
                              if (!val) return null;
                              return (
                                <div
                                  key={ph.key}
                                  title={`${ph.label}: ${val} pts`}
                                  className="bar-segment"
                                  style={{
                                    width: `${(val / entry.total) * 100}%`,
                                    backgroundColor: ph.color,
                                  }}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bar-empty" />
                        )}
                        <span
                          className={`bar-total ${entry.total === 0 ? 'bar-total-zero' : ''}`}
                        >
                          {entry.total}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="dashboard-footer">
          <span className="footer-label">Baremo:</span>
          <span>1/16 → 1 pt</span>
          <span className="footer-sep">·</span>
          <span>1/8 → 2 pt</span>
          <span className="footer-sep">·</span>
          <span>1/4 → 5 pt</span>
          <span className="footer-sep">·</span>
          <span>Semis → 7 pt</span>
          <span className="footer-sep">·</span>
          <span>Final → 10 pt</span>
          <span className="footer-sep">·</span>
          <span>Campeón → 10 pt</span>
        </footer>
        <div className="dashboard-count">{data.length} participantes</div>
      </div>
    </>
  );
}

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

@keyframes spin { to { transform: rotate(360deg); } }

.dashboard-spin { animation: spin 1s linear infinite; }

.dashboard-page {
  font-family: 'DM Sans', system-ui, sans-serif;
  background-color: #0f1117;
  color: #e4e4e7;
  min-height: 100vh;
  padding: 32px 24px;
  max-width: 960px;
  margin: 0 auto;
}

.dashboard-loading {
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

.dashboard-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #2a2d3a;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}
.dashboard-header-left { display: flex; flex-direction: column; gap: 4px; }
.dashboard-header-right { display: flex; align-items: center; gap: 12px; }

.dashboard-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.dashboard-author {
  font-size: 14px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}
.dashboard-author:hover { text-decoration: underline; }

.dashboard-refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #2a2d3a;
  background-color: #1a1d27;
  color: #e4e4e7;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s;
}
.dashboard-refresh-btn:hover { border-color: #3b82f6; }

.dashboard-last-update {
  font-size: 12px;
  color: #8b8d98;
  font-family: 'JetBrains Mono', monospace;
}

/* Error */
.dashboard-error {
  background-color: #2d1215;
  color: #f87171;
  border: 1px solid #5c1d22;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
}

/* Legend */
.dashboard-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.dashboard-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b8d98;
  font-weight: 500;
}
.dashboard-legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

/* Table */
.dashboard-table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #2a2d3a;
  background-color: #1a1d27;
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.dashboard-table th {
  text-align: left;
  padding: 12px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #8b8d98;
  border-bottom: 1px solid #2a2d3a;
}

.col-pos { width: 52px; text-align: center !important; }
.col-name { width: 170px; }
.col-section { width: 115px; }

.row-even { background-color: #13151d; }
.row-odd { background-color: #181b25; }

.td-pos {
  padding: 10px 14px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 14px;
  color: #8b8d98;
  width: 52px;
}
.td-pos-top { color: #fbbf24; }

.td-name {
  padding: 10px 14px;
  font-weight: 600;
  font-size: 14px;
  width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-section {
  padding: 10px 14px;
  font-size: 13px;
  color: #8b8d98;
  width: 115px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-bar { padding: 10px 14px; }

.bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-track {
  display: flex;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  min-width: 0;
  transition: width 0.5s ease;
}

.bar-segment {
  height: 100%;
  min-width: 4px;
  transition: width 0.4s ease;
}

.bar-empty {
  height: 22px;
  width: 100%;
  border-radius: 4px;
  background-color: #2a2d3a;
  opacity: 0.25;
}

.bar-total {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  font-size: 14px;
  color: #e4e4e7;
  flex-shrink: 0;
}
.bar-total-zero { color: #8b8d98; }

/* Footer */
.dashboard-footer {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #8b8d98;
  padding: 12px 0;
  border-top: 1px solid #2a2d3a;
}
.footer-label { font-weight: 600; color: #e4e4e7; }
.footer-sep { opacity: 0.4; }

.dashboard-count {
  font-size: 12px;
  color: #8b8d98;
  margin-top: 8px;
  text-align: right;
}

/* Mobile */
@media (max-width: 640px) {
  .dashboard-page { padding: 20px 14px; }
  .dashboard-title { font-size: 18px; }
  .col-name { width: 120px; }
  .col-section { width: 80px; }
  .td-name, .td-section { font-size: 12px; }
}
`;
