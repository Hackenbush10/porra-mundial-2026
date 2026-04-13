import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service-role or anon key server-side — same anon key is fine since RLS
// is configured to allow INSERT from anon.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // ── Validación básica ────────────────────────────────────────────────────────
  if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim()) {
    return NextResponse.json({ error: 'El campo "nombre" es obligatorio' }, { status: 422 });
  }
  if (!data.seccion || typeof data.seccion !== 'string' || !data.seccion.trim()) {
    return NextResponse.json({ error: 'El campo "seccion" es obligatorio' }, { status: 422 });
  }
  if (!data.grupos || typeof data.grupos !== 'object') {
    return NextResponse.json({ error: 'El campo "grupos" es obligatorio' }, { status: 422 });
  }
  if (!Array.isArray(data.mejores_terceros) || data.mejores_terceros.length !== 8) {
    return NextResponse.json(
      { error: 'Se requieren exactamente 8 mejores terceros' },
      { status: 422 },
    );
  }
  if (!data.bracket || typeof data.bracket !== 'object') {
    return NextResponse.json({ error: 'El campo "bracket" es obligatorio' }, { status: 422 });
  }
  if (!data.campeon || typeof data.campeon !== 'string' || !data.campeon.trim()) {
    return NextResponse.json({ error: 'El campo "campeon" es obligatorio' }, { status: 422 });
  }

  // ── Inserción en Supabase ────────────────────────────────────────────────────
  const { error } = await supabase.from('apuestas').insert({
    nombre: (data.nombre as string).trim(),
    seccion: (data.seccion as string).trim(),
    grupos: data.grupos,
    mejores_terceros: data.mejores_terceros,
    bracket: data.bracket,
    campeon: (data.campeon as string).trim(),
  });

  if (error) {
    console.error('[apuestas] Supabase error:', error);
    return NextResponse.json(
      { error: 'Error al guardar la apuesta. Inténtalo de nuevo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
