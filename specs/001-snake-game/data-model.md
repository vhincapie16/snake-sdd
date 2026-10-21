# Modelo de datos: Juego Snake web

**Fecha**: 2026-10-20

**Estado**: artefacto técnico del Plan aprobado formalmente por revisión humana el 2026-10-20.

## 1. Modelo de dominio efímero

Estas entidades viven en memoria durante una sesión del navegador y no se almacenan.

### Partida (`GameState`)

| Campo | Tipo lógico | Reglas |
|---|---|---|
| `gameId` | UUID | Se genera al preparar una partida y no cambia hasta reiniciar. |
| `status` | `prepared \| running \| paused \| finished` | Una sola variante activa. |
| `snake` | `Snake` | Debe contener al menos una celda y no puede salir del tablero mientras la partida siga activa. |
| `food` | `Cell \| null` | Una celda libre durante el juego; `null` solo al completar el tablero o finalizar. |
| `effectiveDirection` | `up \| down \| left \| right` | Dirección usada por el último desplazamiento. |
| `pendingDirection` | dirección o `null` | Primera dirección válida aceptada antes del siguiente tick. |
| `score` | entero no negativo | Empieza en 0 y aumenta exactamente 10 por alimento. |
| `finishedAt` | instante UTC o `null` | Se fija una vez al finalizar. |
| `finishReason` | `wall \| self \| boardCompleted \| null` | Obligatorio solo en `finished`. |
| `resultState` | `ResultState` | Distingue de forma exclusiva ausencia, pendiente, guardado en curso, error y guardado confirmado. |
| `restartConfirmation` | booleano | Solo puede ser verdadero en `finished` con `resultState=pending` o `resultState=saveError`. |

### Serpiente (`Snake`)

| Campo | Tipo lógico | Reglas |
|---|---|---|
| `segments` | lista ordenada de `Cell` | Primer elemento = cabeza; último = cola; no hay duplicados en estados válidos. |

### Celda (`Cell`)

| Campo | Tipo lógico | Reglas |
|---|---|---|
| `x` | entero | `0 <= x < 20`. |
| `y` | entero | `0 <= y < 20`. |

La igualdad de celdas se determina por el par `(x, y)`.

### Resultado pendiente (`PendingResult`)

| Campo | Tipo lógico | Reglas |
|---|---|---|
| `gameId` | UUID | Heredado de la partida finalizada. |
| `score` | entero no negativo | Puntuación definitiva, inmutable y múltiplo de 10. |
| `achievedAt` | instante UTC | Capturado al finalizar la partida. |
| `aliasInput` | cadena | Entrada corregible; no está validada hasta guardar. |

### Estado del resultado (`ResultState`)

| Variante | Datos asociados | Reglas |
|---|---|---|
| `none` | Ninguno | Antes de finalizar o después de descartar/reiniciar. |
| `pending` | `PendingResult` | Espera alias válido o solicitud de guardado. |
| `saving` | `PendingResult` | Solicitud en curso; todavía no equivale a resultado guardado. |
| `saveError` | `PendingResult` y código controlado | Permite corregir o reintentar mientras siga abierta la pantalla. |
| `saved` | `SavedResultRef` | Persistencia confirmada; ya no es pendiente y `R` reinicia directamente. |

### Referencia de resultado guardado (`SavedResultRef`)

| Campo | Tipo lógico | Reglas |
|---|---|---|
| `gameId` | UUID | Coincide con la clave primaria persistida. |
| `alias` | cadena normalizada | Alias confirmado por el repositorio. |
| `score` | entero no negativo | Coincide con la puntuación persistida. |
| `achievedAt` | instante UTC | Coincide con el momento persistido. |

## 2. Transiciones de estado

| Estado origen | Comando o evento | Guarda | Estado destino / efecto |
|---|---|---|---|
| `prepared` | `START` | Siempre | `running`; conserva configuración y puntuación 0. |
| `prepared` | `REQUEST_RESTART` | Siempre | Nueva `prepared` válida. |
| `running` | `TOGGLE_PAUSE` | Siempre | `paused`; detiene ticks efectivos. |
| `paused` | `TOGGLE_PAUSE` | Siempre | `running`; conserva todo el estado. |
| `running` | `QUEUE_DIRECTION` | Primera válida del intervalo | Registra `pendingDirection`; no cambia posición. |
| `running` | `TICK` | Sin colisión ni tablero completo | Nuevo `running`; aplica movimiento y posible consumo. |
| `running` | `TICK` | Pared, cuerpo o tablero completo | `finished` con `resultState=pending`; fija resultado y causa. |
| `running` o `paused` | `REQUEST_RESTART` | Siempre | Nueva `prepared`; descarta avance no finalizado. |
| `finished` | `SAVE_RESULT` | `pending` o `saveError` y alias válido | Mantiene `finished` con `resultState=saving`. |
| `finished` | `SAVE_SUCCEEDED` | `saving`, sin reinicio solicitado | Mantiene `finished` con `resultState=saved`. |
| `finished` | `REQUEST_RESTART` | `saved` o `none` | Nueva `prepared` directamente, sin confirmación. |
| `finished` | `REQUEST_RESTART` | `pending` o `saveError` | Mantiene `finished` y abre confirmación. |
| `finished` | `CONFIRM_SAVE_AND_RESTART` | `pending` o `saveError` y alias válido | Cambia a `saving` y marca el reinicio para después de confirmar el guardado. |
| `finished` | `SAVE_SUCCEEDED` | `saving` con reinicio marcado | Registra `saved` y crea inmediatamente una nueva `prepared`. |
| `finished` | `SAVE_FAILED` | `saving` | Mantiene `finished` con `resultState=saveError` y el mismo `PendingResult`. |
| `finished` | `CONFIRM_DISCARD_AND_RESTART` | Confirmación abierta | Elimina el pendiente y crea nueva `prepared`. |
| `finished` | `CANCEL_RESTART` | Confirmación abierta | Mantiene `finished` sin cambios. |
| `finished` | cierre o recarga | `pending`, `saving` o `saveError` | El pendiente se pierde; no se recupera. |

Todo comando no listado para el estado actual se ignora. Una partida `finished` no acepta ticks ni direcciones.

## 3. Modelo relacional persistente

Solo se persisten resultados validados. No se persisten partidas, tableros, serpientes ni resultados pendientes.

### Tabla `game_results`

| Columna | Tipo PostgreSQL | Nulabilidad / valor | Restricción |
|---|---|---|---|
| `game_id` | `uuid` | `NOT NULL` | Clave primaria; idempotencia por partida. |
| `alias` | `varchar(20)` | `NOT NULL` | Valor normalizado; `char_length(alias) BETWEEN 1 AND 20`; caracteres validados en aplicación. |
| `score` | `integer` | `NOT NULL` | `score >= 0` y `score % 10 = 0`. |
| `achieved_at` | `timestamptz` | `NOT NULL` | Instante UTC capturado al finalizar. |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Auditoría técnica de inserción; no participa en el ranking. |

### Índices

- Clave primaria única sobre `game_id`.
- Índice `game_results_ranking_idx` sobre `(score DESC, achieved_at ASC, game_id ASC)` para la consulta Top 10 determinista.

### Privilegios

- Sin `SELECT`, `INSERT`, `UPDATE` ni `DELETE` directos para roles públicos sobre la tabla.
- Acceso únicamente desde el adaptador server-only mediante credencial almacenada fuera del repositorio.
- No se permite `UPDATE` ni `DELETE` desde los casos de uso de la primera versión.

## 4. Validación del alias

1. Eliminar espacios iniciales y finales.
2. Rechazar longitud inferior a 1 o superior a 20 caracteres.
3. Aceptar únicamente letras Unicode —incluidas `ñ` y vocales acentuadas—, números, espacios, guion (`-`) y guion bajo (`_`).
4. Permitir alias repetidos entre resultados.
5. Conservar el resultado pendiente y el mensaje corregible ante error mientras siga abierta la pantalla de resultados.

Regla de referencia en TypeScript: categoría Unicode de letras más `[0-9 _-]`; la expresión concreta deberá probarse con ejemplos válidos e inválidos antes de fijarse.

## 5. Idempotencia

La operación de guardado recibe `gameId`, alias normalizado, puntuación y momento de consecución:

- Si `gameId` no existe, inserta y devuelve `created`.
- Si existe con los mismos valores, devuelve el registro existente como `alreadyRecorded` sin duplicar.
- Si existe con cualquier valor diferente, devuelve conflicto; nunca sobrescribe.
- Un error de comunicación no permite afirmar éxito. El resultado permanece pendiente en la pantalla para reintentar.

La comparación idempotente usa todos los campos funcionales persistidos, excluido `created_at`.

## 6. Consulta del ranking

```text
ORDER BY score DESC, achieved_at ASC, game_id ASC
LIMIT 10
```

- Con menos de diez registros devuelve únicamente los existentes.
- Incluye `position`, `gameId`, `alias`, `score` y `achievedAt`.
- `position` se deriva del orden de la respuesta y no se persiste.

## 7. Trazabilidad

| Elemento | Requisitos y reglas |
|---|---|
| Estados y transiciones | RF-001 a RF-010, RF-018 a RF-020, RF-030, RN-001 a RN-003, RN-013 |
| Movimiento, consumo y finalización | RF-011 a RF-017, RF-029, RN-004 a RN-006, RN-010 |
| Resultado pendiente | RF-021, RF-027, RF-028, RF-030, RF-031, RN-007, RN-009, RN-011, RN-013 |
| `game_results` | RF-022, RF-023, RF-026, RN-007, RN-011 |
| Ranking e índice | RF-024, RF-025, RN-008, RN-012 |

## 8. Migración y reversibilidad

- Una migración inicial creará tabla, restricciones, índice y privilegios.
- La migración se validará reconstruyendo una base local vacía y ejecutando pruebas de integración.
- Cualquier reversión destructiva sobre un entorno remoto requerirá procedimiento y autorización humana específicos; este Plan no la autoriza.
