# Bitácora de Prompts: Ciclo Spec-to-Code

**Proyecto:** EcoTrack · Dashboard de Emisiones en Tiempo Real
**Asistente de IA:** Claude
**Objetivo:** convertir la especificación en `EmissionsTracker.tsx` + `useEmissions.ts` con calidad profesional, refinando la salida de la IA en cada iteración en lugar de aceptar el primer resultado.

| Iteración | Prompt | Qué cambió en el código |
|---|---|---|
| 0 | Especificación | Se fija el contrato antes de pedir código |
| 1 | Estructura | Árbol de componentes y capa de datos |
| 2 | Lógica | `useEmissions` con loading, error e inserción |
| 3 | Refinamiento | TypeScript estricto, `useReducer`, `useMemo`/`memo`, accesibilidad, Realtime |
| 4 | UX y verificación | Tailwind responsive, feedback visual y corrección de errores detectados al probar |

---

## Iteración 0: Especificación (el contrato)

Antes de pedir código, escribí la especificación que usé como contexto en todos los prompts:

```text
COMPONENTE: EmissionsTracker
- Lista de tarjetas: nombre de la fuente, categoría (Transporte | Energía | Residuos), CO2 (kg).
- Formulario para agregar mediciones (nombre 3-80 caracteres, categoría obligatoria, CO2 > 0 y <= 1.000.000 kg).
- Hook useEmissions: carga, inserción y errores contra Supabase.
- Tailwind CSS, responsive (móvil -> escritorio), feedback de carga, error y éxito.
TABLA (ya existe en Supabase): emissions(id uuid, source_name text, category text, co2_kg numeric, created_at timestamptz)
```

---

## Iteración 1: Prompt de Estructura

```text
Actúa como Arquitecto Frontend Senior (React 19 + TypeScript + Vite + Supabase).

Contexto: EcoTrack es una plataforma de monitoreo de huella de carbono. El backend ya tiene la
tabla `emissions` en Supabase: (id uuid, source_name text, category 'transporte'|'energia'|'residuos',
co2_kg numeric, created_at timestamptz). [Se adjuntó la especificación de la Iteración 0]

Tarea: propón la ARQUITECTURA (todavía sin implementar) del "Dashboard de Emisiones en Tiempo Real".

Restricciones:
- Separar UI, lógica (custom hook) y acceso a datos (Supabase).
- Un solo cliente de Supabase en todo el proyecto.
- Los componentes de UI no importan Supabase.
- La app debe poder ejecutarse SIN credenciales de Supabase (modo demo) para presentar el laboratorio.

Formato de salida:
1. Árbol de carpetas de src/ con un comentario por archivo.
2. Árbol de componentes (padre -> hijos) indicando qué props recibe cada uno.
3. Firma TypeScript del hook useEmissions (lo que recibe y lo que devuelve).
```

**Respuesta de la IA (resumen):**
```
src/
├── types/emission.ts          # Emission, NewEmission, EmissionCategory
├── lib/supabase.ts            # cliente único
├── services/                  # emissionsService (Supabase)
├── hooks/useEmissions.ts
└── components/EmissionsTracker/
    ├── EmissionsTracker.tsx   # contenedor
    ├── EmissionCard.tsx       # tarjeta
    └── EmissionForm.tsx       # formulario
```

**Análisis y decisión:**
- ✅ La separación UI / hook / servicio era correcta.
- ❌ El servicio llamaba a Supabase directamente, así que sin `.env` la app fallaba y no cumplía la restricción del modo demo.
- 🔁 **Cambio:** pedí una **interfaz `EmissionsRepository`** con dos implementaciones (`supabase` y `mock`). El hook recibe el repositorio por parámetro (inyección de dependencias). Resultado: [`services/emissionsRepository.ts`](../src/services/emissionsRepository.ts).

---

## Iteración 2: Prompt de Lógica (useEmissions)

```text
Implementa el custom hook `useEmissions(repository: EmissionsRepository)` en TypeScript.

Requisitos:
- Al montar, cargar la lista (repository.list()).
- Exponer: emissions, loading, error, addEmission(input: NewEmission), retry().
- addEmission inserta la medición y la agrega al inicio de la lista sin volver a pedir todo.
- Manejar errores de red/Supabase con mensajes en español legibles para el usuario.
- No debe quedar ningún setState después de desmontar el componente.

Devuelve solo el archivo useEmissions.ts completo.
```

**Primer borrador del hook (fragmento):**
```ts
export function useEmissions(repository: EmissionsRepository) {
  const [emissions, setEmissions] = useState<Emission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setEmissions(await repository.list()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [repository])

  useEffect(() => { load() }, [load])

  const addEmission = async (input: NewEmission) => {
    setLoading(true)                         // <- bloquea TODA la lista al guardar
    const created = await repository.create(input)
    setEmissions([created, ...emissions])    // <- closure obsoleta
    setLoading(false)
  }
  return { emissions, loading, error, addEmission, retry: load }
}
```

**Problemas detectados en revisión:**
1. `catch (e: any)` rompe el tipado estricto.
2. Un solo `loading` para cargar y guardar: al enviar el formulario la lista entera volvía al skeleton.
3. `setEmissions([created, ...emissions])` usa una closure obsoleta; si llega otro insert simultáneo, se pierde.
4. Si `create` falla, el error no se captura y `loading` queda en `true` para siempre.
5. Tres `useState` que pueden quedar en combinaciones imposibles (`loading` y `error` a la vez).
6. El linter (`react/set-state-in-effect`) marcaba `setLoading(true)` sincrónico dentro del efecto.

---

## Iteración 3: Prompt de Refinamiento

```text
Refactoriza useEmissions y los componentes con estas restricciones:

TypeScript estricto:
- Prohibido `any`. Los errores se manejan como `unknown` y se convierten con un helper toErrorMessage.
- Las categorías se derivan de un array `as const` (una sola fuente de verdad) con type guard.

Estado:
- Usa useReducer con una unión discriminada de acciones (FETCH_*, SUBMIT_*, REALTIME_INSERT).
- Separa el estado de carga de la lista (status: 'loading'|'success'|'error') del estado de envío
  (isSubmitting, submitError).
- Las actualizaciones de la lista deben ser funcionales y evitar duplicados por id.
- No llamar setState de forma sincrónica dentro de useEffect; el reintento se dispara desde el
  evento (retry) con un reloadToken.

Rendimiento:
- Calcula los totales por categoría con useMemo (solo cuando cambia la lista).
- EmissionCard y EmissionsSummary con React.memo; callbacks estables con useCallback.

Tiempo real:
- Suscríbete a INSERT de la tabla emissions con Supabase Realtime y limpia el canal al desmontar.

Accesibilidad (WCAG 2.1 AA):
- Labels asociados (htmlFor + useId), aria-invalid y aria-describedby en campos con error.
- Al enviar con errores, mover el foco al primer campo inválido.
- Mensajes de éxito con aria-live="polite" y errores con role="alert".
- Skeleton con role="status" y texto sr-only.
```

**Resultado (fragmento del código final, [`src/hooks/useEmissions.ts`](../src/hooks/useEmissions.ts)):**
```ts
type EmissionsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; emissions: Emission[] }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; emission: Emission }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'REALTIME_INSERT'; emission: Emission }
  | { type: 'CLEAR_SUBMIT_ERROR' }

const prependUnique = (list: Emission[], item: Emission): Emission[] =>
  list.some((e) => e.id === item.id) ? list : [item, ...list]

useEffect(() => {
  let active = true
  repository.list()
    .then((emissions) => { if (active) dispatch({ type: 'FETCH_SUCCESS', emissions }) })
    .catch((error: unknown) => { if (active) dispatch({ type: 'FETCH_ERROR', error: toErrorMessage(error) }) })
  return () => { active = false }
}, [repository, reloadToken])

const totals = useMemo(() => { /* suma por categoría */ }, [state.emissions])
```

**Cómo se corrigió cada problema de la Iteración 2:**

| Problema | Solución |
|---|---|
| `any` | `unknown` + `toErrorMessage()`. Las categorías salen de `EMISSION_CATEGORIES as const` con el type guard `isEmissionCategory` |
| `loading` compartido | `status` (lista) e `isSubmitting` (formulario) separados: la lista sigue visible mientras se guarda |
| Closure obsoleta | El reducer siempre parte del estado actual, y `prependUnique` evita duplicados entre el insert y Realtime |
| Error de `create` sin capturar | `try/catch` → `SUBMIT_ERROR`. `addEmission` devuelve `boolean` para que el formulario sepa si debe limpiarse |
| Estados imposibles | Máquina de estados con `useReducer` y unión discriminada |
| Aviso del linter | Inserción y reintento se disparan desde eventos, y el efecto solo resuelve la promesa |

---

## Iteración 4: Prompt de UX, Tailwind y verificación

```text
Aplica Tailwind CSS v4 para un acabado profesional y responsive:
- Mobile-first: en móvil el formulario va arriba y la lista abajo; desde lg, la lista a la
  izquierda y el formulario fijo (sticky) a la derecha.
- Tarjetas con badge de color por categoría, CO2 formateado (kg / t) en es-CO y una barra relativa.
- Resumen: total de CO2e y porcentaje por categoría.
- Estados visuales: skeleton al cargar, error con botón "Reintentar", estado vacío, botón con
  spinner "Guardando…" y mensajes de éxito/error en el formulario.
- Las clases de Tailwind deben ser strings completos (nada de `bg-${color}-500`).
- Añade escenarios de demo por URL en el mock: ?mock=slow | error | empty | insert-error.
```

**Problemas encontrados al probar en el navegador y corregidos:**
1. **Resumen apretado a 1024px:** con el formulario lateral, las 4 tarjetas del resumen no cabían y "33,84 t" se partía en dos líneas. Lo rediseñé con el total en una fila completa y las 3 categorías en `grid-cols-3`.
2. **Títulos largos partidos en la tarjeta:** el badge de categoría competía con el título en la misma fila. Ahora el badge va arriba y el título debajo. El skeleton se ajustó a la misma forma para evitar saltos de layout.
3. **Linter `only-export-components`:** `EmissionForm.tsx` exportaba también la función `validate`. La moví a [`utils/validateEmission.ts`](../src/utils/validateEmission.ts), que además es una función pura y fácil de probar.
4. **Verificación responsive:** a 375px no hay desplazamiento horizontal (`scrollWidth === innerWidth`).

---

## Resultado final

- `npm run build` (incluye `tsc -b` en modo estricto) sin errores.
- `npm run lint` (oxlint) sin advertencias.
- Probado en el navegador: carga, validación, inserción, error de carga con reintento, error al guardar, estado vacío y vista móvil. Las capturas están en [`docs/capturas`](capturas).

### Lecciones del ciclo Spec-to-Code

- La **primera respuesta** de la IA "funcionaba", pero tenía 6 defectos que solo aparecieron al revisarla con criterio (tipado, concurrencia y UX).
- Dar **restricciones explícitas** (prohibido `any`, `useReducer`, `aria-*`, clases completas de Tailwind) produjo mejor código que pedir "hazlo mejor".
- **Probar en el navegador** reveló problemas de layout que ningún prompt anticipó. La última iteración siempre debe ser una verificación real.
