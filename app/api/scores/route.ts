// app/api/scores/route.ts
import { NextResponse } from 'next/server';

const SHEET_ID = '1A5JQaPMUPxiNEStbc9g3A4NhcvnqSaDcSPI6QGTEr20';
const GID = '691986591';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

interface ParticipantRow {
  name: string;
  section: string;
  pts16: number;
  pts8: number;
  pts4: number;
  ptsSemis: number;
  ptsFinal: number;
  ptsChamp: number;
  total: number;
}

function parseCSV(text: string): string[][] {
  const rows: string[] = [];
  let current = '';
  let inQuotes = false;
  const lines: string[][] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      rows.push(current);
      current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rows.push(current);
      current = '';
      lines.push([...rows]);
      rows.length = 0;
    } else {
      current += ch;
    }
  }
  if (current || rows.length) {
    rows.push(current);
    lines.push([...rows]);
  }
  return lines;
}

function parseData(csv: string): ParticipantRow[] {
  const lines = parseCSV(csv);
  if (lines.length < 2) return [];

  const entries: ParticipantRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (!r || r.length < 18) continue;
    const name = (r[1] || '').trim();
    if (!name) continue;

    entries.push({
      name,
      section: (r[2] || '').trim(),
      pts16: parseInt(r[6], 10) || 0,    // col G (Puntos 1/16)
      pts8: parseInt(r[8], 10) || 0,     // col I (Puntos 1/8)
      pts4: parseInt(r[10], 10) || 0,    // col K (Puntos 1/4)
      ptsSemis: parseInt(r[12], 10) || 0, // col M (Puntos semis)
      ptsFinal: parseInt(r[14], 10) || 0, // col O (Puntos final)
      ptsChamp: parseInt(r[16], 10) || 0, // col Q (Puntos campeón)
      total: parseInt(r[17], 10) || 0,    // col R (Total puntos)
    });
  }

  // Sort: total desc, then alphabetical
  entries.sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name, 'es')
  );

  return entries;
}

export async function GET() {
  try {
    const res = await fetch(CSV_URL, {
      // No cache: always get fresh data when user clicks "Actualizar"
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google Sheets responded with ${res.status}` },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const data = parseData(csv);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
