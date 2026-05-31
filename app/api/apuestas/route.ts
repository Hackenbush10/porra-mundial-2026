import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Anon client — RLS allows anon INSERT.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Service-role client — bypasses RLS, only used for admin GET.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── GET /api/apuestas — lista todas las apuestas (admin) ──────────────────────

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('[apuestas GET] Faltan variables de entorno — URL:', url ? 'ok' : 'MISSING', '| SERVICE_ROLE_KEY:', serviceKey ? 'ok' : 'MISSING');
    return NextResponse.json({ error: 'SERVICE_ROLE_KEY no configurada' }, { status: 500 });
  }

  try {
    const { data, error } = await adminClient()
      .from('apuestas')
      .select('id, nombre, seccion, email, campeon, created_at, grupos, mejores_terceros, bracket, pagado')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[apuestas GET] Supabase error completo:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Error Supabase: ${error.code ?? ''} — ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ apuestas: data });
  } catch (err) {
    console.error('[apuestas GET] Excepción inesperada:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 },
    );
  }
}

// ── POST /api/apuestas — guarda una apuesta nueva ─────────────────────────────

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
    email: typeof data.email === 'string' ? data.email.trim() : null,
    grupos: data.grupos,
    mejores_terceros: data.mejores_terceros,
    bracket: data.bracket,
    campeon: (data.campeon as string).trim(),
  });

  if (error) {
    console.error('[apuestas] Supabase error — code:', error.code, '| message:', error.message, '| details:', error.details, '| hint:', error.hint);
    const detail = `${error.code ?? ''}: ${error.message ?? error}`;
    return NextResponse.json(
      { error: `Error al guardar la apuesta: ${detail}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
