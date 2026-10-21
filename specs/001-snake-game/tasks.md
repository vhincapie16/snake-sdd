---

description: "Tareas propuestas para implementar Snake SDD"
---

# Tasks: Juego Snake web

**Entrada**: documentos de diseño aprobados de `specs/001-snake-game/`.

**Prerrequisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/results-api.openapi.yml`, `quickstart.md` y `checklists/design.md`.

**Estado**: aprobado formalmente por revisión humana el 2026-10-20. La aprobación del documento no autoriza ejecutar sus tareas, instalar dependencias, escribir código, operar Jira/Git/GitHub ni desplegar.

**Organización**: las tareas se agrupan por preparación, fundamentos y las cinco historias. Las pruebas se escriben antes de la implementación correspondiente y conservan claves HU/RF en sus nombres o metadatos.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo con otras tareas marcadas `[P]` de la misma etapa cuando sus dependencias estén satisfechas.
- **[US1]…[US5]**: corresponden respectivamente a HU-001…HU-005.
- Cada descripción contiene rutas exactas y referencias funcionales.

## Phase 1: Setup y puerta contractual

**Propósito**: validar el contrato antes de cualquier implementación y preparar el proyecto reproducible.

**Puerta bloqueante**: T001 debe completarse satisfactoriamente antes de T002 o de cualquier tarea que escriba código. Requiere autorización humana para que `npx` descargue temporalmente la herramienta; un fallo detiene el flujo y deja CHK023 abierto.

- [x] T001 Ejecutar `npx --yes @redocly/cli@2.53.3 lint --extends spec specs/001-snake-game/contracts/results-api.openapi.yml`, conservar evidencia del código 0 y marcar CHK023 únicamente tras éxito en `specs/001-snake-game/checklists/design.md`
- [x] T002 Inicializar Next.js 16, React 19, TypeScript 5.x y Node.js 24 LTS con versiones exactas fijadas en `package.json`, `package-lock.json` y `.nvmrc`
- [x] T003 [P] Configurar compilación estricta y App Router en `tsconfig.json`, `next.config.ts` y `src/app/layout.tsx`
- [x] T004 [P] Configurar formato y lint reproducibles en `eslint.config.mjs`, `.prettierrc.json` y `.prettierignore`
- [x] T005 [P] Configurar Vitest y entornos unitario/integración en `vitest.config.ts` y `tests/setup/vitest.setup.ts`
- [x] T006 [P] Configurar Playwright para Chromium, un worker en CI y reportes sin secretos en `playwright.config.ts`
- [x] T007 Documentar solo nombres y valores ficticios de `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, sin `NEXT_PUBLIC_*`, en `.env.example`
- [x] T008 Definir scripts `format:check`, `lint`, `typecheck`, `openapi:lint`, `test:unit`, `test:integration`, `build` y `test:e2e` con Redocly CLI 2.53.3 fijado en `package.json` y `package-lock.json`

**Checkpoint**: contrato OpenAPI validado y herramientas preparadas; todavía no existe funcionalidad del juego.

---

## Phase 2: Fundamentos compartidos

**Propósito**: establecer límites de capas, tipos compartidos, seguridad y determinismo antes de las historias.

**Bloqueo**: ninguna fase de historia comienza hasta completar esta fase.

- [x] T009 Crear la estructura monolítica modular y reglas de importación entre `src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/`, `tests/unit/`, `tests/integration/` y `tests/e2e/`
- [x] T010 Definir `GameState`, `Snake`, `Cell`, `PendingResult`, `ResultState` y `SavedResultRef` con todos los invariantes de `data-model.md` en `src/domain/game/model.ts`
- [x] T011 [P] Definir puertos inyectables de reloj, UUID y generación de posiciones sin dependencias de React, Next.js o Supabase en `src/application/ports/game-dependencies.ts`
- [x] T012 [P] Implementar carga server-only y validación de variables, rechazando valores ausentes sin imprimir secretos, en `src/infrastructure/config/server-env.ts`
- [x] T013 [P] Definir lectura JSON limitada a 4096 bytes y respuestas controladas 405, 409, 413, 422 y 503 en `src/infrastructure/http/request-body.ts` y `src/infrastructure/http/error-response.ts`
- [x] T014 [P] Crear reloj falso, UUID fijo, generador de posiciones por secuencia y factories de partida sin azar real en `tests/helpers/game-fixtures.ts`
- [x] T015 [P] Crear estructura semántica accesible, foco visible y regiones de estado que no dependan solo del color en `src/app/page.tsx` y `src/app/globals.css`
- [x] T016 Configurar logging server-only con códigos controlados y redacción de credenciales en `src/infrastructure/observability/server-logger.ts`
- [x] T017 Ampliar CI con jobs `openapi`, `format-lint`, `typecheck`, `unit-tests`, `integration-tests`, `build` y `e2e`, sus `needs`, ausencia de `continue-on-error` y ejecución en PR/main en `.github/workflows/ci.yml`

**Checkpoint**: fundamentos compartidos listos y comprobables sin implementar comportamiento de historias.

---

## Phase 3: User Story 1 — Gestionar el ciclo de la partida (Priority: P1) 🎯 MVP

**Objetivo**: preparar, iniciar, pausar, reanudar y reiniciar una partida, incluidos los estados de resultado pendiente y guardado.

**Prueba independiente**: con un reloj falso, `Enter`, `Espacio` y `R` producen únicamente las transiciones admitidas; Playwright observa estados y confirmaciones sin requerir movimiento, alimento o persistencia real.

### Pruebas de HU-001

- [x] T018 [P] [US1] Escribir pruebas unitarias inicialmente fallidas de `prepared`, `START`, configuración válida y estado visible para RF-001 y RF-002 en `tests/unit/game/state-machine-lifecycle.test.ts`
- [x] T019 [P] [US1] Escribir pruebas unitarias inicialmente fallidas de pausa, reanudación, conservación durante 10 segundos y acciones incompatibles para RF-003 y RF-004 en `tests/unit/game/state-machine-pause.test.ts`
- [x] T020 [P] [US1] Escribir pruebas unitarias inicialmente fallidas de reinicio desde todos los estados y confirmación Guardar/Descartar/Cancelar para RF-005 y RF-030 en `tests/unit/game/state-machine-restart.test.ts`
- [x] T021 [P] [US1] Escribir recorrido E2E inicialmente fallido de `Enter`, `Espacio`, `R`, estados visibles en un máximo de 1 segundo (CE-002) y reinicio preparado con puntuación cero para RF-001 a RF-005 y RF-030 en `tests/e2e/hu-001-game-lifecycle.spec.ts`

### Implementación de HU-001

- [x] T022 [US1] Implementar comandos, guardas y transiciones `prepared`, `running`, `paused` y `finished` para RF-001 a RF-004 en `src/domain/game/state-machine.ts`
- [x] T023 [US1] Implementar reinicio directo y estados `pending`, `saving`, `saveError`, `saved` con confirmación de tres opciones para RF-005 y RF-030 en `src/domain/game/state-machine.ts`
- [x] T024 [US1] Implementar temporizador de tick fijo, despacho de comandos y limpieza segura al desmontar en `src/presentation/hooks/use-snake-game.ts`
- [x] T025 [P] [US1] Crear controles y estado visible en español para iniciar, pausar y reanudar en `src/presentation/components/game-controls.tsx` y `src/presentation/components/game-status.tsx`
- [x] T026 [P] [US1] Crear diálogo accesible Guardar primero/Descartar/Cancelar sin pérdida accidental del pendiente en `src/presentation/components/restart-confirmation.tsx`
- [x] T027 [US1] Integrar HU-001 en `src/app/page.tsx` y hacer pasar `tests/unit/game/state-machine-lifecycle.test.ts`, `tests/unit/game/state-machine-pause.test.ts`, `tests/unit/game/state-machine-restart.test.ts` y `tests/e2e/hu-001-game-lifecycle.spec.ts`

**Checkpoint**: HU-001 funciona y se prueba de forma independiente como MVP; no se avanza sin evidencia y aprobación aplicables.

---

## Phase 4: User Story 2 — Controlar la serpiente con el teclado (Priority: P1)

**Objetivo**: aceptar una sola dirección válida por desplazamiento y rechazar entradas incompatibles.

**Prueba independiente**: con una serpiente fixture y ticks manuales, las cuatro flechas actualizan solo la dirección pendiente permitida; no requieren alimento, colisión ni base de datos.

### Pruebas de HU-002

- [x] T028 [P] [US2] Escribir pruebas unitarias inicialmente fallidas para cuatro flechas, primera dirección válida, rechazo de opuesta sin consumir oportunidad e ignorado por estado/tecla para RF-006 a RF-010 en `tests/unit/game/movement.test.ts`
- [x] T029 [P] [US2] Escribir recorrido E2E inicialmente fallido de reconocimiento visual menor o igual a 100 ms y movimiento solo en el tick siguiente para RF-006 a RF-010 en `tests/e2e/hu-002-keyboard-control.spec.ts`

### Implementación de HU-002

- [x] T030 [US2] Implementar direcciones, oposición y cálculo de siguiente celda como funciones puras en `src/domain/game/movement.ts`
- [x] T031 [US2] Incorporar `QUEUE_DIRECTION` con primera entrada válida, oportunidad conservada tras oposición e ignorado posterior en `src/domain/game/state-machine.ts`
- [x] T032 [US2] Capturar flechas únicamente durante `running`, impedir desplazamiento de página y limpiar listeners en `src/presentation/hooks/use-snake-game.ts`
- [x] T033 [P] [US2] Mostrar reconocimiento visual de la dirección aceptada sin mover anticipadamente la serpiente en `src/presentation/components/game-status.tsx`
- [x] T034 [US2] Integrar HU-002 y hacer pasar `tests/unit/game/movement.test.ts` y `tests/e2e/hu-002-keyboard-control.spec.ts`

**Checkpoint**: HU-002 es verificable con ticks y entradas controlados, conservando HU-001.

---

## Phase 5: User Story 3 — Consumir alimentos, crecer y puntuar (Priority: P1)

**Objetivo**: mantener un alimento válido, crecer un segmento y sumar 10 puntos una vez por consumo a velocidad constante.

**Prueba independiente**: una secuencia fija de alimentos permite observar consumo, crecimiento, puntuación, reposición y tablero completo sin persistencia.

### Pruebas de HU-003

- [x] T035 [P] [US3] Escribir pruebas unitarias inicialmente fallidas de alimento único, celda libre y reposición para RF-011, RF-012 y RF-015 en `tests/unit/game/food.test.ts`
- [x] T036 [P] [US3] Escribir pruebas unitarias inicialmente fallidas de consumo único, crecimiento, suma exacta de 10, tablero completo y tick constante de 150 ms para RF-013, RF-014 y RF-029 en `tests/unit/game/scoring.test.ts`
- [x] T037 [P] [US3] Escribir recorrido E2E inicialmente fallido con posiciones deterministas para RF-011 a RF-015 y RF-029 en `tests/e2e/hu-003-food-and-score.spec.ts`

### Implementación de HU-003

- [x] T038 [P] [US3] Implementar suma inmutable de 10 y crecimiento de un segmento exactamente una vez en `src/domain/game/scoring.ts`
- [x] T039 [P] [US3] Implementar selección de alimento exclusivamente entre celdas libres mediante el puerto inyectable en `src/domain/game/food.ts`
- [x] T040 [US3] Integrar consumo, liberación de cola, crecimiento, reposición y tablero completo en el orden aprobado dentro de `src/domain/game/state-machine.ts`
- [x] T041 [US3] Mantener el temporizador efectivo constante en 150 ms sin depender de puntuación, tiempo o consumos en `src/presentation/hooks/use-snake-game.ts`
- [x] T042 [US3] Representar serpiente, alimento y puntuación sin depender solo del color y hacer pasar las pruebas HU-003 en `src/presentation/components/game-board.tsx` y `src/presentation/components/game-status.tsx`

**Checkpoint**: HU-003 funciona con generador y reloj controlados, sin ampliar el alcance.

---

## Phase 6: User Story 4 — Finalizar por colisión (Priority: P1)

**Objetivo**: finalizar por pared o cuerpo, aplicar correctamente la excepción de cola liberada y congelar la partida.

**Prueba independiente**: fixtures de tablero fuerzan pared, cuerpo, cola liberada, cola retenida y eventos posteriores sin usar persistencia.

### Pruebas de HU-004

- [x] T043 [P] [US4] Escribir pruebas unitarias inicialmente fallidas de pared, cuerpo, cola liberada y cola no liberada para RF-016 y RF-017 en `tests/unit/game/collisions.test.ts`
- [x] T044 [P] [US4] Escribir pruebas unitarias inicialmente fallidas de inmovilidad, puntuación congelada, causa visible y resultado único frente a eventos posteriores para RF-018 a RF-020 en `tests/unit/game/finished-state.test.ts`
- [x] T045 [P] [US4] Escribir recorrido E2E inicialmente fallido de cada causa y pantalla final para RF-016 a RF-020 en `tests/e2e/hu-004-collisions.spec.ts`

### Implementación de HU-004

- [x] T046 [US4] Implementar detección pura de pared y ocupación resultante tras liberar o conservar la cola en `src/domain/game/collisions.ts`
- [x] T047 [US4] Integrar finalización irreversible, `finishReason`, `finishedAt` y creación máxima de un pendiente en `src/domain/game/state-machine.ts`
- [x] T048 [P] [US4] Crear pantalla de resultados con causa y puntuación definitiva en español en `src/presentation/components/game-result.tsx`
- [x] T049 [US4] Bloquear ticks, direcciones y cambios de puntuación tras finalizar en `src/presentation/hooks/use-snake-game.ts`
- [x] T050 [US4] Integrar HU-004 y hacer pasar `tests/unit/game/collisions.test.ts`, `tests/unit/game/finished-state.test.ts` y `tests/e2e/hu-004-collisions.spec.ts`

**Checkpoint**: HU-004 finaliza y congela cada partida con causa verificable.

---

## Phase 7: User Story 5 — Persistir resultados y consultar Top 10 (Priority: P2)

**Objetivo**: validar alias, guardar una vez por partida y consultar un ranking determinista y persistente.

**Prueba independiente**: con Supabase local desechable y datos semilla, guardar y reintentar resultados —incluido cero—, consultar menos de diez y Top 10, verificar empates y simular fallos controlados.

### Pruebas de HU-005

- [x] T051 [P] [US5] Escribir pruebas unitarias inicialmente fallidas que primero recorten y luego acepten 1–20 letras Unicode, números, espacios, guiones y guiones bajos, permitiendo alias repetidos, para RF-026 y RF-027 en `tests/unit/results/result-schema.test.ts`
- [x] T052 [P] [US5] Escribir pruebas unitarias inicialmente fallidas de `PendingResult` con puntuación entera no negativa, inmutable y múltiplo de 10, estados `pending/saving/saveError/saved`, pérdida al recargar y descarte para RF-021 en `tests/unit/results/result-state.test.ts`
- [x] T053 [P] [US5] Escribir pruebas unitarias inicialmente fallidas de Guardar primero, fallo conservado y reinicio directo tras `saved` para RF-030 y RF-031 en `tests/unit/results/restart-after-save.test.ts`
- [x] T054 [P] [US5] Escribir pruebas de contrato inicialmente fallidas para 200, 201, 405, 409, 413, 422 y 503, cuerpo máximo 4096 bytes y schemas OpenAPI para RF-022, RF-026 a RF-028 y RF-031 en `tests/integration/http/results-contract.test.ts`
- [x] T055 [P] [US5] Escribir integración inicialmente fallida de `ORDER BY score DESC, achieved_at ASC, game_id ASC LIMIT 10`, empates y menos de diez resultados para RF-024 y RF-025 en `tests/integration/persistence/ranking.test.ts`
- [x] T056 [P] [US5] Escribir integración inicialmente fallida de persistencia entre sesiones e idempotencia created/alreadyRecorded/conflict para RF-022, RF-023 y RF-028 en `tests/integration/persistence/result-repository.test.ts`
- [x] T057 [P] [US5] Escribir recorridos E2E inicialmente fallidos de alias, puntuación cero, guardado, reintento, ranking por estados permitidos y recarga para RF-021 a RF-028 y RF-031 en `tests/e2e/hu-005-results-ranking.spec.ts`

### Persistencia, API y aplicación de HU-005

- [x] T058 [P] [US5] Definir `ResultRepository` con operaciones idempotentes de guardar y Top 10, sin exponer Supabase al dominio, en `src/application/ports/result-repository.ts`
- [x] T059 [US5] Crear migración `game_results` con `game_id uuid NOT NULL PRIMARY KEY`, `alias varchar(20) NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 20)`, `score integer NOT NULL CHECK (score >= 0 AND score % 10 = 0)`, `achieved_at timestamptz NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, índice `(score DESC, achieved_at ASC, game_id ASC)` y sin privilegios públicos en `supabase/migrations/202610200001_create_game_results.sql`
- [ ] T060 [P] [US5] Configurar Supabase local y semilla de al menos 15 resultados con empates, UUID y fechas fijos en `supabase/config.toml` y `supabase/seed.sql`
- [x] T061 [P] [US5] Implementar cliente Supabase exclusivamente server-only usando configuración validada en `src/infrastructure/supabase/server-client.ts`
- [x] T062 [US5] Implementar normalización y validación cerrada de `gameId` UUID, alias corregible, `score >= 0` y múltiplo de 10, y `achievedAt` UTC en `src/infrastructure/validation/result-schema.ts`
- [x] T063 [US5] Implementar Repository con inserción, reintento idéntico, conflicto sin sobrescritura y Top 10 determinista en `src/infrastructure/persistence/supabase-result-repository.ts`
- [x] T064 [P] [US5] Implementar casos de uso de guardado y consulta con traducción controlada de fallos en `src/application/use-cases/save-result.ts` y `src/application/use-cases/get-ranking.ts`
- [x] T065 [US5] Implementar `POST /api/results` con límite previo de 4096 bytes y respuestas OpenAPI 200/201/405/409/413/422/503 en `src/app/api/results/route.ts`
- [x] T066 [US5] Implementar `GET /api/ranking` con respuestas OpenAPI 200/405/503 y máximo de diez filas en `src/app/api/ranking/route.ts`
- [x] T067 [P] [US5] Crear formulario de alias y mensajes corregibles que conserven el pendiente hasta guardar, descartar o cerrar/recargar en `src/presentation/components/result-form.tsx`
- [x] T068 [P] [US5] Crear ranking accesible desde `prepared` y `finished`, nunca desde `running` o `paused`, en `src/presentation/components/ranking.tsx`
- [x] T069 [US5] Integrar guardado, reintentos, estados `saveError/saved`, reinicio y ranking; hacer pasar todas las pruebas HU-005 en `src/presentation/hooks/use-snake-game.ts` y `src/app/page.tsx`

**Evidencia HU-005 / KAN-5 (2026-10-21)**: T051–T059 y T061–T069 verificadas mediante pruebas unitarias, contrato HTTP, SDK con transporte simulado, E2E y dos suites reales contra el proyecto de pruebas autorizado. La migración T059 se aplicó una sola vez con autorización específica; después se autorizaron once resultados automatizados controlados, sin semilla ni limpieza. Se aprobó expresamente conservar los ocho jobs de CI y ejecutar la persistencia real fuera de CI, sin secretos remotos en GitHub. T060 permanece pendiente: configuración y semilla preparadas, pero Supabase local no ejecutado ni validado. La evidencia detallada y los límites están en `supabase/README.md`; la revisión humana y Jira siguen pendientes.

**Evidencia manual adicional de T056, T057 y T069 (2026-10-21)**: con autorización humana específica se guardó una sola partida real, alias `KAN5_Manual_1`, 10 puntos, UUID `8d892e32-60ba-4485-a522-96a3afef42b7`. Consultas por alias e identificador acreditaron un único registro nuevo (total 11 → 12), conservado sin cambios después de recargar la aplicación; la página recargada lo mostró además en posición 10. Sin fixtures, relojes simulados, semillas, limpiezas ni migraciones. Detalle en `supabase/README.md`. No se alteran otras tareas ni la excepción de CI; T060 sigue pendiente.

**Checkpoint**: HU-005 es persistente, idempotente y verificable con Supabase local; ninguna operación remota queda autorizada.

---

## Phase 8: Pulido y controles transversales

**Propósito**: verificar requisitos no funcionales, seguridad, documentación, CI y preparación de revisión sin desplegar.

- [ ] T070 [P] Implementar mediciones reproducibles de 100 muestras, calentamiento y p95 para RNF-002 y RNF-003 en `tests/e2e/performance-rnf.spec.ts`
- [ ] T071 [P] Añadir pruebas de teclado, foco, etiquetas, estados no dependientes solo del color y textos españoles para RNF-001, RNF-004 y RNF-009 en `tests/e2e/accessibility-and-language.spec.ts`
- [ ] T072 [P] Añadir comprobaciones de ausencia de secretos y mensajes sanitizados para RNF-005 a RNF-007 en `tests/integration/security/secrets-and-errors.test.ts`
- [ ] T073 Ejecutar en base local desechable y con autorización previa `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run openapi:lint`, `npm run test:unit`, `npm run test:integration`, `npm run build` y `npm run test:e2e`, registrando resultados reales en `specs/001-snake-game/quickstart.md`
- [ ] T074 Revisar que cada prueba y tarea mantenga las claves de las cinco HU y RF-001 a RF-031, corrigiendo únicamente trazabilidad en `specs/001-snake-game/tasks.md`
- [ ] T075 [P] Documentar variables Development/Preview/Production, build y límites de despliegue sin valores sensibles ni ejecución remota en `README.md` y `vercel.json`
- [ ] T076 Validar que los jobs y `needs` reales coincidan con el Plan y que ningún fallo/cancelación/omisión se considere éxito en `.github/workflows/ci.yml`
- [ ] T077 Registrar evidencias, riesgos y pendientes para revisión humana de implementación sin realizar Jira, commit, push, PR o despliegue en `specs/001-snake-game/tasks.md`

**Checkpoint final**: todos los tests y controles aplicables deben aportar evidencia real; completar Tasks no autoriza Analyze ni Implement sin sus puertas humanas.

---

## Matriz RF → tareas y pruebas

| RF | Implementación principal | Prueba/evidencia principal |
|---|---|---|
| RF-001 | T022, T025 | T018, T021, T027 |
| RF-002 | T022, T024, T025 | T018, T021, T027 |
| RF-003 | T022, T024, T025 | T019, T021, T027 |
| RF-004 | T022, T024, T025 | T019, T021, T027 |
| RF-005 | T023, T026 | T020, T021, T027 |
| RF-006 | T030, T032 | T028, T029, T034 |
| RF-007 | T030, T031 | T028, T029, T034 |
| RF-008 | T030, T031 | T028, T029, T034 |
| RF-009 | T031, T032 | T028, T029, T034 |
| RF-010 | T031, T032 | T028, T034 |
| RF-011 | T039, T040 | T035, T037, T042 |
| RF-012 | T039, T040 | T035, T037, T042 |
| RF-013 | T040 | T036, T037, T042 |
| RF-014 | T038, T040 | T036, T037, T042 |
| RF-015 | T039, T040 | T035, T037, T042 |
| RF-016 | T046, T047 | T043, T045, T050 |
| RF-017 | T046, T047 | T043, T045, T050 |
| RF-018 | T047, T049 | T044, T045, T050 |
| RF-019 | T047, T048 | T044, T045, T050 |
| RF-020 | T047, T049 | T044, T050 |
| RF-021 | T047, T067, T069 | T052, T057 |
| RF-022 | T059, T062–T065 | T054, T056, T057 |
| RF-023 | T063, T066 | T056, T057 |
| RF-024 | T063, T064, T066, T068 | T055, T057 |
| RF-025 | T059, T063 | T055, T057 |
| RF-026 | T062, T065, T067 | T051, T054, T057 |
| RF-027 | T062, T067, T069 | T051, T054, T057 |
| RF-028 | T063–T069 | T054–T057 |
| RF-029 | T040, T041 | T036, T037, T042, T070 |
| RF-030 | T023, T026, T069 | T020, T053, T057 |
| RF-031 | T064, T065, T069 | T053, T054, T057 |

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Phase 1**: T001 es la primera puerta absoluta; T002–T008 dependen de su éxito.
- **Phase 2**: depende de Phase 1 y bloquea todas las historias.
- **HU-001**: depende de Phase 2 y constituye el MVP.
- **HU-002**: depende de HU-001 para el estado `running`, pero sus reglas direccionales se prueban aisladamente.
- **HU-003**: depende de HU-002 para aplicar movimiento, pero alimento y puntuación usan fixtures aislados.
- **HU-004**: depende de HU-002 para el siguiente movimiento; puede desarrollarse en paralelo con HU-003 tras HU-002.
- **HU-005**: depende de HU-001/HU-004 solo para la integración visual del resultado; persistencia, API y ranking pueden avanzar tras Phase 2 con fixtures.
- **Phase 8**: depende de las historias incluidas en la entrega y nunca autoriza un despliegue.

### Orden dentro de cada historia

1. Escribir pruebas y comprobar que fallan por la ausencia del comportamiento.
2. Implementar modelos y reglas de dominio.
3. Implementar aplicación e infraestructura necesarias.
4. Integrar presentación o endpoints.
5. Ejecutar las pruebas de la historia y conservar evidencia.

### Oportunidades de paralelización

- Setup: T003–T007 pueden dividirse después de T002; T008 espera sus decisiones de scripts.
- Fundamentos: T011–T015 pueden avanzar en archivos distintos después de T009–T010.
- HU-001: T018–T021 y luego T025–T026 pueden prepararse en paralelo.
- HU-002: T028–T029 y después T030/T033 pueden ejecutarse en paralelo.
- HU-003: T035–T037 y después T038–T039 pueden ejecutarse en paralelo.
- HU-004: T043–T045 y T048 pueden ejecutarse en paralelo respetando la escritura previa de pruebas.
- HU-005: T051–T057, T058/T060/T061 y T067/T068 ofrecen grupos paralelos con archivos independientes.
- Transversales: T070–T072 y T075 pueden avanzar en paralelo después de las historias aplicables.

## Ejemplos paralelos por historia

```text
HU-001: T018 + T019 + T020 + T021; después T025 + T026
HU-002: T028 + T029; después T030 + T033
HU-003: T035 + T036 + T037; después T038 + T039
HU-004: T043 + T044 + T045; después T046 + T048
HU-005: T051 + T052 + T053 + T054 + T055 + T056 + T057
```

## Estrategia de implementación

### MVP primero

1. Completar T001 y obtener validación OpenAPI real.
2. Completar Setup y Fundamentos.
3. Implementar y validar únicamente HU-001.
4. Detenerse para evidencia y revisión humana antes de ampliar el incremento.

### Entrega incremental

1. HU-001: ciclo de partida.
2. HU-002: control direccional.
3. HU-003 y HU-004: reglas de tablero, potencialmente en paralelo después de HU-002.
4. HU-005: persistencia y ranking, con su núcleo de datos desacoplado y posterior integración visual.
5. Controles transversales y revisión final.

## Notas de gobernanza

- Todas las tareas permanecen sin marcar hasta su ejecución y evidencia.
- Aprobación humana de las 77 tareas registrada el 2026-10-20, sin autorización para ejecutarlas.
- T001/CHK023 bloquea toda implementación; documentar el comando no equivale a haberlo ejecutado.
- Los comandos destructivos de Supabase requieren autorización humana y una base local desechable confirmada.
- Cada historia debe desarrollarse en su rama GitHub Flow independiente desde `main` actualizado y con clave Jira real, únicamente cuando exista autorización específica para Jira y Git.
- No se permiten commits, pushes, PR, merges, Jira, despliegues o cambios de fase por inferencia de este documento.

## Registro de ejecución autorizado — HU-001 / KAN-2

- Propuesta de implementación; requiere revisión humana del PR antes de integrar.
- Autorización humana del 2026-10-20 en el chat `Inspeccionar entorno Snake SDD`: Constitution, Specify, Clarify, Plan, Checklist, Tasks y Analyze aprobados; ejecución de T002–T027 y operaciones Git/Jira de KAN-2 autorizadas.
- T001 ejecutada previamente con Redocly CLI 2.53.3 y Node 24.19.0, código 0; evidencia y aprobación Analyze en KAN-5, comentario 10000. No se repite esta puerta.
- Base de HU-001: main/origin/main `8bf5701af50298e3cb99bca34f4fdcca72bfc1f8`; rama `feature/KAN-2-game-lifecycle`.
- T018–T020: el intento anterior registró pruebas fallidas por ausencia de `state-machine.ts`, seguidas de 11 unitarias satisfactorias. T021: fallo inicial por ausencia de servidor y posterior fallo real del selector de alerta; corregido en este incremento. T026: regresión de foco fallida antes de corregir el diálogo modal.
- No se implementan movimiento, alimento, colisiones ni persistencia real. Los estados finales de HU-001 se verifican con fixtures habilitados solo por `E2E_FIXTURES=1` y dobles de guardado.
- HU-002 requiere HU-001 revisada e integrada y una rama desde main actualizado. No se inicia mientras falte esa base.
- Verificación local final: Node 24.19.0; `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run openapi:lint`, `npm run test:unit` (11), `npm run test:integration` (10), `npm run build` y `npm run test:e2e` (6, Chromium/build de producción, un worker): códigos 0. La validación OpenAPI pre-PR es el control obligatorio de publicación; no repite la fase T001.
- Fallos reales conservados en el historial del chat: arranque E2E previo sin sockets, selector de alerta ambiguo, navegación Tab del diálogo, dependencia React y tipo ProcessEnv del entorno ficticio. Corregidos y revalidados los controles afectados.
- T002–T017: herramientas, versiones exactas/lockfile, límites de capas, modelos/puertos, fixtures, HTTP limitado, configuración y logging server-only; CI ampliada conservando repository-integrity. Integración actual valida exclusivamente Fundamentos; persistencia/Supabase corresponde a HU-005 y no se declara probada.
- T018–T027: ciclo prepared/running/paused, reinicio directo y protegido, guardado simulado sin afirmar persistencia, pausa equivalente a 10 segundos, diálogo modal con foco y cancelación segura, interfaz española y regiones accesibles. RF-001–RF-005 y RF-030 referenciados en las pruebas.
- El bloque Next.js añadido por el framework en AGENTS.md se conserva como parte del Setup; no se modificaron constitución, Spec Kit ni especificación.

## Registro de ejecución autorizado — HU-002 / KAN-1

- Propuesta de implementación en `feature/KAN-1-snake-movement`, creada desde `main` actualizado tras integrar el PR #4; requiere revisión humana antes del merge.
- T028–T029: pruebas escritas primero; la prueba unitaria falló inicialmente por ausencia de `movement.ts` y la E2E detectó dos configuraciones no deterministas del reloj antes de quedar corregida.
- T030–T034: movimiento puro en las cuatro direcciones, una entrada válida por tick, rechazo de opuesta sin consumir la oportunidad, entradas adicionales ignoradas, captura solo en `running`, prevención del desplazamiento de página y reconocimiento visual inmediato.
- El desplazamiento ocurre únicamente en el tick fijo de 150 ms. No se implementaron alimento, crecimiento, colisiones ni persistencia.
- Evidencia local: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run openapi:lint`, `npm run test:unit` (22), `npm run test:integration` (10), `npm run build` y `npm run test:e2e` (9, Chromium/build de producción): códigos 0 tras corregir los fallos del alcance.
- RF-006–RF-010 quedan trazados en `movement.test.ts` y `hu-002-keyboard-control.spec.ts`; la suite E2E conserva seis pruebas de regresión de HU-001.

## Registro de ejecución autorizado — HU-003 / KAN-3

- Propuesta de implementación autorizada expresamente en este chat el 2026-10-21 para T035–T042, commit, push y PR Draft; pendiente de revisión y aceptación humana, sin autorización de merge ni escrituras Jira.
- Rama `feature/KAN-3-food-scoring` desde `origin/main` actualizado (`ac5a06f`, PR #8 y #9 integrados), en worktree limpio; se conserva el checkout original con su cambio local en `next-env.d.ts`.
- T035–T037: pruebas escritas antes del código; fallos iniciales por ausencia de los módulos de dominio y del tablero. La ejecución inicial de E2E reutilizó un servidor HU-002 ya abierto; se aisló después en el puerto 3003 mediante configuración temporal externa. En desarrollo no se observó el inicio bajo reloj pausado; la validación definitiva usa el build de producción, como CI.
- T038–T042: alimento único validado mediante el puerto existente, crecimiento inmutable y suma única de 10, reposición entre celdas libres, cola conservada solo al consumir y tablero completo con resultado pendiente sin pedir otra posición. El temporizador conserva sus 150 ms y depende solo del estado de ejecución. SVG y leyenda distinguen cabeza, cuerpo y alimento por formas, además del color; puntuación y longitud son texto accesible.
- Casos límite verificados: generador inválido, última celda libre, ausencia de celdas libres, consumo repetido, pausa/finalización, liberación de cola y longitud mínima sin consumo. Esta última prueba detectó y corrigió la conservación indebida de la cabeza anterior. La expectativa E2E de reposición tras el segundo consumo se corrigió a `(5,0)`, pues `(1,0)` permanece ocupada.
- Evidencia local final: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run openapi:lint`, `npm run test:unit` (40, de ellas 18 de HU-003), `npm run test:integration` (10), `npm run build` y Playwright sobre producción con un worker, puerto aislado y sin reintentos (11 E2E): códigos 0. Solo se repitieron controles afectados por las correcciones.
- T043–T077 permanecen pendientes. No se implementan colisiones ni persistencia; no se modifican pruebas anteriores, la corrección del reloj del PR #9, Skills, hooks, Spec Kit ni configuración de CI. La CI del commit y la decisión humana se consultarán en el PR de KAN-3.

### Corrección tras revisión manual — PR #10

- Ajustes autorizados en este chat el 2026-10-21, conservando HU-001: `R` y el botón Reiniciar dejan una partida preparada e inmóvil; solo `Enter` o Iniciar la ponen en curso. No se modifica la especificación ni la máquina de estados.
- Reproducido en Chromium sin reloj falso: tras pulsar Reiniciar, el foco permanece en ese botón; Enter despachaba START y también su clic nativo, causando otro reinicio. Se evita el clic nativo únicamente al iniciar desde preparada, sin alterar los botones del diálogo de resultados.
- Reproducida la falta de hidratación en desarrollo al usar `127.0.0.1`, mientras `localhost` funcionaba. Next.js bloqueaba HMR; el registro manual también mostraba la IP local. Se admiten explícitamente loopback y las direcciones IPv4 de las interfaces del propio equipo mediante `allowedDevOrigins`, sin comodines ni orígenes externos.
- El recorrido en la IP local detectó además `crypto.randomUUID is not a function` al reiniciar por HTTP. El adaptador conserva esa API cuando existe y, si no, genera UUID v4 con 16 bytes de `crypto.getRandomValues`, sin usar `Math.random` ni alterar el contrato de identificación.
- Panel visible: Estado, Puntuación y Ritmo. Cabeza, dirección y longitud siguen en el modelo y como datos ocultos de observación para conservar todas las aserciones funcionales anteriores.
- Nueva regresión E2E sin reloj falso: inicio con Enter sin clic previo, pausa/reanudación por botón, reinicio por botón y R, inmovilidad hasta Enter incluso con foco en Reiniciar, flecha sin desplazamiento de página y panel simplificado. CI ejecuta este recorrido también con `next dev`, además del build de producción.
- Límite actual: todavía no se detectan choques contra pared o cuerpo, ni existe transición a «Partida terminada» por choque; corresponde a HU-004 (T043–T049). HU-003 conserva exclusivamente el final válido por tablero completado (RN-010).
- Comprobación manual: ejecutar `npm run dev` y abrir el puerto que anuncie Next.js; al cargar pulsar Enter sin seleccionar nada. Probar flechas, Pausar/Reanudar y Espacio. Reiniciar por botón o R debe mostrar Preparada y detener el movimiento; pulsar Enter de nuevo sin cambiar el foco debe iniciar. Solo deben verse Estado, Puntuación y Ritmo en el panel. No usar choques como condición de finalización en este incremento.
- Evidencia de la corrección: la regresión falló primero en Enter con foco en Reiniciar y después detectó el error UUID en la IP local; ambos recorridos pasan tras corregirlos. Verificación final con dependencias existentes y copia aislada en LF: formato, lint, tipos, OpenAPI, build, 42 unitarias, 10 de integración, 13 E2E de producción y 2 E2E con `next dev`, sin reintentos: códigos 0. También se verificó el navegador contra el servidor manual en localhost, loopback y la IP del propio equipo. El primer control de formato de la copia detectó CRLF de la exportación; se corrigió únicamente esa exportación, sin reformatear el repositorio ni tocar `next-env.d.ts` local.

## Registro de ejecución autorizado — HU-004 / KAN-4

- Propuesta autorizada expresamente en este chat el 2026-10-21 para HU-004, commit, push y PR Draft. Se verificó que el PR #10 estaba integrado; rama `feature/KAN-4-game-collisions` creada desde `origin/main` actualizado (`1ec2ea7`) en un worktree nuevo. Los otros worktrees y sus cambios locales permanecen intactos.
- T043–T045: pruebas escritas antes del código; fallo inicial por ausencia de `collisions.ts`, siete casos de estado terminal fallidos y tres E2E fallidos por ausencia de colisiones, resultados y fixtures. Evidencia conservada en las salidas del chat. Después pasan 17 unitarias específicas y los tres recorridos E2E nuevos.
- T046–T048: detección pura de las cuatro paredes y del cuerpo tras excluir la cola solo cuando se libera. La colisión se resuelve antes de crecimiento, puntos o reposición; conserva la última posición válida y la puntuación, fija causa y fecha y crea un único pendiente. La misma finalización conserva el caso de tablero completado de HU-003. Resultado visible con «Partida terminada», causa y puntuación definitiva; ranking deshabilitado, sin implementar HU-005.
- T049: se conservan sin duplicar las guardas existentes del hook (temporizador solo en `running` y flechas solo en `running`) y del dominio. Se verifican diez segundos sin movimiento ni cambios de puntos, flechas posteriores ignoradas y resultado/fecha únicos ante eventos repetidos.
- T050: formato, lint, TypeScript, OpenAPI, build, 59 unitarias, 10 de integración, 16 E2E de producción y 2 E2E de desarrollo: códigos 0, con un worker y sin reintentos E2E. Se conservan las pruebas anteriores, el reloj corregido del PR #9, controles/foco del PR #10, comida, crecimiento y tick fijo de 150 ms.
- Comprobación manual: Enter inicia; chocar contra pared o cuerpo muestra la causa y congela la puntuación y la serpiente. R/Reiniciar solicita confirmación si queda resultado pendiente; Cancelar lo conserva y Descartar crea una partida Preparada e inmóvil. Enter inicia la nueva partida. No se añaden persistencia ni ranking funcional.
- T051–T077 permanecen pendientes. Sin modificaciones de Jira, especificación, constitución, Spec Kit, Skills, hooks ni CI. La evidencia remota se registra en el PR de KAN-4; su integración requiere revisión y aceptación humana, sin merge automático.
