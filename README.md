# snake-sdd

Juego Snake con tick de 150 ms, reinicio a «Preparada» y registro opcional del resultado al terminar (HU-005 / KAN-5).

## Ejecutar

Usar Node.js 24.19.0 y npm 11.11.1: `npm ci`, copiar `.env.example` a `.env.local` y completar únicamente `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con los valores del proyecto de pruebas. La clave privilegiada permanece en el servidor; no usar variables `NEXT_PUBLIC_*` ni versionar `.env.local`.

Ejecutar `npm run dev` y abrir la dirección indicada en el terminal. La migración ya se aplicó al proyecto de pruebas autorizado: no volver a ejecutarla ni cargar `supabase/seed.sql`. Configuración y evidencia en [supabase/README.md](supabase/README.md).

## Comprobación manual de HU-005

Iniciar con Enter, dirigir con flechas y finalizar por colisión. Introducir un alias válido y pulsar Guardar resultado; el alias admite letras Unicode, números, espacios, guiones y guiones bajos, tras recortar extremos. Guardar es explícito: no se registra automáticamente al terminar. El pendiente solo permanece en memoria y se pierde al recargar o cerrar.

Consultar el Top 10 desde «Preparada» o «Finalizada»; no está disponible durante movimiento o pausa. Se ordena por puntos descendentes, fecha UTC ascendente y UUID ascendente. Ante errores se permite corregir el alias o reintentar sin sobrescribir una partida existente. R/Reiniciar conserva la confirmación de Guardar primero, Descartar o Cancelar; tras preparar, Enter inicia.

## Pruebas

`npm run test:unit` y `npm run test:integration` no escriben en Supabase. Los E2E de HU-005 simulan el transporte HTTP para cubrir fallos y estados de interfaz; no constituyen evidencia de persistencia.

Con autorización de escrituras controladas y un build previo (`npm run build`), ejecutar en PowerShell `$env:SNAKE_ALLOW_CONTROLLED_WRITES='1'; npm run test:persistence`. La suite real crea como máximo once resultados identificables, reutiliza sus UUID al repetir y no limpia registros. Necesita el puerto 3010 libre para un servidor propio del build. No usa Docker ni aplica migraciones o semillas. Una inserción manual o limpieza requiere autorización separada.

Se mantienen los ocho jobs de CI. Por excepción humana autorizada, la persistencia real se valida fuera de CI contra el proyecto de pruebas: GitHub no recibe credenciales remotas. La validación de Supabase local y su semilla permanece pendiente; no se declara completada T060 ni se sustituye esa evidencia por simulaciones.
