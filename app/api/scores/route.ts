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
    if (!r || r.length < 17) continue;
    const name = (r[1] || '').trim();
    if (!name) continue;

    entries.push({
      name,
      section: (r[2] || '').trim(),
      pts16: parseInt(r[5], 10) || 0,   // col F
      pts8: parseInt(r[7], 10) || 0,    // col H
      pts4: parseInt(r[9], 10) || 0,    // col J
      ptsSemis: parseInt(r[11], 10) || 0, // col L
      ptsFinal: parseInt(r[13], 10) || 0, // col N
      ptsChamp: parseInt(r[15], 10) || 0, // col P
      total: parseInt(r[16], 10) || 0,   // col Q
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
