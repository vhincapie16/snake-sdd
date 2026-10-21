# Plan de implementación: Juego Snake web

**Rama**: `docs/snake-game-planning` | **Fecha**: 2026-10-20 | **Especificación**: [spec.md](./spec.md)

**Entrada**: especificación aprobada con cinco historias de usuario, 31 requisitos funcionales y nueve aclaraciones.

**Estado**: aprobado formalmente por revisión humana el 2026-10-20.

## Resumen

Se construirá una aplicación web monolítica modular con Next.js, React y TypeScript. El ciclo de Snake se resolverá en un dominio puro mediante una máquina de estados y dependencias inyectables para reloj y generación de posiciones. La presentación React consumirá casos de uso de aplicación; los Route Handlers de Next.js actuarán como límite HTTP; un repositorio de resultados encapsulará PostgreSQL en Supabase. Vercel alojará la aplicación y GitHub Actions verificará formato, tipos, pruebas unitarias, integración y E2E antes de integrar cambios.

El diseño mantiene en memoria la partida y su resultado pendiente. Solo los resultados guardados persisten. La escritura será idempotente por `gameId`, el ranking se ordenará en PostgreSQL y ninguna credencial sensible llegará al navegador.

## Contexto técnico

**Lenguaje y runtime**: TypeScript 5.x sobre Node.js 24 LTS; las versiones exactas se fijarán en `package-lock.json`.

**Dependencias principales**: Next.js 16 con App Router, React 19, cliente oficial de Supabase para acceso exclusivo desde servidor y validación de entradas en el límite HTTP.

**Persistencia**: PostgreSQL administrado por Supabase; migraciones SQL versionadas bajo `supabase/migrations/`.

**Pruebas**: Vitest para dominio, aplicación e integración; Playwright para recorridos E2E de escritorio; Supabase local para pruebas de persistencia.

**Plataforma objetivo**: navegadores de escritorio vigentes; ejecución local y CI en Linux/Node.js 24; despliegue en Vercel.

**Tipo de proyecto**: aplicación web full-stack en un único repositorio y una única unidad desplegable.

**Objetivos de rendimiento**:

- Reconocimiento visual del 95 % de entradas direccionales válidas en menos de 100 ms (RNF-002).
- Movimiento efectivo solo en el siguiente tick fijo de 150 ms.
- Respuesta visible del 95 % de consultas exitosas del ranking en menos de 2 segundos (RNF-003).
- Transiciones de iniciar, pausar, reanudar y reinicio confirmado visibles en menos de 1 segundo (CE-002).

**Restricciones**:

- Exactamente cinco historias y 31 requisitos funcionales; no se amplía el alcance.
- Velocidad constante de 150 ms por desplazamiento durante toda la partida.
- Tablero lógico fijo de 20 × 20 celdas; ambos valores son constantes técnicas configurables, no nuevas reglas funcionales.
- Juego controlado por teclado y orientado a escritorio.
- Resultado pendiente solo en memoria mientras permanece abierta la pantalla de resultados.
- Sin cuentas ni autenticación; el alias no representa identidad.
- Secretos únicamente en variables de entorno del servidor y de GitHub/Vercel.

**Escala y alcance**: proyecto académico de una sola pantalla de juego, dos operaciones persistentes (`guardar resultado` y `consultar ranking`) y una tabla relacional. El índice del ranking evita recorrer la tabla completa aunque crezca el historial.

## Comprobación de la constitución

*PUERTA previa a investigación: superada. Debe reevaluarse después del diseño.*

| Principio o restricción | Evidencia en el plan | Estado |
|---|---|---|
| Alcance controlado | Se conservan 5 HU y 31 RF sin funcionalidades adicionales. | Cumple |
| SDD y supervisión humana | La especificación y este Plan están aprobados; la ejecución de Checklist fue autorizada expresamente y Tasks permanece sujeto a su propia puerta humana. | Cumple |
| Monolito modular por capas | Se separan presentación, aplicación, dominio e infraestructura en una sola aplicación Next.js. | Cumple |
| SOLID, DRY y KISS | Máquina de estados y Repository resuelven problemas concretos; no se añaden buses, microservicios ni ORM. | Cumple |
| Persistencia relacional segura | PostgreSQL, migraciones, restricciones, validación e idempotencia están definidas. | Cumple |
| Calidad y trazabilidad | Vitest, integración y Playwright se asignan a HU/RF y criterios. | Cumple |
| Seguridad y errores | Secretos solo en servidor, validación por capas y errores controlados. | Cumple |
| Entrega verificable | CI y despliegue reproducible se documentan; ningún despliegue se autoriza aquí. | Cumple |
| Documentación en español | Todos los artefactos técnicos se redactan en español. | Cumple |
| Jira | No se realiza ninguna escritura; la trazabilidad documental precede a Jira. | Cumple |

No hay excepciones constitucionales ni decisiones técnicas pendientes de aclaración.

## Diseño arquitectónico

### Capas y dependencias

```text
Presentación (React + App Router)
        ↓
Aplicación (casos de uso y puertos)
        ↓
Dominio (máquina de estados y reglas puras)
        ↑
Infraestructura (adaptadores HTTP/Supabase)
```

- **Dominio**: tipos de partida, tablero, serpiente, alimento, resultado; transición pura `estado + comando + dependencias → nuevo estado + eventos`. No importa React, Next.js ni Supabase.
- **Aplicación**: casos de uso para controlar la partida, guardar resultados y consultar ranking; define `ResultRepository`, reloj e interfaz de generación de posiciones.
- **Infraestructura**: repositorio Supabase, cliente server-only, traducción de errores y adaptadores de reloj/aleatoriedad.
- **Presentación**: componentes React, captura de teclado, temporizador del tick, estado visible, formularios y diálogo de reinicio.
- **Entrada HTTP**: Route Handlers validan JSON, invocan casos de uso y convierten resultados en respuestas del contrato.

Las dependencias apuntan a contratos de aplicación y dominio. El patrón Repository se usa solo en resultados persistentes; el estado efímero del juego no necesita repositorio.

### Máquina de estados de partida

Estados de partida: `prepared`, `running`, `paused` y `finished`. Dentro de `finished`, `resultState` distingue `pending`, `saving`, `saveError` y `saved`. Los tres primeros conservan un `PendingResult` solo en memoria; `saved` conserva una referencia al resultado ya confirmado por persistencia y no se considera pendiente. Cerrar o recargar elimina únicamente los estados pendientes; un resultado `saved` permanece en la base.

Comandos: `START`, `TOGGLE_PAUSE`, `REQUEST_RESTART`, `SAVE_RESULT`, `CONFIRM_SAVE_AND_RESTART`, `CONFIRM_DISCARD_AND_RESTART`, `CANCEL_RESTART`, `QUEUE_DIRECTION`, `TICK`, `SAVE_SUCCEEDED` y `SAVE_FAILED`.

`SAVE_SUCCEEDED` cambia el resultado a `saved` cuando el jugador permanece en resultados; si se originó mediante **Guardar primero**, crea inmediatamente una nueva partida `prepared`. `SAVE_FAILED` produce `saveError` y conserva el mismo `PendingResult`. `REQUEST_RESTART` sobre `saved` reinicia directamente, sin confirmación; sobre `pending` o `saveError` abre las tres opciones aprobadas.

Las guardas rechazan acciones incompatibles, inversiones directas y entradas posteriores a la primera dirección válida. `TICK` resuelve en orden: siguiente cabeza, consumo, liberación de cola, colisión, crecimiento/puntuación, alimento siguiente y tablero completado. Este orden hace verificable la excepción de la celda de la cola.

### Persistencia e idempotencia

- `game_id` identifica de forma única la partida finalizada y es la clave primaria.
- El caso de uso normaliza y valida alias, puntuación y fecha antes de acceder al repositorio.
- La base repite restricciones críticas de longitud y puntuación.
- Un reintento con el mismo `game_id` y los mismos datos devuelve el registro existente; datos distintos para el mismo identificador producen conflicto controlado.
- El ranking ejecuta `ORDER BY score DESC, achieved_at ASC, game_id ASC LIMIT 10` usando un índice equivalente.
- El cliente nunca accede directamente a la tabla ni recibe una clave privilegiada de Supabase.

### Seguridad y errores

- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se leen solo en servidor; ningún secreto usa prefijo `NEXT_PUBLIC_`.
- `.env*` reales permanecen excluidos; `.env.example` solo documentará nombres y valores ficticios.
- Los Route Handlers aceptan como máximo 4096 bytes por cuerpo `application/json`; detienen la lectura al superar el límite y responden 413 sin intentar validar ni persistir la carga. Después aplican esquema cerrado, tipos, normalización de alias y respuestas sin detalles internos.
- La tabla no concede escritura directa a roles públicos; el acceso privilegiado queda encapsulado en el servidor.
- Los errores se clasifican en cuerpo demasiado grande (413, no reintentable sin reducir la carga), validación (422, no reintentable sin corregir), conflicto idempotente (409, no reintentable con los mismos datos), método no permitido (405, no reintentable) y persistencia no disponible (503, reintentable).
- Como no hay autenticación, la primera versión valida integridad de forma y dominio, pero no pretende demostrar que una puntuación fue obtenida legítimamente; incorporar antitrampas ampliaría el alcance.

| Configuración | Desarrollo local | CI | Vercel Preview/Production | Exposición al navegador |
|---|---|---|---|---|
| `SUPABASE_URL` | `.env.local` no versionado | Secret/variable del entorno CI | Variable separada por entorno | Prohibida en esta versión |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` no versionado | Secret del entorno CI | Secret separado por entorno | Siempre prohibida |

La primera versión no requiere variables `NEXT_PUBLIC_*`. Los nombres pueden documentarse en `.env.example`, pero sus valores deben ser ficticios.

## Estrategia de pruebas y trazabilidad

| Nivel | Alcance | Trazabilidad principal | Determinismo |
|---|---|---|---|
| Unitarias (Vitest) | Máquina de estados, cola de dirección, tick, colisiones, crecimiento, puntuación, tablero completo, alias y orden | HU-001 a HU-004; RF-001 a RF-020, RF-026, RF-029, RF-030 | Reloj falso, temporizadores falsos y generador de posiciones inyectado |
| Integración (Vitest + Supabase local) | Migración, restricciones, repositorio, idempotencia, ranking y errores HTTP | HU-005; RF-021 a RF-028, RF-031 | Datos semilla aislados y reloj fijo |
| E2E (Playwright) | Inicio, teclado, pausa, reinicio, finalización, guardado, error y ranking | Criterios y escenarios de las cinco HU | Configuración de prueba con semilla fija y API controlada |

Cada prueba deberá nombrar la HU y los RF cubiertos. Los casos de empate usarán fechas e identificadores fijos; las pruebas del movimiento no dependerán de tiempo real.

### Matriz detallada de trazabilidad técnica

| RF | HU | Componentes previstos | Evidencia de prueba prevista |
|---|---|---|---|
| RF-001 | HU-001 | `domain/game/model.ts`, `state-machine.ts`, presentación | Unitarias de estados; E2E del estado visible |
| RF-002 | HU-001 | `state-machine.ts`, `use-snake-game.ts` | Unitarias de `START`; E2E con `Enter` |
| RF-003 | HU-001 | `state-machine.ts`, temporizador de presentación | Unitarias de pausa; E2E con `Espacio` |
| RF-004 | HU-001 | `state-machine.ts`, temporizador de presentación | Unitarias de reanudación; E2E con `Espacio` |
| RF-005 | HU-001 | `state-machine.ts`, diálogo de reinicio | Unitarias de reinicio por estado; E2E con `R` |
| RF-006 | HU-002 | `movement.ts`, `use-snake-game.ts` | Unitarias de flechas admitidas; E2E de teclado |
| RF-007 | HU-002 | `movement.ts`, `state-machine.ts` | Unitarias de primera dirección válida por tick |
| RF-008 | HU-002 | `movement.ts`, `state-machine.ts` | Unitarias de dirección opuesta y oportunidad conservada |
| RF-009 | HU-002 | `state-machine.ts`, `use-snake-game.ts` | Unitarias por estado; E2E de entrada ignorada |
| RF-010 | HU-002 | `use-snake-game.ts`, `state-machine.ts` | Unitarias y E2E de teclas no admitidas |
| RF-011 | HU-003 | `model.ts`, `state-machine.ts` | Unitarias del único alimento durante juego activo |
| RF-012 | HU-003 | `model.ts`, generador de posiciones inyectado | Unitarias con secuencias de celdas controladas |
| RF-013 | HU-003 | `movement.ts`, `state-machine.ts` | Unitarias de coincidencia cabeza-alimento |
| RF-014 | HU-003 | `scoring.ts`, `state-machine.ts` | Unitarias de crecimiento y suma única de 10 puntos |
| RF-015 | HU-003 | `state-machine.ts`, generador de posiciones inyectado | Unitarias de reposición y ausencia de celdas libres |
| RF-016 | HU-004 | `collisions.ts`, `state-machine.ts` | Unitarias de límites; E2E de finalización por pared |
| RF-017 | HU-004 | `collisions.ts`, `movement.ts` | Unitarias de cuerpo, cola liberada y cola retenida |
| RF-018 | HU-004 | `state-machine.ts`, presentación | Unitarias de estado terminal; E2E sin cambios posteriores |
| RF-019 | HU-004 | `model.ts`, componentes de resultados | Unitarias de causa; E2E de causa y puntuación visibles |
| RF-020 | HU-004 | `state-machine.ts` | Unitarias de idempotencia de eventos terminales |
| RF-021 | HU-005 | `state-machine.ts`, componentes de resultados | Unitarias del pendiente, cero y descarte; E2E del flujo |
| RF-022 | HU-005 | `save-result.ts`, `result-schema.ts`, Repository | Unitarias de carga; integración de persistencia |
| RF-023 | HU-005 | Repository Supabase, `ranking/route.ts` | Integración entre sesiones simuladas; E2E tras recarga |
| RF-024 | HU-005 | `get-ranking.ts`, `ranking/route.ts`, presentación | Integración del límite; E2E por estados permitidos |
| RF-025 | HU-005 | Repository Supabase, índice de ranking | Integración de orden y desempates deterministas |
| RF-026 | HU-005 | `result-schema.ts`, `save-result.ts` | Unitarias de normalización y caracteres; integración HTTP |
| RF-027 | HU-005 | `result-schema.ts`, componentes de resultados | Unitarias de errores; E2E de corrección sin perder puntos |
| RF-028 | HU-005 | casos de uso, Route Handlers, presentación | Integración de 503 y reintento; E2E de mensajes controlados |
| RF-029 | HU-003 | `state-machine.ts`, temporizador de presentación | Unitarias con reloj falso; medición E2E del tick constante |
| RF-030 | HU-001/HU-005 | `state-machine.ts`, diálogo de reinicio | Unitarias de tres opciones; E2E Guardar/Descartar/Cancelar |
| RF-031 | HU-005 | `state-machine.ts`, `save-result.ts`, presentación | Unitarias de fallo/guardado; integración y E2E de reinicio |

La matriz es bidireccional: cada prueba futura deberá incluir en su nombre o metadatos las claves HU/RF de su fila, y cada tarea posterior deberá enlazar la misma fila, sus archivos afectados y la evidencia producida.

## Integración continua y despliegue

- Conservar el job estable `repository-integrity`.
- Añadir, cuando se autorice la implementación, los jobs estables `openapi`, `format-lint`, `typecheck`, `unit-tests`, `integration-tests`, `build` y `e2e`.
- Instalar dependencias con `npm ci`; fijar Node.js 24 y usar el lockfile versionado.
- Ejecutar Playwright con un worker en CI para priorizar reproducibilidad y publicar su reporte solo como evidencia, sin secretos.
- Vercel generará Preview por PR y Production desde `main`; cada entorno tendrá variables propias.
- Las migraciones se validarán localmente y en CI antes de aplicarse. Aplicarlas a un entorno remoto o desplegar requiere autorización humana separada.

Dependencias y condición de éxito previstas:

| Job | `needs` | Condición de éxito |
|---|---|---|
| `repository-integrity` | Ninguno | Integridad documental y estructural sin errores. |
| `openapi` | `repository-integrity` | Validador OpenAPI 3.1 finaliza con código 0. |
| `format-lint` | `repository-integrity` | Formato y lint finalizan con código 0. |
| `typecheck` | `repository-integrity` | Comprobación TypeScript finaliza con código 0. |
| `unit-tests` | `repository-integrity` | Todas las pruebas unitarias finalizan satisfactoriamente. |
| `integration-tests` | `repository-integrity` | Supabase local está listo, migraciones aplican y todas las pruebas de integración finalizan satisfactoriamente. |
| `build` | `openapi`, `format-lint`, `typecheck`, `unit-tests`, `integration-tests` | Sus dependencias fueron exitosas y Next.js compila con código 0. |
| `e2e` | `build` | El build fue exitoso y Playwright finaliza con código 0. |

Todos los jobs se ejecutarán en pull requests hacia `main` y después de integraciones en `main`, sin `continue-on-error`. Un job requerido fallido, cancelado u omitido impide considerar exitosa la CI. Preview o Production no deberán promoverse por encima de una cadena fallida; Production conserva además la aprobación humana de despliegue.

## Estructura del proyecto

### Documentación de la funcionalidad

```text
specs/001-snake-game/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── results-api.openapi.yml
├── checklists/
│   ├── requirements.md
│   └── design.md
└── tasks.md                 # aprobado; su ejecución requiere autorización separada
```

### Código fuente previsto

```text
src/
├── app/
│   ├── api/
│   │   ├── ranking/route.ts
│   │   └── results/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── domain/
│   └── game/
│       ├── model.ts
│       ├── state-machine.ts
│       ├── movement.ts
│       ├── collisions.ts
│       ├── food.ts
│       └── scoring.ts
├── application/
│   ├── ports/
│   │   ├── game-dependencies.ts
│   │   └── result-repository.ts
│   └── use-cases/
│       ├── save-result.ts
│       └── get-ranking.ts
├── infrastructure/
│   ├── config/server-env.ts
│   ├── http/
│   │   ├── request-body.ts
│   │   └── error-response.ts
│   ├── observability/server-logger.ts
│   ├── persistence/supabase-result-repository.ts
│   ├── supabase/server-client.ts
│   └── validation/result-schema.ts
└── presentation/
    ├── components/
    └── hooks/use-snake-game.ts

tests/
├── unit/
├── integration/
└── e2e/

supabase/
├── config.toml
├── migrations/
└── seed.sql
```

**Decisión de estructura**: una sola aplicación Next.js contiene interfaz y backend HTTP, pero conserva módulos y reglas de dependencia explícitos. Esta estructura satisface el monolito modular y evita proyectos separados, duplicación de tipos o despliegues coordinados.

## Comprobación constitucional posterior al diseño

*PUERTA posterior a diseño: superada técnicamente y aprobada formalmente por revisión humana el 2026-10-20.*

- El modelo relacional, los contratos, los límites de capas, la estrategia de pruebas, la seguridad y el despliegue están definidos.
- Las cinco HU y los 31 RF conservan cobertura sin cambiar la especificación.
- Máquina de estados y Repository tienen alcance concreto y no añaden abstracciones especulativas.
- No se almacenan credenciales ni se autoriza despliegue, Jira, código o implementación.
- Checklist queda autorizado por la aprobación humana de este Plan; Tasks permanece bloqueado hasta la aprobación humana explícita del artefacto de Checklist.

## Seguimiento de complejidad

No existen violaciones constitucionales que requieran justificación.

## Registro de aprobación y revisión

- Generado por Codex mediante `$speckit-plan` el 2026-10-20.
- Artefactos de apoyo: [research.md](./research.md), [data-model.md](./data-model.md), [contrato HTTP](./contracts/results-api.openapi.yml) y [quickstart.md](./quickstart.md).
- Estado: aprobado formalmente por revisión humana el 2026-10-20.
- Esta aprobación autoriza `$speckit-checklist` según la instrucción humana vigente; no autoriza `$speckit-tasks`, Jira, implementación, commits, push, PR ni despliegues.
