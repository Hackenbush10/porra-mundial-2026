'use client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DatosPersonalesProps {
  nombre: string;
  seccion: string;
  email: string;
  onChange: (field: 'nombre' | 'seccion' | 'email', value: string) => void;
}

export default function DatosPersonales({
  nombre,
  seccion,
  email,
  onChange,
}: DatosPersonalesProps) {
  const emailInvalid = email.trim().length > 0 && !EMAIL_RE.test(email.trim());

  const inputClass =
    'w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">&#9917;</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mis datos</h2>
          <p className="text-sm text-gray-500">
            Identifícate para tu apuesta del Mundial 2026
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nombre" className="text-sm font-medium text-gray-700">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => onChange('nombre', e.target.value)}
            placeholder="Ej: Juan García López"
            className={inputClass}
            autoComplete="name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="seccion" className="text-sm font-medium text-gray-700">
            Sección / Grupo <span className="text-red-500">*</span>
          </label>
          <input
            id="seccion"
            type="text"
            value={seccion}
            onChange={(e) => onChange('seccion', e.target.value)}
            placeholder="Ej: Sección 3B"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="Ej: nombre@elpais.es"
            className={[
              inputClass,
              emailInvalid ? 'border-red-300 focus:ring-red-400 focus:border-red-400' : '',
            ].join(' ')}
            autoComplete="email"
          />
          {emailInvalid && (
            <p className="text-xs text-red-500">Introduce un email válido</p>
          )}
        </div>
      </div>

      {nombre.trim() && seccion.trim() && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          <span className="font-medium">{nombre}</span> &mdash; {seccion}
        </div>
      )}
    </div>
  );
}
