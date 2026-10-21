# Investigación técnica: Juego Snake web

**Fecha**: 2026-10-20

**Estado**: artefacto de apoyo al Plan aprobado formalmente por revisión humana el 2026-10-20.

## R-001 — Plataforma y versiones base

**Decisión**: usar Node.js 24 LTS, TypeScript 5.x, Next.js 16 App Router y React 19. Las versiones exactas y transitivas quedarán fijadas por `package-lock.json` al iniciar la implementación.

**Justificación**: Node.js 24 está en LTS hasta 2028; Next.js 16 requiere TypeScript 5.1 o superior y soporta App Router y Route Handlers en una única aplicación; React 19 es la línea estable compatible. La selección evita versiones EOL y no introduce un frontend/backend separado.

**Alternativas consideradas**:

- Next.js Pages Router: descartado por mantener dos modelos de enrutamiento y no aportar valor al alcance nuevo.
- Vite + API independiente: descartado porque duplicaría configuración y despliegue para dos operaciones HTTP.
- Node.js Current: descartado frente a una línea LTS más estable.

**Fuentes**: [Node.js 24 LTS](https://nodejs.org/en/blog/migrations/v22-to-v24), [Next.js 16](https://nextjs.org/blog/next-16), [App Router](https://nextjs.org/docs/app), [React 19](https://react.dev/versions).

## R-002 — Monolito modular por capas

**Decisión**: una sola aplicación Next.js con módulos `domain`, `application`, `infrastructure`, `presentation` y `app`; las dependencias apuntan hacia dominio y contratos de aplicación.

**Justificación**: satisface la constitución, conserva una unidad desplegable y permite probar reglas de juego sin navegador ni base de datos.

**Alternativas consideradas**:

- Microservicios: descartados por complejidad operativa injustificada.
- Componentes React con toda la lógica: descartados por acoplar reglas y temporización a la interfaz.
- Paquetes independientes en un monorepo: descartados porque el tamaño no compensa su configuración.

## R-003 — Máquina de estados proporcional

**Decisión**: implementar una máquina de estados propia con unión discriminada y función reductora pura; no incorporar una librería externa de statecharts.

**Justificación**: cuatro estados y un conjunto finito de comandos justifican transiciones explícitas, pero no una dependencia adicional. Las guardas centralizan acciones compatibles, reinicio protegido, pausa y finalización irreversible.

**Alternativas consideradas**:

- Estados booleanos independientes: descartados porque permiten combinaciones inválidas.
- Librería de máquina de estados: descartada por sobreingeniería para el alcance actual.

## R-004 — Ritmo, tablero y determinismo

**Decisión**: tablero lógico de 20 × 20 y tick fijo de 150 ms. El dominio recibe reloj y generador de posiciones como dependencias; las pruebas usan reloj falso y secuencias predefinidas.

**Justificación**: concreta los parámetros diferidos a Plan, mantiene velocidad constante y permite verificar controles, alimento, colisiones y tablero lleno sin esperas ni azar real.

**Alternativas consideradas**:

- Velocidad progresiva: descartada por contradecir RF-029.
- `Math.random` dentro del dominio: descartado por hacer frágiles las pruebas.
- Temporizador dentro de cada componente: descartado por duplicación y riesgo de múltiples ticks.

**Fuente**: [temporizadores falsos de Vitest](https://vitest.dev/guide/mocking/timers).

## R-005 — Persistencia con Repository y Supabase

**Decisión**: definir `ResultRepository` en aplicación y un único adaptador Supabase server-only. Versionar la base mediante Supabase CLI y migraciones SQL.

**Justificación**: Repository desacopla los casos de uso del proveedor concreto y facilita dobles de prueba; las migraciones hacen reproducible el esquema PostgreSQL.

**Alternativas consideradas**:

- Acceso a Supabase desde React: descartado para no exponer permisos de escritura ni acoplar presentación a datos.
- ORM: descartado porque una tabla y dos consultas no justifican otra abstracción.
- Almacenamiento local: descartado porque no ofrece ranking global ni persistencia relacional.

**Fuentes**: [Supabase con Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs), [flujo local y migraciones](https://supabase.com/docs/guides/local-development/cli-workflows).

## R-006 — Idempotencia y orden del ranking

**Decisión**: usar `game_id` UUID como clave primaria. La repetición con carga idéntica devuelve el registro existente; la repetición con datos distintos produce conflicto. El índice y la consulta siguen `score DESC, achieved_at ASC, game_id ASC`.

**Justificación**: la restricción única hace atómica la protección frente a reintentos y reproduce exactamente el desempate aprobado.

**Alternativas consideradas**:

- Detección previa mediante `SELECT`: descartada por condición de carrera.
- Identificador generado solo en la base: descartado porque no permite reconocer un reintento del cliente.
- Alias único: descartado porque contradice la especificación.

## R-007 — Contrato HTTP y validación

**Decisión**: exponer `POST /api/results` y `GET /api/ranking`; usar Route Handlers, esquemas cerrados y respuestas de error estables. Validar en el límite y repetir invariantes críticas en dominio y PostgreSQL.

**Justificación**: dos rutas cubren todo el límite externo, mantienen la clave de Supabase en servidor y permiten pruebas de contrato.

**Alternativas consideradas**:

- Server Actions para todo: descartadas porque un contrato HTTP explícito es más sencillo de probar y documentar para persistencia.
- Acceso directo a Data API desde navegador: descartado por ampliar la superficie de permisos públicos.

**Fuente**: [Route Handlers de Next.js](https://nextjs.org/docs/app/getting-started/route-handlers).

## R-008 — Seguridad y secretos

**Decisión**: mantener `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el runtime de servidor; revocar acceso directo público a la tabla; usar variables separadas en local, Preview y Production.

**Justificación**: una clave privilegiada nunca debe incorporarse al bundle ni al repositorio. La aplicación es pública y sin cuentas, por lo que el servidor valida entradas y controla el único acceso a datos.

**Alternativas consideradas**:

- Clave privilegiada con prefijo `NEXT_PUBLIC_`: descartada porque se expondría al navegador.
- Política de inserción pública directa: descartada porque permitiría evitar la validación del servidor.
- Autenticación: descartada por estar fuera del alcance aprobado.

**Fuentes**: [variables de entorno de Next.js](https://nextjs.org/docs/15/app/guides/environment-variables), [seguridad de datos de Supabase](https://supabase.com/docs/guides/database/secure-data), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## R-009 — Estrategia de pruebas

**Decisión**: Vitest cubre reglas puras y adaptadores de aplicación; Supabase local cubre migraciones y repositorio; Playwright cubre recorridos E2E con un worker en CI. Semillas, UUID, fechas y temporizadores serán controlables en pruebas.

**Justificación**: separa evidencia por riesgo y límite, satisface la constitución y evita pruebas dependientes de azar o tiempo real.

**Alternativas consideradas**:

- Solo E2E: descartado por lentitud y diagnóstico deficiente de reglas combinatorias.
- Base remota compartida en CI: descartada por secretos, interferencia y falta de repetibilidad.
- Paralelismo E2E desde el inicio: descartado; el alcance pequeño favorece estabilidad.

**Fuente**: [Playwright en CI](https://playwright.dev/docs/ci).

## R-010 — CI y despliegue

**Decisión**: ampliar GitHub Actions con jobs de formato, tipos, unitarias, integración, build y E2E; conservar `repository-integrity`. Desplegar la aplicación Next.js en Vercel con Preview por PR y Production desde `main`, siempre bajo aprobación.

**Justificación**: GitHub protege la integración y Vercel ofrece un camino directo para Next.js con variables por entorno. La aplicación de migraciones se mantiene como operación separada y autorizada.

**Alternativas consideradas**:

- Despliegue desde el equipo local: descartado por menor auditabilidad.
- Producción desde ramas de funcionalidad: descartada por GitHub Flow y protección de `main`.
- Migraciones automáticas sin puerta humana: descartadas por riesgo destructivo y gobernanza.

**Fuentes**: [Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [entornos de Vercel](https://vercel.com/docs/deployments/environments), [variables de entorno de Vercel](https://vercel.com/docs/environment-variables).

## Conclusión

Todas las decisiones técnicas necesarias para Phase 1 están resueltas; cualquier cambio de stack, alcance o comportamiento deberá volver a la puerta humana correspondiente.
