---
name: snake-pr-ready
description: Revisar preparación de un PR de Snake SDD, trazabilidad, secretos, CI y GitHub Flow, sin merges.
---

Aplicar solo en el repositorio Snake SDD; resolver su raíz mediante Git.
- Revisar el diff completo del incremento, incluidos archivos nuevos; señalar secretos sin imprimir sus valores, generados, cambios ajenos y trabajo fuera de la HU/RF autorizada.
- Comprobar trazabilidad tarea–código–prueba–commit–PR y documentación afectada contra las instrucciones vigentes, sin repetir Spec Kit.
- Verificar rama independiente con clave Jira, base válida desde main actualizado y destino main; conservar cambios ajenos. Nunca trabajar directamente sobre main.
- Exigir evidencia vigente de todos los controles obligatorios antes de publicar; después comprobar la CI real del commit del PR. No repetir controles satisfactorios todavía válidos.
- Informar hallazgos y puertas pendientes en hasta seis líneas. Esta revisión no autoriza escrituras Git/Jira, publicación ni aprobación humana. Nunca ejecutar merges ni habilitar auto-merge.
