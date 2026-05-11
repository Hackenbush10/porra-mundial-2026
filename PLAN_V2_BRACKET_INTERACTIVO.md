# Plan v2: Bracket Interactivo - Porra Mundial 2026

## Resumen

Nueva versión de la app accesible en `/v2`. Misma fase de grupos que v1 (elegir 1º, 2º, 3º + 8 mejores terceros). La diferencia: a partir de dieciseisavos, se reemplaza el wizard fase-a-fase por un **bracket visual interactivo completo** con las dos mitades del cuadro y la final en el centro.

---

## Cambios respecto a v1

### Lo que se MANTIENE igual
- Stack tecnológico (Next.js 14, Tailwind, Supabase, @react-pdf/renderer)
- Datos base: grupos, equipos, emparejamientos (src/lib/data.ts)
- Tabla de terceros (src/lib/thirdPlaceTable.ts)
- Esquema de Supabase (tabla `apuestas`)
- Generación de PDF
- Pasos 1-3 del wizard: Datos personales, Fase de grupos, Mejores terceros

### Lo que CAMBIA
- **Pasos 4 a 8 del wizard** (dieciseisavos → final) se reemplazan por un **único paso** con un bracket visual interactivo completo
- El bracket muestra las dos mitades del cuadro con la final en el centro
- El usuario hace clic en un equipo para hacerlo avanzar a la siguiente fase
- Se puede corregir: al hacer clic en otro equipo del mismo partido, reemplaza al elegido y limpia las fases posteriores afectadas

---

## Diseño del bracket interactivo

### Layout general (landscape / horizontal)

```
MITAD SUPERIOR                                          MITAD INFERIOR
(8 partidos 1/16)                                       (8 partidos 1/16)
    ↓                                                       ↓
(4 partidos 1/8)                                        (4 partidos 1/8)
    ↓                                                       ↓
(2 partidos 1/4)                                        (2 partidos 1/4)
    ↓                                                       ↓
(Semifinal 1)          FINAL → CAMPEÓN              (Semifinal 2)
```

### Columnas del bracket (de izquierda a derecha)

```
Col 1: 1/16 superior (8 partidos, 16 equipos)
Col 2: 1/8 superior (4 partidos)
Col 3: 1/4 superior (2 partidos)
Col 4: Semifinal 1 (1 partido)
Col 5: FINAL + CAMPEÓN (centro)
Col 6: Semifinal 2 (1 partido)
Col 7: 1/4 inferior (2 partidos)
Col 8: 1/8 inferior (4 partidos)
Col 9: 1/16 inferior (8 partidos, 16 equipos)
```

### Interacción

1. **Estado inicial**: Todos los partidos de 1/16 están rellenos con los equipos clasificados. El resto del bracket está vacío (slots grises).

2. **Selección**: El usuario hace clic en un equipo dentro de un partido de 1/16. Ese equipo se marca como ganador (resaltado) y aparece en el slot correspondiente de 1/8.

3. **Avance progresivo**: Cuando los dos equipos de un partido de 1/8 están definidos, el usuario puede hacer clic en uno para pasarlo a 1/4, y así sucesivamente hasta la final.

4. **Corrección**: Si el usuario cambia de opinión y hace clic en el otro equipo de un partido ya decidido:
   - El nuevo equipo reemplaza al anterior como ganador
   - Todas las fases posteriores que dependían del equipo eliminado se limpian (cascada)
   - Ejemplo: si en 1/16 cambias al ganador, se borra de 1/8, y si ese equipo había avanzado a 1/4, también se borra de ahí, etc.

5. **Completado**: Cuando se ha elegido el campeón, se habilita el botón "Generar PDF y guardar apuesta".

### Responsive

- **Desktop**: bracket completo horizontal como se describe arriba
- **Móvil**: scroll horizontal con el bracket, o alternativamente mostrar mitad superior arriba y mitad inferior abajo con la final entre ambas

---

## Estructura de archivos (solo archivos nuevos/modificados)

```
src/
├── app/
│   └── v2/
│       └── page.tsx              # Página principal de v2
├── components/
│   └── v2/
│       ├── WizardContainerV2.tsx  # Wizard adaptado: pasos 1-3 iguales, paso 4 = bracket
│       ├── InteractiveBracket.tsx # Componente principal del bracket visual
│       ├── BracketMatch.tsx       # Partido individual (2 equipos, clic para elegir)
│       ├── BracketColumn.tsx      # Columna de una fase
│       └── BracketConnectors.tsx  # Líneas SVG conectando partidos entre fases
```

Los archivos compartidos con v1 no se tocan:
- src/lib/data.ts
- src/lib/thirdPlaceTable.ts  
- src/lib/supabase.ts
- src/components/DatosPersonales.tsx (se reutiliza)
- src/components/FaseGrupos.tsx (se reutiliza)
- src/components/MejoresTerceros.tsx (se reutiliza)
- src/components/PdfGenerator.tsx (se reutiliza)

---

## Lógica del bracket interactivo

### Estructura de datos

```typescript
// Cada partido del bracket
interface BracketMatch {
  id: string;           // ej: "r16_1", "r8_1", "qf_1", "sf_1", "final"
  phase: Phase;         // "r16" | "r8" | "qf" | "sf" | "final"
  team1: string | null; // nombre del equipo o null si aún no definido
  team2: string | null;
  winner: string | null;
  // Referencia a qué partido alimenta (para cascada)
  nextMatchId: string | null;
  nextSlot: "team1" | "team2"; // si el ganador va como team1 o team2 del siguiente
}
```

### Algoritmo de cascada al cambiar una selección

```
function selectWinner(matchId, team):
  1. Marcar team como winner del match
  2. Si el match tiene nextMatchId:
     a. Poner team en nextSlot del siguiente match
     b. Si el siguiente match tenía un winner que era el equipo reemplazado:
        - Limpiar winner del siguiente match
        - Llamar recursivamente para limpiar la cascada
  3. Recalcular si el bracket está completo (campeón elegido)
```

---

## Flujo del usuario en v2

### Paso 1: Datos personales (idéntico a v1)
- Nombre y Sección

### Paso 2: Fase de grupos (idéntico a v1)
- 12 grupos, elegir 1º, 2º, 3º

### Paso 3: Mejores terceros (idéntico a v1)
- Seleccionar 8 de 12 terceros
- Asignación automática con thirdPlaceTable

### Paso 4: Bracket interactivo (NUEVO)
- Se muestra el bracket completo con los 32 equipos en dieciseisavos
- El usuario va haciendo clic para avanzar equipos
- Puede corregir en cualquier momento
- Cuando elige campeón → botón "Guardar apuesta y generar PDF"

### Paso 5: Resumen + PDF (similar a v1)
- Vista resumen
- Descarga PDF
- Datos guardados en Supabase

---

## Prompts para Claude Code

### Prompt 1: Scaffold de v2

```
Vamos a crear la versión 2 de la app de porra del Mundial.

Crea la ruta /v2 en el proyecto existente:
- src/app/v2/page.tsx

Crea la carpeta src/components/v2/ con:
- WizardContainerV2.tsx

El wizard de v2 tiene 5 pasos:
1. Datos personales (reutiliza DatosPersonales.tsx de v1)
2. Fase de grupos (reutiliza FaseGrupos.tsx de v1)  
3. Mejores terceros (reutiliza MejoresTerceros.tsx de v1)
4. Bracket interactivo (nuevo - por ahora placeholder)
5. Resumen + PDF (reutiliza lógica de v1)

Asegúrate de que los componentes de v1 que se reutilizan funcionan 
importándolos desde la carpeta components existente. La v1 en / 
debe seguir funcionando exactamente igual.
```

### Prompt 2: Bracket interactivo

```
Implementa el bracket interactivo completo en src/components/v2/.

Componentes necesarios:

1. InteractiveBracket.tsx: layout completo del bracket
   - Disposición horizontal: 9 columnas
   - Izquierda: 1/16 sup → 1/8 sup → 1/4 sup → Semi 1
   - Centro: Final + Campeón
   - Derecha: Semi 2 → 1/4 inf → 1/8 inf → 1/16 inf
   - Líneas SVG o CSS conectando los partidos entre fases
   - Scroll horizontal en móvil

2. BracketMatch.tsx: un partido individual
   - Muestra dos equipos (o slots vacíos si no están definidos)
   - Al hacer clic en un equipo, se marca como ganador (fondo destacado)
   - Si el partido no tiene los dos equipos definidos, no se puede interactuar

3. Lógica de cascada:
   - Cuando el usuario elige un ganador, ese equipo pasa al siguiente partido
   - Si cambia el ganador de un partido ya decidido, se limpia la cascada:
     el equipo eliminado se borra de todas las fases posteriores donde aparecía

4. Estado del bracket:
   - Recibe como prop los 32 equipos clasificados (de la fase de grupos + terceros)
   - Usa los emparejamientos de src/lib/data.ts para la estructura de 1/16
   - Expone el bracket completo cuando el campeón está elegido

El bracket debe ser visualmente atractivo, con colores que diferencien las fases.
Los equipos seleccionados deben resaltarse claramente.
Debe funcionar tanto en desktop como en móvil (scroll horizontal).
En español.
```

### Prompt 3: Integración y refinamiento

```
Integra el bracket interactivo en el wizard de v2:

1. En el paso 4, el InteractiveBracket recibe los equipos clasificados 
   del paso 3 y construye los emparejamientos de 1/16 automáticamente.

2. Cuando el usuario elige un campeón, se habilita el botón "Siguiente" 
   para ir al paso 5 (Resumen).

3. En el paso 5, muestra un resumen y los botones:
   - "Guardar apuesta y generar PDF" → guarda en Supabase + descarga PDF
   
4. Asegúrate de que al retroceder al paso 4, el bracket mantiene su estado.

5. Verifica que la v1 (ruta /) sigue funcionando sin cambios.

6. Ejecuta npm run build para verificar que no hay errores de TypeScript.
```

---

## Testing

Verificar estos escenarios:
1. /v2 carga correctamente sin afectar a /
2. Los pasos 1-3 funcionan igual que en v1
3. El bracket se rellena con los 32 equipos correctos tras el paso 3
4. Se puede hacer clic para avanzar equipos fase a fase
5. La corrección funciona: cambiar un ganador limpia las fases posteriores
6. Al elegir campeón, se puede generar PDF y guardar en Supabase
7. El PDF muestra los mismos datos que el bracket interactivo
8. Funciona en móvil (scroll horizontal)
