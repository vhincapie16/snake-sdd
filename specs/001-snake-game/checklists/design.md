# Checklist de diseño técnico: Juego Snake web

**Propósito**: evaluar la calidad, completitud, claridad, consistencia y verificabilidad de la arquitectura, seguridad, modelo de datos, contrato API, estrategia de pruebas, despliegue y trazabilidad antes de generar tareas.
**Creado**: 2026-10-20
**Característica**: [spec.md](../spec.md)
**Estado**: aprobado condicionalmente por revisión humana el 2026-10-20 para avanzar a `$speckit-tasks`; CHK023 permanece pendiente y bloquea cualquier implementación.

**Propiedad de la revisión**: este checklist pertenece a la persona revisora. Marcar un elemento `[x]` solo cuando determine que el criterio de calidad documental está satisfecho.
**Semántica**: `[x]` confirma la calidad del requisito o diseño revisado; no significa que exista una implementación.

## Arquitectura y alcance

- [x] CHK001 ¿El límite de la aplicación monolítica modular, su unidad de despliegue y la responsabilidad de cada capa están definidos sin solapamientos? [Plan §Diseño arquitectónico]
- [x] CHK002 ¿La dirección de dependencias entre presentación, aplicación, dominio e infraestructura es inequívoca y comprobable? [Plan §Capas y dependencias]
- [x] CHK003 ¿La máquina de estados especifica estados, comandos, guardas y efectos para todos los ciclos aprobados de partida y resultado? [Plan §Máquina de estados; Data model §2]
- [x] CHK004 ¿El uso del patrón Repository queda limitado a la persistencia de resultados y evita abstracciones no justificadas? [Plan §Capas y dependencias; Constitution §Arquitectura]
- [x] CHK005 ¿Los límites técnicos conservan exactamente cinco HU y 31 RF sin introducir comportamiento funcional nuevo? [Spec §Historias de usuario; Spec §Requisitos funcionales; Plan §Restricciones]

## Seguridad y gestión de errores

- [x] CHK006 ¿Se distingue con claridad qué configuración es pública, server-only y secreta en desarrollo, CI, Preview y Production? [Plan §Seguridad y errores; Quickstart §3; Plan §Integración continua y despliegue]
- [x] CHK007 ¿Está prohibida de forma verificable la exposición de la clave privilegiada mediante `NEXT_PUBLIC_`, navegador, logs o artefactos versionados? [Plan §Seguridad y errores; Quickstart §3]
- [x] CHK008 ¿Las validaciones de cuerpo, tipos, alias, puntuación, fecha y el máximo de 4096 bytes están definidas en el límite HTTP y reforzadas donde corresponde? [Plan §Seguridad y errores; Data model §§3-4; OpenAPI `SaveResultRequest`]
- [x] CHK009 ¿Las respuestas 405, 409, 413, 422 y 503 tienen condiciones, cuerpos y capacidad de reintento coherentes sin revelar detalles internos? [Plan §Seguridad y errores; OpenAPI `/results` y `/ranking`]
- [x] CHK010 ¿Los privilegios de base de datos y la ausencia de acceso público directo están expresados como requisitos verificables? [Data model §3 Privilegios; Plan §Persistencia e idempotencia]
- [x] CHK011 ¿Las limitaciones derivadas de no tener autenticación ni controles antitrampas están declaradas sin prometer garantías inexistentes? [Plan §Seguridad y errores; Spec HU-005]

## Modelo de dominio y persistencia

- [x] CHK012 ¿Los invariantes de tablero, serpiente, alimento, puntuación y velocidad permiten construir pruebas deterministas? [Data model §1; Plan §Contexto técnico]
- [x] CHK013 ¿`pending`, `saving`, `saveError` y `saved` distinguen inequívocamente un resultado pendiente de uno confirmado? [Plan §Máquina de estados; Data model §Estado del resultado]
- [x] CHK014 ¿El reinicio con `R` está definido para reinicio directo tras `saved` y para confirmación de tres opciones cuando existe un pendiente? [Data model §2; Spec HU-001 y HU-005]
- [x] CHK015 ¿La pérdida del resultado pendiente al cerrar o recargar y la ausencia de recuperación entre sesiones están documentadas consistentemente? [Data model §2; Spec RN-013]
- [x] CHK016 ¿Las restricciones relacionales de `game_results` reflejan UUID, alias normalizado, puntuación cero o positiva, múltiplos de diez y fechas UTC? [Data model §3]
- [x] CHK017 ¿La semántica idempotente diferencia inserción, reintento idéntico y conflicto sin sobrescritura para un mismo `gameId`? [Data model §5; Plan §Persistencia e idempotencia]
- [x] CHK018 ¿El orden Top 10 y su índice usan los tres criterios aprobados en idéntico orden, incluidos menos de diez resultados? [Data model §§3 y 6; OpenAPI `RankingResponse`]

## Contrato API

- [x] CHK019 ¿El contrato OpenAPI 3.1 contiene únicamente las operaciones de guardar resultado y consultar ranking previstas por el alcance? [OpenAPI `paths`; Plan §Escala y alcance]
- [x] CHK020 ¿La entrada de alias evita rechazar antes del recorte valores válidos y documenta normalización antes de validar 1 a 20 caracteres? [OpenAPI `SaveResultRequest.alias`; Data model §4]
- [x] CHK021 ¿Los esquemas de respuesta representan de forma completa `created`, `alreadyRecorded`, ranking, validación, conflicto, cuerpo demasiado grande, método no permitido e indisponibilidad? [OpenAPI `components/schemas`; Plan §Seguridad y errores]
- [x] CHK022 ¿La trazabilidad del contrato enlaza cada operación y respuesta con HU-005 y los RF aplicables, sin omisiones ni referencias inexistentes? [OpenAPI `x-traceability`; Spec RF-021 a RF-028 y RF-031]
- [ ] CHK023 ¿Se ha ejecutado con resultado satisfactorio una validación automatizada de sintaxis y semántica OpenAPI 3.1 antes de implementar Route Handlers, clientes o pruebas de contrato? [Pendiente obligatorio; OpenAPI completo; Quickstart §8]
- [x] CHK024 ¿Está definido qué comando o herramienta reproducible realizará la validación OpenAPI 3.1 en local y CI, sin depender de una comprobación manual? [Plan §Integración continua y despliegue; Quickstart §§6 y 8]

## Estrategia de pruebas

- [x] CHK025 ¿Cada nivel de prueba diferencia con precisión dominio, aplicación, persistencia real y recorridos E2E? [Plan §Estrategia de pruebas y trazabilidad]
- [x] CHK026 ¿Reloj falso, temporizadores falsos, generador de posiciones y semillas fijas eliminan dependencias del tiempo y azar reales? [Plan §Estrategia de pruebas; Quickstart §7]
- [x] CHK027 ¿Los controles cubren primera dirección válida, rechazo de opuesta sin consumir turno e ignorado de entradas adicionales? [Quickstart §HU-002; Spec RF-006 a RF-010]
- [x] CHK028 ¿Los casos de colisión cubren pared, cuerpo, entrada en cola liberada y cola no liberada? [Quickstart §HU-004; Spec RF-016 a RF-020]
- [x] CHK029 ¿Las pruebas previstas cubren crecimiento, puntuación cero, velocidad constante y finalización por tablero completo? [Quickstart §§HU-003 y HU-005; Spec RF-011 a RF-015, RF-029]
- [x] CHK030 ¿La estrategia de integración comprueba restricciones PostgreSQL, idempotencia, empates, Top 10 y menos de diez resultados sin sustituirlos por mocks? [Quickstart §§HU-005 y 8; Data model §§3, 5 y 6]
- [x] CHK031 ¿Los criterios de rendimiento RNF-002 y RNF-003 especifican medición, percentil, estímulo y resultado observable reproducibles? [Plan §Objetivos de rendimiento; Quickstart §Metodología reproducible]

## CI, despliegue y operación

- [x] CHK032 ¿Los futuros jobs de CI conservan `repository-integrity` y definen formato, lint, tipos, unitarias, integración, build y E2E sin declarar ejecuciones anticipadas? [Plan §Integración continua y despliegue; Quickstart §§6 y 9]
- [x] CHK033 ¿La secuencia de CI especifica las dependencias necesarias para impedir que build o despliegue oculten fallos previos? [Plan §Integración continua y despliegue]
- [x] CHK034 ¿Development, Preview y Production tienen límites de variables y credenciales separados y verificables? [Plan §Seguridad y errores; Plan §Integración continua y despliegue; Quickstart §10]
- [x] CHK035 ¿La política de migraciones distingue validación local, revisión humana y aplicación remota sin automatizar acciones destructivas? [Data model §8; Quickstart §§4 y 10]
- [x] CHK036 ¿El uso destructivo de `npx supabase db reset --local` exige autorización previa y confirmación de una base local desechable? [Quickstart §4]

## Trazabilidad y puertas de aprobación

- [x] CHK037 ¿Existe cobertura bidireccional verificable entre las cinco HU, los 31 RF, reglas, componentes, contratos y niveles de prueba? [Plan §Matriz detallada de trazabilidad técnica; Data model §7; OpenAPI `x-traceability`]
- [x] CHK038 ¿Cada uno de RF-001 a RF-031 aparece al menos una vez en la trazabilidad técnica sin duplicaciones que oculten huecos? [Spec §Requisitos funcionales; Plan §Matriz detallada de trazabilidad técnica]
- [x] CHK039 ¿Los artefactos del Plan conservan las decisiones funcionales aprobadas sobre controles, movimiento, colisiones, velocidad, alias, ranking y reinicio? [Spec §Aclaraciones; Plan; Data model; OpenAPI]
- [x] CHK040 ¿La documentación deja claro que este checklist requiere aprobación humana explícita antes de `$speckit-tasks` y que no autoriza Jira ni implementación? [AGENTS.md §Fases y aprobaciones humanas; Plan §Registro de aprobación y revisión]

## Notas

- Revalidación documental asistida por Codex el 2026-10-20: 39 controles satisfechos con evidencia documental y CHK023 pendiente.
- CHK023 es bloqueante: la validación automatizada OpenAPI 3.1 debe ejecutarse satisfactoriamente antes de implementar. CHK024 queda satisfecho porque la herramienta, versión y comando reproducible están documentados.
- Conformidad humana registrada el 2026-10-20: se autoriza generar `tasks.md` con CHK023 abierto; esta conformidad no aprueba Tasks ni autoriza Analyze o Implement.
- Aprobación humana posterior de `tasks.md` registrada el 2026-10-20; CHK023 continúa pendiente y bloquea Implement.
- Marcar `[x]` solo después de comprobar el criterio documental; no representa trabajo de implementación terminado.
- `$speckit-tasks` requiere aprobación humana explícita de este checklist.
- `checklists/requirements.md` conserva su ciclo independiente de Specify y Clarify.
