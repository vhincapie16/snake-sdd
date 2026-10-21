# Instrucciones persistentes para Codex

## Autoridad y alcance

- La constitución del proyecto, ubicada en `.specify/memory/constitution.md`, versión 1.1.0 ratificada, es obligatoria y prevalece sobre cualquier instrucción incompatible.
- El proyecto DEBE desarrollarse mediante GitHub Spec Kit y Spec-Driven Development (SDD).
- El alcance funcional NO DEBE superar cinco historias de usuario funcionales, y cada historia requiere aprobación humana explícita.
- Los artefactos técnicos y la documentación del proyecto DEBEN redactarse en español, salvo identificadores, comandos o términos técnicos que deban conservar su forma original.

## Fases y aprobaciones humanas

- El flujo obligatorio de Spec Kit es: **Constitution → Specify → Clarify → Plan → Checklist → Tasks → Analyze → Implement → Converge**.
- La constitución 1.1.0 ya ratificada constituye la puerta de entrada y la autoridad normativa del flujo.
- Codex NO DEBE avanzar de una fase a otra sin aprobación humana explícita del artefacto producido en la fase anterior. La ausencia de respuesta, una revisión o una solicitud de corrección no constituyen aprobación.
- Las skills `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-checklist`, `speckit-tasks`, `speckit-analyze`, `speckit-implement` y `speckit-converge` DEBEN ejecutarse individualmente y solo para la fase expresamente autorizada.
- El resultado de cada skill DEBE presentarse para revisión y aprobación humana explícita antes de ejecutar la siguiente.
- El workflow automático completo de Spec Kit NO DEBE ejecutarse mientras no garantice todas las puertas de aprobación compatibles con la constitución, incluida una puerta humana entre `Tasks` y `Analyze`, entre `Analyze` e `Implement`, y antes de cualquier trabajo adicional identificado por `Converge`.
- Si `Analyze` o `Converge` identifica trabajo pendiente, inconsistencias o nuevas tareas, Codex DEBE presentar el resultado y esperar aprobación humana antes de corregir artefactos o implementar trabajo adicional.
- Si una validación falla, Codex DEBE detener el avance, reportar el error, conservar la evidencia disponible y proponer una corrección. NO DEBE pasar automáticamente a otra fase.
- Todo contenido generado o modificado por IA conserva el estado de propuesta hasta que una persona registre su aprobación explícita.

## Jira y trazabilidad

- Jira es la herramienta oficial para el seguimiento de la ejecución del proyecto. Los documentos aprobados de Spec Kit son la fuente de las especificaciones.
- Codex NO DEBE crear, editar, comentar, transicionar ni eliminar elementos de Jira sin autorización humana previa, explícita y específica para la operación y los elementos afectados.
- Cada historia, criterio de aceptación, tarea, cambio de código, prueba, commit y pull request DEBE mantener referencias que permitan reconstruir su trazabilidad.
- Jira NO DEBE sustituir ni contradecir los artefactos aprobados de Spec Kit.

## Arquitectura y responsabilidades

- La solución DEBE adoptar una arquitectura monolítica modular por capas, con separación explícita entre presentación, lógica de dominio, servicios de aplicación y acceso a datos.
- Las dependencias DEBEN orientarse hacia contratos estables. La lógica de dominio no debe depender de detalles de interfaz o persistencia.
- La especificación define el comportamiento; el plan técnico define arquitectura y decisiones; las tareas organizan la ejecución; el código implementa lo aprobado; y las pruebas aportan evidencia verificable.
- Deben aplicarse SOLID, DRY y KISS de manera proporcional, sin abstracciones ni patrones especulativos.

## Calidad, pruebas y seguridad

- Cada criterio de aceptación DEBE vincularse con pruebas aplicables y repetibles.
- El proyecto DEBE contemplar pruebas unitarias para el dominio, pruebas de integración para límites entre capas y persistencia, y pruebas de extremo a extremo para los flujos aprobados.
- Una tarea funcional NO DEBE considerarse terminada si faltan pruebas aplicables, fallan o no conservan trazabilidad con el requisito correspondiente.
- Contraseñas, tokens, claves privadas, credenciales reales y cadenas de conexión sensibles NO DEBEN almacenarse en archivos versionados.
- Los valores sensibles DEBEN suministrarse mediante mecanismos externos al repositorio. Los ejemplos de configuración solo pueden contener valores ficticios o referencias a variables seguras.
- Las entradas y datos externos DEBEN validarse; los errores deben gestionarse sin revelar información sensible.

## GitHub Flow, Git y despliegue

- `main` es la rama principal y estable del proyecto.
- El commit inicial establece la línea base del repositorio y requiere autorización humana específica. Todos los cambios posteriores al commit inicial DEBEN integrarse mediante pull requests dirigidos a `main`.
- No se permiten pushes directos a `main`.
- Cada historia de usuario DEBE desarrollarse en una rama independiente creada desde la versión actualizada de `main`.
- Las ramas de nuevas funcionalidades DEBEN usar `feature/<JIRA-KEY>-<descripcion>`.
- Las ramas de correcciones relacionadas con Jira DEBEN usar `fix/<JIRA-KEY>-<descripcion>`.
- Las ramas de documentación DEBEN usar `docs/<descripcion>`.
- Las ramas de configuración, herramientas y mantenimiento DEBEN usar `chore/<descripcion>`.
- `<JIRA-KEY>` DEBE sustituirse por la clave real de Jira. Cada commit y pull request relacionado con una historia de usuario DEBE identificar esa clave.
- Cada pull request DEBE incluir descripción, historia asociada, cambios realizados, pruebas ejecutadas, resultados y evidencias verificables.
- GitHub Actions DEBE verificar los cambios antes del merge mediante las comprobaciones de formato o análisis y las pruebas aplicables definidas por el proyecto.
- El merge SOLO PUEDE realizarse después de comprobar que las verificaciones requeridas finalizaron correctamente y de recibir aprobación humana explícita del pull request.
- Después de integrar una rama, toda rama posterior DEBE partir de `main` actualizado.
- Una historia de usuario SOLO PUEDE pasar a `Terminado` en Jira después de aprobar sus criterios de aceptación, pruebas, evidencias e integración en `main`.
- Codex NO DEBE crear ramas, ejecutar `git commit` o `git push`, crear pull requests, realizar merges, configurar o crear repositorios remotos, ejecutar despliegues ni modificar elementos de Jira sin autorización humana previa, explícita y específica.
- Codex NO DEBE modificar la constitución, las skills, scripts, plantillas o workflows de Spec Kit sin una autorización humana específica para ese cambio.
- Antes de proponer una integración, Codex DEBE verificar formato o análisis estático, pruebas aplicables, documentación y trazabilidad.

### Protección futura de `main` en GitHub

Cuando exista un repositorio remoto y una persona autorice su configuración, la protección de `main` DEBE:

- Exigir un pull request antes de integrar cambios.
- Exigir que las verificaciones requeridas de GitHub Actions finalicen correctamente.
- Impedir force pushes y la eliminación de la rama principal.
- Exigir aprobación humana del pull request antes del merge.

Estas reglas se documentan como configuración futura. Codex NO DEBE intentar configurarlas mientras no exista un repositorio remoto ni haya autorización humana específica.

## Entregas y evidencia

Toda entrega de Codex DEBE presentar:

1. Los archivos creados o modificados.
2. Las decisiones técnicas adoptadas y su justificación.
3. Las verificaciones ejecutadas.
4. Los resultados de cada verificación, incluidos los fallos.
5. Los riesgos, excepciones y aspectos pendientes de revisión humana.
6. La puerta de aprobación en la que se encuentra el trabajo y la autorización necesaria para continuar.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
