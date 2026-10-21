# Constitución de Snake SDD

## Principios fundamentales

### I. Alcance controlado

El producto DEBE limitarse a un máximo de cinco historias de usuario funcionales, cada una
aprobada explícitamente. Toda característica, mejora o cambio DEBE corresponder a un requisito
aprobado y mantener trazabilidad hasta este. Las ideas fuera del alcance DEBEN registrarse como
trabajo futuro y NO DEBEN incorporarse a la especificación, al plan, a las tareas ni al código
vigentes sin una enmienda o aprobación formal del alcance. Esta restricción mantiene el proyecto
académico acotado y evaluable.

### II. Desarrollo guiado por especificaciones

La implementación de una característica NO DEBE comenzar hasta que existan y hayan sido
revisados y aprobados explícitamente por una persona: su especificación, criterios de aceptación
verificables, plan técnico y lista de tareas. Estos artefactos DEBEN conservar relaciones
trazables entre requisito, criterio, decisión técnica, tarea, cambio de código y prueba. Si cambia
un requisito, primero DEBEN actualizarse y aprobarse los artefactos afectados; el código nunca
será la fuente primaria de requisitos.

### III. Supervisión humana obligatoria

Codex PUEDE generar documentos, código, pruebas, análisis y propuestas de corrección, pero DEBE
presentar el resultado de cada fase y solicitar aprobación humana explícita antes de iniciar la
siguiente. La ausencia de respuesta NO constituye aprobación. Toda observación humana y toda
corrección DEBEN registrarse en el artefacto correspondiente o en el historial de revisión, con
la referencia que permita reconstruir su origen, motivo y resultado. La persona responsable
conserva la decisión final sobre alcance, diseño, aceptación y despliegue. Una revisión, un
comentario o una solicitud de corrección NO constituyen aprobación ni ratificación; estas solo
existen cuando una persona las declara explícitamente y queda registrada la decisión.

### IV. Arquitectura monolítica modular por capas

La solución DEBE priorizar un monolito modular con separación explícita entre presentación,
lógica de dominio, servicios de aplicación y acceso a datos. Las dependencias DEBEN apuntar
hacia contratos estables y evitar que la lógica del juego o las reglas de puntuación dependan de
detalles de interfaz o persistencia. Cualquier desviación de esta arquitectura DEBE incluir una
justificación técnica aprobada que demuestre una necesidad del alcance vigente.

### V. Diseño proporcional y mantenible

El diseño y el código DEBEN aplicar SOLID, DRY y KISS de forma proporcional al tamaño del
proyecto. Un patrón de diseño SOLO DEBE introducirse cuando resuelva un problema concreto y su
justificación quede documentada en el plan técnico o en una decisión de arquitectura. Las
abstracciones especulativas, duplicaciones evitables y complejidad sin requisito asociado NO
DEBEN aceptarse.

### VI. Persistencia relacional segura

Las puntuaciones DEBEN persistirse en una base de datos relacional mediante un modelo de datos
consistente, con tipos, restricciones, claves e integridad definidos en el plan técnico. Toda
entrada destinada a persistencia DEBE validarse antes de llegar a la capa de datos. Las
credenciales y cadenas de conexión sensibles DEBEN suministrarse mediante mecanismos externos
al repositorio, y la configuración documentada DEBE usar únicamente valores ficticios o
referencias a variables seguras.

### VII. Calidad y trazabilidad de pruebas

El proyecto DEBE incluir pruebas unitarias para reglas de dominio, pruebas de integración para
límites entre capas y persistencia, y pruebas de extremo a extremo para los flujos de usuario
aprobados. Cada criterio de aceptación DEBE vincularse con una o más pruebas y producir evidencia
repetible de su resultado. Una tarea funcional NO DEBE considerarse terminada si sus pruebas
aplicables faltan, fallan o no pueden asociarse con el requisito que validan.

### VIII. Seguridad y gestión de errores

El repositorio NO DEBE contener contraseñas, tokens, claves privadas ni credenciales reales. Las
entradas de usuario y los datos recibidos por interfaces externas DEBEN validarse con reglas
explícitas. La aplicación DEBE contemplar y probar errores de comunicación, datos inválidos y
fallos de persistencia, presentar respuestas controladas sin revelar información sensible y
registrar contexto suficiente para el diagnóstico.

### IX. GitHub y entrega verificable

El trabajo DEBE gestionarse con control de versiones, ramas de cambio y pull requests sujetos a
revisión humana. Cada pull request DEBE identificar los requisitos y tareas que implementa e
incluir evidencia de las verificaciones automatizadas. La integración continua DEBE ejecutar,
como mínimo, las comprobaciones de formato o análisis definidas por el proyecto y las pruebas
aplicables. El procedimiento de despliegue y su configuración DEBEN documentarse y ser
reproducibles; un despliegue NO DEBE ejecutarse sin aprobación humana.

### X. Documentación técnica en español

Los artefactos de Spec Kit DEBEN mantenerse en Markdown y redactarse en español con lenguaje
técnico claro. Las decisiones relevantes DEBEN indicar contexto, alternativa seleccionada,
justificación y consecuencias. Las revisiones y validaciones DEBEN aportar evidencia verificable,
incluidos comandos ejecutados, resultados o referencias al sistema de integración continua. La
documentación afectada DEBE actualizarse en el mismo cambio que modifica el comportamiento.

### XI. Uso responsable y auditable de IA

Cada fase asistida por Codex DEBE registrar la actividad solicitada, los artefactos generados o
modificados, los resultados de las validaciones, las observaciones humanas y las correcciones
aplicadas. El contenido generado por IA DEBE someterse a revisión humana antes de aprobarse o
integrarse. Codex NO DEBE atribuirse aprobaciones, ocultar incertidumbre ni avanzar por decisión
propia a otra fase; las propuestas rechazadas o corregidas DEBEN conservar trazabilidad en el
historial de revisión o de control de versiones. Todo artefacto generado o modificado por IA DEBE
identificarse como propuesta hasta que una persona registre su aprobación explícita.

### XII. Jira como registro oficial de ejecución

Jira DEBE ser la herramienta oficial para el seguimiento del desarrollo y el proyecto NO DEBE
contener más de cinco historias de usuario funcionales. Cada historia DEBE incluir identificador,
descripción, criterios de aceptación, escenarios Gherkin, excepciones y trazabilidad. Los
documentos aprobados de Spec Kit DEBEN ser la fuente de las especificaciones; Jira DEBE reflejar
las historias de usuario y su estado de ejecución sin sustituir ni contradecir esos documentos.

Cada historia DEBE conservar referencias a sus tareas, commits, pull requests y pruebas. Los
estados previstos son Por hacer, En desarrollo, En revisión y Terminado, pero su uso DEBE
ajustarse a los estados y transiciones realmente disponibles en el proyecto Jira. Una historia
SOLO PUEDE pasar a Terminado cuando una persona haya aprobado sus criterios de aceptación, sus
pruebas y sus evidencias. Si una validación humana falla, la historia DEBE regresar al estado de
desarrollo disponible que corresponda y registrar el motivo.

Codex PUEDE proponer, mediante Atlassian MCP, la creación, edición, adición de comentarios y
transición de historias, pero toda operación de escritura en Jira REQUIERE autorización humana
previa y explícita. Codex NO DEBE crear, modificar, comentar ni transicionar elementos basándose
solo en una instrucción implícita o en la ausencia de respuesta. La eliminación de historias o
proyectos está PROHIBIDA salvo autorización humana expresa, específica y excepcional que
identifique el elemento y el motivo.

## Restricciones técnicas y de calidad

- El alcance funcional aprobado es la única base para seleccionar tecnologías, dependencias y
  patrones; toda incorporación DEBE justificar su necesidad y su costo de mantenimiento.
- El modelo relacional, los límites de capas, los contratos de aplicación y la estrategia de
  validación DEBEN quedar definidos en el plan antes de crear tareas de implementación.
- La gestión de secretos DEBE permitir configurar entornos sin almacenar valores sensibles en
  archivos versionados. Los ejemplos de configuración DEBEN usar datos no operativos.
- Los criterios de aceptación DEBEN expresarse de modo observable y asociarse con pruebas
  unitarias, de integración o de extremo a extremo según el riesgo y el límite validado.
- Un cambio NO DEBE integrarse si rompe la separación de capas, carece de pruebas aplicables,
  introduce una vulnerabilidad conocida o no actualiza la documentación afectada.

## Flujo de desarrollo y puertas de aprobación

1. Este documento permanece como propuesta mientras no exista una ratificación humana explícita
   registrada. Una persona DEBE ratificar la constitución antes de iniciar la especificación
   funcional; haberla revisado o solicitado correcciones NO satisface esta puerta.
2. La especificación define como máximo cinco historias de usuario, requisitos y criterios de
   aceptación. Codex presenta el artefacto y espera aprobación humana explícita.
3. Las aclaraciones resuelven ambigüedades sin ampliar el alcance de forma implícita. Toda
   modificación vuelve a revisión humana.
4. El plan técnico documenta arquitectura, modelo de datos, seguridad, pruebas y despliegue.
   Codex presenta el plan y espera aprobación humana explícita.
5. La lista de tareas enlaza cada actividad con requisitos, criterios y pruebas. Codex la presenta
   y espera aprobación humana explícita.
6. La implementación SOLO comienza cuando los artefactos anteriores están aprobados. Cada cambio
   se realiza en una rama, se valida automáticamente y se somete a pull request y revisión humana.
7. Las correcciones actualizan primero los artefactos que originaron la desviación y conservan la
   relación entre observación, decisión, cambio y evidencia de validación.
8. El despliegue requiere verificaciones aprobadas, procedimiento documentado y autorización
   humana explícita.
9. Tras la aprobación de cada artefacto aplicable, Jira refleja las historias y su estado de
   ejecución. Toda escritura propuesta por Codex se detiene hasta obtener autorización humana
   explícita y debe respetar las transiciones disponibles.

En cada puerta, la evidencia mínima DEBE incluir el artefacto revisado, la decisión humana, la
fecha y, cuando corresponda, los resultados de pruebas o verificaciones. Un rechazo devuelve el
trabajo a la fase afectada; no autoriza continuar con supuestos.

## Gobernanza

Esta constitución prevalece sobre prácticas, planes y tareas incompatibles del proyecto. Toda
revisión de especificación, plan, tareas, pull request o despliegue DEBE comprobar su cumplimiento
y registrar cualquier excepción. Una excepción SOLO es válida si una persona la aprueba por
escrito, define alcance y vigencia, analiza el riesgo y establece una acción de cierre.

Las enmiendas DEBEN proponerse mediante un cambio exclusivo a este archivo, incluir motivo e
impacto, actualizar el Sync Impact Report y recibir aprobación humana antes de aplicarse a otras
fases. El Sync Impact Report es material temporal de revisión y DEBE retirarse antes del commit
de una constitución ratificada. Si una enmienda afecta artefactos existentes, DEBE acompañarse de
un plan de migración y volver a someter esos artefactos a sus puertas de aprobación.

La versión sigue SemVer para gobernanza: MAYOR para eliminar o redefinir de forma incompatible
un principio; MENOR para añadir principios, secciones o requisitos materiales; PARCHE para
aclaraciones sin cambio normativo. Toda versión generada o corregida por IA conserva el estado de
propuesta aunque haya sido revisada; SOLO una declaración humana explícita puede aprobarla y
ratificarla. La fecha de ratificación DEBE registrarse en formato ISO `YYYY-MM-DD` únicamente al
producirse esa decisión. Al ratificarse una propuesta, sus metadatos DEBEN registrar el estado
ratificado y la fecha de la decisión. La fecha de última modificación DEBE actualizarse cuando
cambie el documento; mientras una versión siga pendiente, sus metadatos DEBEN identificarla como
propuesta. Antes de integrar cualquier cambio, la revisión humana DEBE verificar versión, fechas,
trazabilidad, ausencia de marcadores pendientes y coherencia con los artefactos vigentes.

**Versión**: 1.1.0 | **Estado de aprobación**: Ratificada |
**Fecha de ratificación**: 2026-10-20 | **Última modificación**: 2026-10-20
