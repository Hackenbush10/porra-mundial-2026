import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: 'Variables de entorno no configuradas' },
      { status: 500 },
    );
  }

  const client = adminClient();

  const [{ data: pagadas, error: errPagadas }, { count: totalRegistros, error: errTotal }] =
    await Promise.all([
      client
        .from('apuestas')
        .select('nombre, seccion, campeon, created_at')
        .eq('pagado', true)
        .order('nombre'),
      client.from('apuestas').select('*', { count: 'exact', head: true }),
    ]);

  if (errPagadas || errTotal) {
    return NextResponse.json(
      { error: errPagadas?.message ?? errTotal?.message ?? 'Error de base de datos' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { pagadas: pagadas ?? [], totalRegistros: totalRegistros ?? 0 },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
