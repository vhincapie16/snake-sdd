# Guía de validación: Juego Snake web

**Fecha**: 2026-10-20

**Estado**: artefacto del Plan aprobado formalmente por revisión humana el 2026-10-20; ningún resultado se declara como ejecutado en esta fase.

## 1. Objetivo

Reproducir localmente la aplicación, la base PostgreSQL de Supabase y las verificaciones que aportarán evidencia para las cinco historias. Esta guía no autoriza despliegues ni operaciones sobre entornos remotos.

## 2. Prerrequisitos previstos

- Node.js 24 LTS y npm.
- Docker o runtime compatible para Supabase local.
- Supabase CLI instalado como dependencia de desarrollo o disponible mediante `npx`.
- Navegador Chromium para Playwright.
- Repositorio en una rama de trabajo autorizada.

## 3. Configuración local segura

Crear `.env.local` únicamente en el equipo local; el archivo no se versiona:

```dotenv
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=valor-local-ficticio-generado-por-supabase
```

Reglas:

- No usar credenciales remotas ni reales en ejemplos, fixtures, logs o artefactos.
- No prefijar la clave privilegiada con `NEXT_PUBLIC_`.
- Obtener los valores locales del comando de estado de Supabase, no copiarlos a documentación versionada.

## 4. Preparación reproducible prevista

Cuando existan los archivos de implementación:

```powershell
npm ci
npx supabase start
npx supabase db reset --local
npx playwright install --with-deps chromium
```

`npx supabase db reset --local` es destructivo: elimina y reconstruye los datos de la base local. Solo puede ejecutarse después de obtener autorización humana previa y de confirmar que el destino es una base local desechable. No ejecutar variantes `--linked` ni aplicar migraciones remotas sin autorización humana específica.

## 5. Ejecución local prevista

```powershell
npm run dev
```

Abrir `http://localhost:3000` y comprobar que no aparecen credenciales ni datos internos en la interfaz o consola del navegador.

## 6. Verificaciones automatizadas previstas

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run openapi:lint
npm run test:unit
npm run test:integration
npm run build
npm run test:e2e
```

Los nombres son contratos del Plan para los futuros scripts de `package.json`; todavía no existen ni se ejecutaron.

### Metodología reproducible para RNF-002 y RNF-003

- **Entorno común**: Chromium en modo escritorio, build de producción, un solo worker, reloj monotónico `performance.now()`, aplicación calentada con cinco operaciones no contabilizadas y al menos 100 observaciones contabilizadas por métrica. El reporte debe conservar muestras, percentil 95, entorno y commit evaluado.
- **RNF-002**: con partida en curso y reloj del juego controlado, medir desde el `keydown` direccional válido hasta el primer indicador visual observable de dirección aceptada. Calcular p95 sobre 100 entradas válidas distribuidas entre las cuatro direcciones; debe ser menor o igual a 100 ms. Medir por separado el movimiento efectivo y comprobar que ocurre en el siguiente tick de 150 ms, nunca durante el reconocimiento.
- **RNF-003**: con Supabase local sembrado con al menos diez resultados, sin carga concurrente y con respuestas exitosas, medir desde el inicio de la consulta del ranking hasta que las diez filas estén visibles. Calcular p95 sobre 100 consultas; debe ser menor o igual a 2 segundos.
- Una ejecución con menos de 100 muestras, errores HTTP, carga concurrente no controlada o entorno sin identificar no aporta evidencia suficiente para estas métricas.

## 7. Escenarios de validación por historia

### HU-001 — Ciclo de partida

- Iniciar con `Enter`, pausar y reanudar con `Espacio` y reiniciar con `R`.
- Validar reinicio directo en estados sin resultado pendiente.
- Validar Guardar primero, Descartar y Cancelar con resultado pendiente.
- Forzar fallo de guardado y comprobar que el resultado permanece mientras siga abierta la pantalla.

**Evidencia esperada**: pruebas unitarias de transiciones y E2E de controles; referencias RF-001 a RF-005 y RF-030.

### HU-002 — Movimiento

- Aceptar la primera dirección válida entre ticks.
- Rechazar dirección opuesta sin consumir la oportunidad válida.
- Ignorar entradas adicionales, pausadas o no admitidas.

**Evidencia esperada**: pruebas unitarias con ticks controlados y E2E de teclado; RF-006 a RF-010.

### HU-003 — Alimento, crecimiento y puntuación

- Usar una secuencia de posiciones fija para alimento.
- Comprobar un segmento y 10 puntos por consumo, reposición válida y tick constante de 150 ms.
- Completar un tablero reducido de fixture sin depender de azar real.

**Evidencia esperada**: pruebas unitarias deterministas; RF-011 a RF-015 y RF-029.

### HU-004 — Finalización

- Probar pared, cuerpo, cola liberada, cola no liberada y tablero completado.
- Comprobar que no hay movimientos ni puntuación posteriores.

**Evidencia esperada**: pruebas unitarias de cada guarda y E2E del resultado; RF-016 a RF-020.

### HU-005 — Persistencia y ranking

- Guardar alias Unicode válido, alias repetido y puntuación cero.
- Rechazar alias vacío, demasiado largo o con caracteres prohibidos.
- Reintentar la misma partida sin duplicar y provocar conflicto con carga diferente.
- Sembrar al menos 15 resultados con empates y comprobar el Top 10 determinista.
- Consultar con menos de diez registros y simular indisponibilidad.
- Cerrar o recargar antes de guardar y comprobar que el pendiente no se recupera.

**Evidencia esperada**: integración con Supabase local y E2E; RF-021 a RF-028 y RF-031.

## 8. Contrato y modelo

- Validar las respuestas HTTP contra [contracts/results-api.openapi.yml](./contracts/results-api.openapi.yml).
- Validar migración, restricciones e índice contra [data-model.md](./data-model.md).
- No sustituir una prueba de integración por mocks cuando se comprueben constraints o idempotencia de PostgreSQL.
- El cuerpo de `POST /api/results` debe cubrir exactamente 4096 bytes aceptados y 4097 bytes rechazados con 413, además de cargas válidas e inválidas dentro del límite.

La validación automatizada de OpenAPI 3.1 queda fijada con Redocly CLI 2.53.3 y el ruleset `spec`:

```powershell
npx --yes @redocly/cli@2.53.3 lint --extends spec specs/001-snake-game/contracts/results-api.openapi.yml
```

El comando es reproducible por su versión fijada y debe finalizar con código 0. En CI se expondrá como `npm run openapi:lint` después de incorporar la misma versión como dependencia de desarrollo y fijarla en `package-lock.json`. No se ejecutó en esta fase: `npx` requiere descargar la herramienta y esa instalación temporal necesita autorización humana previa.

## 9. Comprobaciones de CI previstas

En un pull request, GitHub Actions deberá mostrar:

1. `repository-integrity` exitoso.
2. `openapi`, `format-lint`, `typecheck`, `unit-tests` e `integration-tests` exitosos después de `repository-integrity`.
3. `build` exitoso únicamente después de sus cinco dependencias.
4. `e2e` exitoso después de `build`, con reporte adjunto cuando corresponda.

No declarar éxito hasta observar los resultados reales de cada ejecución. Ningún job requerido admite `continue-on-error`; un fallo, cancelación u omisión bloquea la cadena descrita en el Plan.

## 10. Despliegue previsto

- Preview de Vercel para ramas/PR y Production únicamente desde `main`.
- Variables distintas para Development, Preview y Production.
- Migraciones remotas revisadas y aplicadas antes de depender de ellas en la aplicación.
- Ningún despliegue, enlace con Supabase remoto ni migración remota está autorizado por este documento.

## 11. Limpieza local no destructiva

Detener Supabase local mediante el comando estándar que conserve sus datos. Cualquier reinicio o eliminación de datos locales debe ejecutarse solo cuando la persona responsable lo autorice y el destino esté confirmado como local.
