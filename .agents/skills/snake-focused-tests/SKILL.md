---
name: snake-focused-tests
description: Seleccionar y ejecutar pruebas según el diff de Snake SDD y verificar controles antes de un PR.
---

Aplicar solo en el repositorio Snake SDD; resolver su raíz mediante Git.
- Leer el diff y los scripts/CI vigentes; enlazar archivos y comportamiento afectados con pruebas HU/RF existentes. Leer únicamente los contratos relevantes.
- Ejecutar primero las pruebas que cubren el cambio y los límites afectados. No instalar herramientas ni añadir suites ajenas al alcance sin autorización.
- Reutilizar resultados comprobados solo si siguen siendo válidos para el código, dependencias y configuración actuales. Repetir controles afectados por cambios o fallos, sin bucles de validación.
- Antes de publicar cada PR, ejecutar todos los controles obligatorios del incremento definidos por el proyecto; las pruebas específicas no los sustituyen.
- Informar comandos, resultados reales y bloqueos brevemente. Fallos, cancelaciones, omisiones o pruebas no ejecutadas nunca equivalen a éxito.
