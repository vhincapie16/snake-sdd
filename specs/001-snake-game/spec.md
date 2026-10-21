# Especificación de funcionalidad: Juego Snake web

**Rama de funcionalidad**: `docs/snake-game-specification`

**Creado**: 2026-10-20

**Estado**: Propuesta pendiente de aprobación humana

**Entrada**: Juego Snake web con cinco historias de usuario propuestas para gestionar partidas, controlar la serpiente, consumir alimentos y puntuar, finalizar por colisiones, y conservar y consultar puntuaciones.

## Objetivo, alcance y actores

### Objetivo

Ofrecer una experiencia web de Snake comprensible y verificable en la que una persona pueda jugar con el teclado, controlar el ciclo de una partida, obtener puntos al crecer, recibir un final inequívoco al colisionar y consultar las diez mejores puntuaciones conservadas entre sesiones.

### Alcance incluido

- Ciclo completo de una partida: iniciar, pausar, reanudar, reiniciar y finalizar.
- Movimiento de la serpiente mediante teclado dentro de un tablero delimitado.
- Aparición y consumo de alimentos, crecimiento y puntuación.
- Finalización por colisión con paredes o con el propio cuerpo.
- Captura de un alias sin cuenta, registro persistente de resultados y ranking global de las diez mejores puntuaciones.
- Tratamiento observable de entradas inválidas, estados incompatibles y fallos de persistencia.

### Fuera de alcance

- Autenticación, cuentas, perfiles y recuperación de identidad.
- Juego multijugador, competencia en tiempo real o interacción entre jugadores.
- Controles táctiles, mandos externos o soporte específico para dispositivos móviles.
- Niveles, obstáculos, poderes, personalización visual o modalidades adicionales.
- Consolas administrativas, moderación del ranking y analítica de uso.

### Actores

- **Jugador**: persona que controla la partida, introduce un alias sin crear una cuenta, observa el resultado y consulta el ranking.
- **Sistema de persistencia**: capacidad externa al ciclo de juego que conserva resultados válidos y los suministra para construir el ranking. Esta especificación no determina su tecnología.

## Clarifications

### Session 2026-10-20

- Q: ¿Cómo se identificará al jugador en el ranking sin incorporar cuentas ni autenticación? → A: El jugador introducirá un alias que se mostrará con su resultado; el alias no crea una cuenta ni constituye una identidad autenticada.
- Q: ¿Qué política debe aplicarse al alias cuando termina una partida y antes de guardar su resultado? → A: El alias es obligatorio; tras eliminar espacios iniciales y finales debe tener entre 1 y 20 caracteres y solo puede contener letras —incluidas ñ y vocales con tilde—, números, espacios, guiones o guiones bajos. Puede repetirse. Un valor vacío o inválido impide guardar, muestra un mensaje y permite corregirlo sin perder la puntuación; el resultado se guarda una sola vez cuando el alias es válido.
- Q: ¿Qué teclas deben iniciar, pausar, reanudar y reiniciar la partida, y qué debe ocurrir al reiniciar desde el estado preparado? → A: `Enter` inicia desde preparada; `Espacio` pausa desde en curso y reanuda desde pausada; `R` solicita reiniciar desde cualquier estado, sujeto a la confirmación posterior definida para resultados pendientes. Reiniciar desde preparada regenera una configuración inicial válida, conserva la puntuación en cero y mantiene el estado preparado hasta pulsar `Enter`. Las teclas solo ejecutan acciones compatibles con el estado actual.
- Q: Cuando se pulsen varias flechas antes del próximo desplazamiento, ¿qué entrada debe conservarse y cómo deben evitarse los giros indirectos inválidos? → A: Se acepta únicamente la primera dirección válida recibida antes de cada desplazamiento y se ignoran las demás hasta completarlo. Una dirección opuesta a la efectiva se rechaza y no consume la oportunidad de aceptar otra entrada válida.
- Q: ¿Debe permitirse que la cabeza entre en la celda ocupada actualmente por la cola cuando esa cola se liberará en el mismo desplazamiento? → A: Se permite únicamente cuando la cola se libera durante ese mismo desplazamiento; si la cola no se libera, el movimiento se considera una autocolisión.
- Q: ¿La velocidad de desplazamiento debe permanecer constante durante toda la partida o aumentar con el progreso? → A: La velocidad permanece constante durante toda la partida, independientemente de la puntuación, el tiempo transcurrido o los alimentos consumidos. El ritmo inicial específico se definirá en la planificación técnica sin modificar esta regla funcional.
- Q: ¿Cuándo puede el jugador consultar el ranking Top 10? → A: Puede consultarlo desde la pantalla inicial mientras la partida está preparada y desde la pantalla de resultados después de finalizar; no está disponible durante una partida en curso ni pausada.
- Q: ¿Qué debe ocurrir al reiniciar una partida finalizada cuyo resultado aún no se ha guardado? → A: Se muestra una confirmación con las opciones Guardar primero, Descartar y Cancelar. Guardar primero solicita o valida el alias y reinicia solo después de confirmar el guardado; Descartar reinicia sin registrar; Cancelar conserva la pantalla de resultados. Si el guardado falla, se conserva el resultado pendiente; si ya estaba guardado, el reinicio es directo.
- Q: ¿Debe recuperarse un resultado pendiente después de cerrar o recargar el navegador? → A: No. El resultado pendiente se conserva únicamente mientras permanezca abierta la pantalla de resultados; si el jugador cierra o recarga el navegador antes de guardarlo, se pierde y no se recupera en otra sesión.

## Escenarios de usuario y pruebas *(obligatorio)*

### HU-001 - Gestionar el ciclo de la partida (Prioridad: P1)

Como jugador, quiero iniciar, pausar, reanudar y reiniciar una partida para controlar cuándo juego y poder comenzar de nuevo sin recargar la aplicación.

**Por qué esta prioridad**: define el ciclo mínimo que permite entrar, detener temporalmente y repetir la experiencia de juego.

**Prueba independiente**: se pueden validar las transiciones entre los estados preparada, en curso, pausada y finalizada, incluidos el reinicio directo y la confirmación cuando existe un resultado pendiente.

**Criterios de aceptación**:

- `Enter` inicia una partida únicamente desde el estado preparada, con puntuación cero y una configuración inicial válida.
- `Espacio` pausa una partida en curso; al pausar, cesan el movimiento y cualquier cambio del estado de juego.
- `Espacio` reanuda una partida pausada y conserva la posición, dirección, longitud y puntuación previas.
- `R` solicita reiniciar desde cualquier estado, incluido preparada; el reinicio es directo salvo cuando una partida finalizada conserva un resultado pendiente de guardado.
- Ante un resultado pendiente, se muestran exactamente las opciones **Guardar primero**, **Descartar** y **Cancelar** antes de reiniciar.
- Si el resultado ya está guardado, `R` reinicia directamente.
- Después de reiniciar, la partida permanece preparada e inmóvil hasta que el jugador pulse `Enter`.
- `Enter`, `Espacio` y `R` solo producen la transición definida para el estado actual; cualquier combinación incompatible se ignora sin alterar la partida.

**Escenarios Gherkin**:

```gherkin
Escenario: Iniciar una partida nueva
  Dado que el jugador se encuentra en el estado de partida preparada
  Cuando pulsa Enter
  Entonces la partida cambia al estado en curso
  Y la puntuación mostrada es cero
  Y la serpiente y el alimento ocupan posiciones iniciales válidas

Escenario: Pausar una partida en curso
  Dado que existe una partida en curso
  Cuando el jugador pulsa Espacio
  Entonces la partida cambia al estado pausada
  Y la serpiente deja de desplazarse
  Y la puntuación no cambia mientras permanezca pausada

Escenario: Reanudar una partida pausada
  Dado que existe una partida pausada
  Cuando el jugador pulsa Espacio
  Entonces la partida cambia al estado en curso
  Y continúa con la posición, dirección, longitud y puntuación conservadas

Escenario: Reiniciar sin un resultado pendiente
  Dado que existe una partida preparada, en curso o pausada, o una partida finalizada cuyo resultado ya está guardado
  Cuando el jugador pulsa R
  Entonces se crea una partida preparada con puntuación cero
  Y se genera una nueva configuración inicial válida
  Y la serpiente permanece inmóvil hasta que el jugador pulse Enter

Escenario: Solicitar confirmación antes de abandonar un resultado pendiente
  Dado que existe una partida finalizada cuyo resultado no se ha guardado
  Cuando el jugador pulsa R
  Entonces se muestran las opciones Guardar primero, Descartar y Cancelar
  Y la pantalla de resultados permanece sin cambios hasta que el jugador elija una opción

Escenario: Ignorar una acción incompatible con el estado
  Dado que la partida está preparada
  Cuando el jugador pulsa Espacio
  Entonces la partida permanece preparada
  Y su configuración y puntuación no cambian
```

---

### HU-002 - Controlar la serpiente con el teclado (Prioridad: P1)

Como jugador, quiero cambiar la dirección de la serpiente mediante el teclado para desplazarla de forma predecible por el tablero.

**Por qué esta prioridad**: el control direccional es la interacción central del juego y permite ejecutar las demás reglas durante una partida.

**Prueba independiente**: se puede iniciar una partida con una serpiente conocida y comprobar cada dirección válida, el rechazo del giro opuesto y la ausencia de efectos de teclas no admitidas.

**Criterios de aceptación**:

- Las flechas arriba, abajo, izquierda y derecha solicitan la dirección correspondiente.
- Antes de cada desplazamiento se acepta únicamente la primera dirección válida; las entradas direccionales posteriores se ignoran hasta completar ese movimiento.
- Un giro directo de 180 grados se rechaza sin alterar la dirección vigente ni consumir la oportunidad de aceptar otra dirección válida antes del mismo desplazamiento.
- Al no admitirse más de una dirección válida pendiente, una secuencia rápida no puede producir una inversión indirecta antes del siguiente movimiento.
- Las teclas no admitidas, y las flechas usadas fuera del estado en curso, no modifican la partida.

**Escenarios Gherkin**:

```gherkin
Escenario: Cambiar a una dirección válida
  Dado que la serpiente avanza hacia la derecha en una partida en curso
  Cuando el jugador pulsa la flecha arriba
  Entonces la siguiente dirección de avance es hacia arriba

Escenario: Ignorar entradas posteriores a la primera dirección válida
  Dado que la serpiente avanza hacia la derecha en una partida en curso
  Cuando el jugador pulsa la flecha arriba
  Y antes del siguiente desplazamiento pulsa la flecha izquierda
  Entonces se conserva hacia arriba como la única dirección pendiente
  Y la flecha izquierda se ignora hasta completar ese desplazamiento

Escenario: Rechazar un giro opuesto
  Dado que la serpiente avanza hacia la derecha en una partida en curso
  Cuando el jugador pulsa la flecha izquierda
  Y antes del siguiente desplazamiento pulsa la flecha arriba
  Entonces la flecha izquierda se rechaza sin ocupar la dirección pendiente
  Y la siguiente dirección de avance es hacia arriba

Escenario: Ignorar una tecla no admitida
  Dado que existe una partida en curso
  Cuando el jugador pulsa una tecla que no corresponde a ningún control definido
  Entonces la dirección y el estado de la partida no cambian

Escenario: Ignorar controles direccionales durante una pausa
  Dado que existe una partida pausada
  Cuando el jugador pulsa una flecha de dirección
  Entonces la dirección conservada no cambia
  Y la serpiente permanece inmóvil
```

---

### HU-003 - Consumir alimentos, crecer y puntuar (Prioridad: P1)

Como jugador, quiero que la serpiente consuma alimentos para crecer y acumular puntos, de modo que mi progreso sea visible y comparable.

**Por qué esta prioridad**: aporta el objetivo repetible de la partida y genera el resultado que posteriormente alimenta el ranking.

**Prueba independiente**: se puede situar un alimento frente a la cabeza, ejecutar un desplazamiento y comprobar consumo, crecimiento, incremento de puntuación y reposición del alimento.

**Criterios de aceptación**:

- Un alimento solo ocupa una celda libre dentro del tablero.
- Al alcanzar un alimento, la serpiente crece exactamente un segmento y obtiene 10 puntos.
- Tras el consumo aparece un nuevo alimento en una celda libre distinta del cuerpo de la serpiente.
- Un desplazamiento sin consumo no modifica la longitud ni la puntuación.
- La velocidad de desplazamiento permanece constante durante toda la partida, aunque aumenten la puntuación, el tiempo transcurrido o la cantidad de alimentos consumidos.

**Escenarios Gherkin**:

```gherkin
Escenario: Consumir un alimento
  Dado que la cabeza de la serpiente está junto a un alimento en su dirección de avance
  Cuando la serpiente entra en la celda del alimento
  Entonces el alimento se considera consumido
  Y la serpiente aumenta su longitud en un segmento
  Y la puntuación aumenta en 10 puntos

Escenario: Reponer el alimento consumido
  Dado que la serpiente acaba de consumir un alimento
  Cuando la partida continúa
  Entonces aparece un único alimento dentro del tablero
  Y el alimento no ocupa ninguna celda de la serpiente

Escenario: Avanzar sin consumir
  Dado que la siguiente celda no contiene alimento
  Cuando la serpiente avanza a esa celda
  Entonces conserva su longitud
  Y conserva su puntuación

Escenario: Mantener una velocidad constante durante la partida
  Dado que existe una partida en curso con una velocidad inicial establecida
  Y la serpiente ha consumido varios alimentos y acumulado puntos
  Cuando continúa la partida y transcurre más tiempo
  Entonces la velocidad de desplazamiento permanece igual a la velocidad inicial de esa partida
```

---

### HU-004 - Finalizar la partida por colisión (Prioridad: P1)

Como jugador, quiero que la partida termine al chocar con una pared o con la propia serpiente para que las reglas de derrota sean claras y el resultado quede cerrado.

**Por qué esta prioridad**: establece el límite de la partida, evita estados inválidos y determina el momento en que existe una puntuación final.

**Prueba independiente**: se puede colocar la cabeza ante cada tipo de colisión y comprobar que la partida finaliza una sola vez, detiene el movimiento y muestra el resultado.

**Criterios de aceptación**:

- Entrar en una posición fuera del tablero finaliza la partida por colisión con pared.
- Entrar en una celda ocupada por el propio cuerpo después de aplicar la liberación de la cola finaliza la partida por autocolisión.
- La cabeza puede entrar en la celda que ocupa la cola al comenzar el movimiento únicamente si esa cola se libera durante el mismo desplazamiento.
- Si la cola no se libera durante el desplazamiento, entrar en su celda se considera una autocolisión.
- Tras finalizar, no se aceptan movimientos ni se altera la puntuación.
- El jugador ve la causa del final, la puntuación definitiva y las opciones disponibles para reiniciar o consultar el ranking.

**Escenarios Gherkin**:

```gherkin
Escenario: Colisionar con una pared
  Dado que la cabeza de la serpiente está junto al límite del tablero y avanza hacia fuera
  Cuando ocurre el siguiente desplazamiento
  Entonces la partida cambia al estado finalizada
  Y se informa una colisión con pared
  Y la serpiente deja de desplazarse

Escenario: Colisionar con el propio cuerpo
  Dado que la siguiente celda en la dirección de avance seguirá ocupada por el cuerpo después del desplazamiento
  Cuando ocurre el siguiente desplazamiento
  Entonces la partida cambia al estado finalizada
  Y se informa una autocolisión

Escenario: Entrar en la celda liberada por la cola
  Dado que la siguiente celda está ocupada por la cola al comenzar el movimiento
  Y la cola se liberará durante ese mismo desplazamiento
  Cuando la serpiente avanza
  Entonces la cabeza ocupa esa celda sin provocar una autocolisión
  Y la partida continúa en curso

Escenario: Colisionar con una cola que no se libera
  Dado que la siguiente celda está ocupada por la cola al comenzar el movimiento
  Y la cola no se liberará durante ese desplazamiento
  Cuando la serpiente intenta avanzar
  Entonces la partida cambia al estado finalizada
  Y se informa una autocolisión

Escenario: Mantener inmutable una partida finalizada
  Dado que la partida está finalizada con una puntuación definitiva
  Cuando transcurre tiempo o el jugador pulsa una flecha
  Entonces la posición y la puntuación no cambian
```

---

### HU-005 - Conservar puntuaciones y consultar el ranking (Prioridad: P2)

Como jugador, quiero introducir un alias, conservar mis resultados y consultar las diez mejores puntuaciones para identificar y comparar mi desempeño entre partidas y sesiones sin crear una cuenta.

**Por qué esta prioridad**: extiende el valor de las partidas terminadas sin ser necesaria para ejecutar el ciclo básico de juego.

**Prueba independiente**: se pueden registrar más de diez resultados conocidos, iniciar una sesión nueva y verificar persistencia, orden, desempate y límite del ranking.

**Criterios de aceptación**:

- Cada partida finalizada mantiene su puntuación como resultado pendiente mientras permanezca abierta la pantalla de resultados, hasta que se guarde con un alias válido, el jugador elija explícitamente **Descartar** al reiniciar, o cierre o recargue el navegador.
- El alias es obligatorio y, después de eliminar espacios iniciales y finales, contiene entre 1 y 20 caracteres formados únicamente por letras —incluidas ñ y vocales con tilde—, números, espacios, guiones o guiones bajos.
- Un alias vacío o inválido muestra un mensaje y puede corregirse sin perder la puntuación ni crear un registro.
- Cuando el alias es válido, el resultado se registra exactamente una vez; los reintentos no producen duplicados y distintos jugadores pueden usar el mismo alias.
- Cada resultado registrado y mostrado en el ranking incluye el alias validado después de eliminar sus espacios iniciales y finales.
- Los resultados ya registrados continúan disponibles al cerrar y volver a abrir la aplicación; los resultados pendientes no se recuperan entre sesiones.
- El ranking presenta como máximo diez resultados, ordenados de mayor a menor puntuación.
- El ranking puede consultarse desde la pantalla inicial mientras la partida está preparada y desde la pantalla de resultados cuando la partida está finalizada.
- La consulta del ranking no está disponible mientras la partida está en curso o pausada.
- Las puntuaciones iguales se ordenan por la fecha de consecución más antigua primero y, si también coincide, por el identificador único de partida en orden ascendente.
- Un fallo al guardar o consultar se informa sin presentar datos inventados ni declarar éxito.
- Al elegir **Guardar primero** antes de reiniciar, se solicita o valida el alias y solo se reinicia después de confirmar el guardado.
- Al elegir **Descartar**, el resultado pendiente no se registra y la partida se reinicia; al elegir **Cancelar**, la pantalla de resultados permanece sin cambios.
- Si el guardado previo al reinicio falla, el resultado continúa pendiente y no se reinicia la partida.

**Escenarios Gherkin**:

```gherkin
Escenario: Registrar el resultado de una partida finalizada
  Dado que una partida acaba de finalizar con una puntuación válida
  Y el jugador ha introducido un alias válido
  Cuando el sistema procesa el resultado final
  Entonces conserva exactamente un registro para esa partida
  Y el registro contiene el alias, la puntuación definitiva y su momento de consecución

Escenario: Corregir un alias vacío o inválido
  Dado que una partida ha finalizado y conserva su puntuación como resultado pendiente
  Y el jugador introduce un alias vacío o que incumple la longitud o los caracteres permitidos
  Cuando solicita guardar el resultado
  Entonces se muestra un mensaje que permite corregir el alias
  Y la puntuación permanece disponible
  Y no se crea ningún registro hasta que el alias sea válido

Escenario: Reintentar el guardado sin duplicar el resultado
  Dado que una partida finalizada ya tiene un alias válido
  Y un intento anterior de guardado no fue confirmado
  Cuando el jugador vuelve a solicitar el guardado
  Entonces se conserva como máximo un registro asociado al identificador único de esa partida

Escenario: Guardar antes de reiniciar
  Dado que una partida finalizada conserva un resultado pendiente
  Y el jugador ha elegido Guardar primero
  Cuando introduce un alias válido y el guardado se confirma
  Entonces el resultado se registra exactamente una vez
  Y se crea una partida preparada con puntuación cero

Escenario: Descartar un resultado pendiente antes de reiniciar
  Dado que una partida finalizada conserva un resultado pendiente
  Cuando el jugador pulsa R y elige Descartar
  Entonces el resultado no se registra
  Y se crea una partida preparada con puntuación cero

Escenario: Cancelar el reinicio con un resultado pendiente
  Dado que una partida finalizada conserva un resultado pendiente
  Cuando el jugador pulsa R y elige Cancelar
  Entonces permanece en la pantalla de resultados
  Y el resultado pendiente se conserva sin cambios

Escenario: Conservar el resultado cuando falla el guardado previo al reinicio
  Dado que una partida finalizada conserva un resultado pendiente
  Y el jugador ha elegido Guardar primero con un alias válido
  Cuando el guardado no puede confirmarse
  Entonces permanece en la pantalla de resultados
  Y el resultado continúa pendiente sin duplicarse

Escenario: Consultar las diez mejores puntuaciones desde la pantalla inicial
  Dado que existen más de diez resultados persistidos
  Y la partida está preparada en la pantalla inicial
  Cuando el jugador consulta el ranking
  Entonces observa exactamente los diez resultados con mayor puntuación
  Y los resultados aparecen ordenados de mayor a menor puntuación

Escenario: Consultar el ranking desde la pantalla de resultados
  Dado que la partida está finalizada y se muestra la pantalla de resultados
  Cuando el jugador consulta el ranking
  Entonces observa como máximo los diez resultados registrados con mayor puntuación

Escenario: Impedir la consulta durante el juego
  Dado que la partida está en curso o pausada
  Cuando el jugador intenta consultar el ranking
  Entonces la consulta no está disponible
  Y el estado de la partida no cambia

Escenario: Resolver un empate de puntuaciones
  Dado que varios resultados tienen la misma puntuación
  Cuando forman parte del ranking
  Entonces se ordenan primero por el momento de consecución más antiguo
  Y si también coincide ese momento se ordenan por identificador único de partida ascendente

Escenario: Conservar resultados entre sesiones
  Dado que existe un resultado registrado correctamente
  Cuando el jugador cierra y vuelve a abrir la aplicación
  Entonces el resultado sigue disponible para el cálculo del ranking

Escenario: Finalizar al completar el tablero y registrar el resultado
  Dado que una partida en curso tiene un alimento en la única celda libre del tablero
  Cuando la serpiente consume el alimento y ocupa todas las celdas
  Entonces la partida finaliza por tablero completado con su puntuación definitiva
  Y conserva el resultado pendiente
  Cuando el jugador proporciona un alias válido y solicita guardarlo
  Entonces el resultado se registra exactamente una vez y puede participar en el ranking

Escenario: Guardar una puntuación de cero
  Dado que una partida ha finalizado con puntuación cero y conserva su resultado pendiente
  Cuando el jugador proporciona un alias válido y solicita guardarlo
  Entonces el resultado con puntuación cero se registra exactamente una vez
  Y puede participar en el ranking según las reglas de ordenación

Escenario: Consultar un ranking con menos de diez resultados
  Dado que existen entre uno y nueve resultados persistidos
  Y la partida está preparada en la pantalla inicial
  Cuando el jugador consulta el ranking
  Entonces observa únicamente los resultados disponibles
  Y no se muestran posiciones ni resultados ficticios

Escenario: Informar un fallo de persistencia
  Dado que el almacenamiento de resultados no está disponible
  Cuando se intenta guardar un resultado o consultar el ranking
  Entonces el jugador recibe un mensaje controlado que identifica la operación fallida
  Y el sistema no confirma un guardado ni muestra resultados no verificados
```

### Casos límite

- Si se reciben varias flechas antes del siguiente desplazamiento, se rechazan primero las opuestas a la dirección efectiva hasta encontrar la primera dirección válida; una vez aceptada, todas las flechas posteriores se ignoran hasta completar el movimiento.
- La celda ocupada inicialmente por la cola se considera libre para la cabeza solo cuando la cola se retira de ella dentro del mismo desplazamiento; en cualquier otro caso conserva su condición de celda ocupada.
- Si la serpiente ocupa todas las celdas y no existe una posición libre para otro alimento, la partida finaliza como tablero completado y conserva la puntuación alcanzada.
- El tablero completado es una finalización válida y su resultado puede registrarse y participar en el ranking conforme a las mismas reglas que los demás resultados.
- Si el ranking tiene menos de diez resultados, muestra únicamente los disponibles sin completar posiciones ficticias.
- Si dos jugadores introducen el mismo alias válido, sus resultados se tratan como registros independientes y se distinguen por el identificador único de partida.
- Una puntuación de cero es un resultado válido y puede aparecer mientras pertenezca a los diez mejores resultados disponibles.
- Recargar o cerrar la aplicación durante una partida la abandona; no genera un resultado persistido.
- Cerrar o recargar el navegador desde la pantalla de resultados elimina cualquier resultado pendiente que todavía no se haya guardado; al volver a abrir no se intenta recuperarlo.
- Reiniciar una partida antes de su finalización descarta el avance y no registra un resultado; después de finalizar, un resultado pendiente se abandona al elegir **Descartar** o se pierde si se cierra o recarga el navegador.

### Casos alternativos y excepciones

- Pulsar `Enter` fuera del estado preparada no produce transición ni altera el estado.
- Pulsar `Espacio` fuera de los estados en curso o pausada no produce transición ni altera el estado.
- Una entrada de teclado no reconocida se ignora sin mostrar un error que interrumpa la partida.
- Si el alias queda vacío después de eliminar espacios iniciales y finales, o contiene una longitud o caracteres no permitidos, el resultado permanece pendiente, se conserva la puntuación y se solicita su corrección.
- Si falla el registro de un resultado, el jugador puede solicitar un nuevo intento mientras conserve visible el resultado final de esa partida; los reintentos no pueden producir duplicados.
- Si falla la opción **Guardar primero** durante un reinicio, se conserva la pantalla de resultados y no se descarta ni duplica el resultado pendiente.
- Si falla la consulta del ranking, se muestra su indisponibilidad y se permite volver a intentarlo; la capacidad de iniciar una nueva partida permanece disponible.
- Si se intenta consultar el ranking durante una partida en curso o pausada, la consulta no está disponible y el estado de la partida no se altera.
- Los datos de resultado inválidos o incompletos se rechazan y no participan en el ranking.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001 [HU-001]**: El sistema DEBE representar de forma observable los estados preparada, en curso, pausada y finalizada.
- **RF-002 [HU-001]**: Al pulsar `Enter` en el estado preparada, el sistema DEBE iniciar una partida válida con puntuación cero, serpiente inicial y un alimento en una celda libre; fuera de preparada, `Enter` no altera la partida.
- **RF-003 [HU-001]**: Al pulsar `Espacio` en el estado en curso, el sistema DEBE pausar y detener movimiento, consumo, crecimiento y cambios de puntuación.
- **RF-004 [HU-001]**: Al pulsar `Espacio` en el estado pausada, el sistema DEBE reanudar conservando íntegramente su estado previo; en cualquier otro estado, `Espacio` no altera la partida.
- **RF-005 [HU-001]**: Al pulsar `R` desde cualquier estado, incluido preparada, el sistema DEBE solicitar un reinicio; si no existe un resultado pendiente de guardado, DEBE regenerar directamente una configuración inicial válida con puntuación cero y mantenerla preparada e inmóvil hasta que se pulse `Enter`.
- **RF-006 [HU-002]**: El sistema DEBE reconocer las cuatro flechas del teclado como solicitudes de dirección durante una partida en curso.
- **RF-007 [HU-002]**: Antes de cada desplazamiento, el sistema DEBE aceptar como pendiente únicamente la primera dirección válida y, después de aceptarla, ignorar las demás entradas direccionales hasta completar ese movimiento.
- **RF-008 [HU-002]**: El sistema DEBE rechazar cualquier dirección opuesta a la efectiva sin alterar la dirección ni consumir la oportunidad de aceptar otra entrada válida antes del mismo desplazamiento.
- **RF-009 [HU-002]**: El sistema DEBE ignorar entradas direccionales cuando la partida esté preparada, pausada o finalizada.
- **RF-010 [HU-002]**: El sistema DEBE ignorar teclas no admitidas sin modificar el estado de juego.
- **RF-011 [HU-003]**: El sistema DEBE mantener exactamente un alimento disponible durante una partida en curso mientras exista al menos una celda libre.
- **RF-012 [HU-003]**: El sistema DEBE colocar cada alimento dentro del tablero y fuera de las celdas ocupadas por la serpiente.
- **RF-013 [HU-003]**: El sistema DEBE reconocer el consumo cuando la cabeza alcanza la celda del alimento.
- **RF-014 [HU-003]**: Cada alimento consumido DEBE aumentar la longitud en un segmento y la puntuación en 10 puntos exactamente una vez.
- **RF-015 [HU-003]**: El sistema DEBE generar un nuevo alimento válido después de cada consumo mientras exista una celda libre.
- **RF-016 [HU-004]**: El sistema DEBE finalizar la partida cuando el siguiente movimiento sitúe la cabeza fuera del tablero.
- **RF-017 [HU-004]**: El sistema DEBE evaluar la ocupación resultante del desplazamiento: entrar en la celda inicial de la cola está permitido si esta se libera en el mismo movimiento; entrar en cualquier celda que permanezca ocupada, incluida una cola que no se libera, DEBE finalizar la partida por autocolisión.
- **RF-018 [HU-004]**: El sistema DEBE inmovilizar la serpiente y congelar la puntuación inmediatamente después de finalizar.
- **RF-019 [HU-004]**: El sistema DEBE mostrar la causa de finalización y la puntuación definitiva.
- **RF-020 [HU-004]**: Cada partida DEBE finalizar y producir como máximo un resultado, aunque se reciban eventos posteriores.
- **RF-021 [HU-005]**: El sistema DEBE conservar cada partida finalizada, incluida una puntuación de cero, como resultado pendiente mientras permanezca abierta la pantalla de resultados, hasta que se registre una sola vez con un alias válido, el jugador elija explícitamente **Descartar** al reiniciar, o cierre o recargue el navegador.
- **RF-022 [HU-005]**: Cada resultado DEBE conservar un identificador único de partida, el alias validado después de eliminar sus espacios iniciales y finales, la puntuación definitiva y el momento de consecución.
- **RF-023 [HU-005]**: Los resultados registrados DEBEN continuar disponibles entre sesiones de uso; los resultados pendientes NO DEBEN recuperarse después de cerrar o recargar el navegador.
- **RF-024 [HU-005]**: El sistema DEBE permitir consultar un ranking global histórico con un máximo de diez resultados y mostrar el alias asociado a cada posición desde la pantalla inicial mientras la partida esté preparada y desde la pantalla de resultados cuando esté finalizada; la consulta NO DEBE estar disponible mientras la partida esté en curso o pausada.
- **RF-025 [HU-005]**: El ranking DEBE ordenar resultados por puntuación descendente, luego por momento de consecución ascendente y finalmente por identificador único de partida ascendente.
- **RF-026 [HU-005]**: Antes de registrar, el sistema DEBE eliminar los espacios iniciales y finales del alias y aceptar únicamente valores de 1 a 20 caracteres compuestos por letras —incluidas ñ y vocales con tilde—, números, espacios, guiones o guiones bajos; los alias no requieren unicidad.
- **RF-027 [HU-005]**: El sistema DEBE rechazar un alias vacío o inválido con un mensaje corregible, conservar la puntuación pendiente mientras siga abierta la pantalla de resultados e impedir su incorporación al ranking hasta que el alias sea válido.
- **RF-028 [HU-005]**: El sistema DEBE informar de forma controlada los fallos de registro o consulta y, mientras permanezca abierta la pantalla de resultados, permitir reintentar la operación conservando como máximo un resultado por identificador único de partida.
- **RF-029 [HU-003]**: El sistema DEBE mantener constante la velocidad inicial durante toda la partida, sin modificarla por puntuación, tiempo transcurrido ni alimentos consumidos.
- **RF-030 [HU-001, HU-005]**: Si se pulsa `R` con una partida finalizada cuyo resultado está pendiente, el sistema DEBE mostrar una confirmación con exactamente tres opciones: **Guardar primero**, que solicita o valida el alias y reinicia solo después de confirmar el guardado; **Descartar**, que reinicia sin registrar el resultado; y **Cancelar**, que conserva sin cambios la pantalla de resultados y el resultado pendiente.
- **RF-031 [HU-005]**: Si falla el guardado iniciado mediante **Guardar primero** o el alias no es válido, el sistema DEBE conservar el resultado pendiente mientras siga abierta la pantalla de resultados, permanecer en ella y no reiniciar; si el resultado ya estaba guardado, `R` DEBE reiniciar directamente.

### Reglas de negocio

- **RN-001**: Las únicas transiciones manuales son preparada → en curso con `Enter`, en curso → pausada con `Espacio`, pausada → en curso con `Espacio` y cualquier estado → solicitud de reinicio con `R`; una tecla incompatible con el estado no produce transición y el reinicio queda sujeto a la protección de resultados pendientes.
- **RN-002**: Reiniciar o abandonar una partida no finalizada descarta su progreso y no registra puntuación.
- **RN-003**: La serpiente avanza en una sola dirección cardinal; entre dos desplazamientos solo puede aceptar una dirección válida pendiente, por lo que no puede invertir su dirección de forma directa ni mediante una secuencia de entradas rápidas.
- **RN-004**: Cada alimento vale 10 puntos y un segmento de crecimiento; no existen bonificaciones, multiplicadores ni cambios de velocidad asociados con el progreso de la partida.
- **RN-005**: Un alimento nunca puede compartir celda con la serpiente ni aparecer fuera del tablero.
- **RN-006**: Una colisión con pared o con una celda que permanezca ocupada por el cuerpo tras resolver el desplazamiento cierra de manera irreversible la partida actual; la celda inicial de la cola no cuenta como ocupada si se libera en ese mismo movimiento.
- **RN-007**: Un resultado corresponde de forma única a una partida finalizada y no puede duplicarse por reintentos.
- **RN-008**: El ranking se limita a diez posiciones y ordena por puntuación descendente, momento de consecución ascendente e identificador único de partida ascendente.
- **RN-009**: Un fallo de persistencia nunca puede presentarse como guardado o consulta satisfactoria.
- **RN-010**: Completar todas las celdas libres finaliza válidamente la partida como logro de tablero completado, no como colisión, y habilita el registro de su resultado en el ranking.
- **RN-011**: Una partida finalizada conserva su resultado pendiente mientras permanezca abierta la pantalla de resultados, hasta recibir un alias válido y guardarse, ser descartado explícitamente al reiniciar, o perderse al cerrar o recargar el navegador; compartir alias entre resultados no los identifica como la misma partida ni altera su unicidad.
- **RN-012**: El ranking solo puede consultarse en los estados preparada, desde la pantalla inicial, y finalizada, desde la pantalla de resultados; durante los estados en curso y pausada permanece indisponible sin alterar la partida.
- **RN-013**: Un resultado pendiente se conserva solo mientras permanezca abierta la pantalla de resultados. **Cancelar** y cualquier fallo o validación fallida de **Guardar primero** deben conservarlo sin reiniciar; **Descartar** lo elimina antes de reiniciar, y cerrar o recargar el navegador lo pierde sin recuperación posterior. Un resultado ya guardado no requiere confirmación para reiniciar.

### Entidades clave

- **Partida**: sesión de juego con identificador, estado, puntuación, dirección vigente y momento de inicio y finalización.
- **Serpiente**: secuencia ordenada de celdas que determina cabeza, cuerpo, longitud y ocupación dentro del tablero.
- **Alimento**: objetivo activo situado en una única celda libre y asociado a un valor fijo de 10 puntos.
- **Resultado**: puntuación final asociada a un identificador único de partida; permanece pendiente hasta guardarse con un alias válido o descartarse explícitamente y, una vez registrada, conserva de forma inmutable el alias normalizado, la puntuación definitiva y el momento de consecución.
- **Ranking**: vista derivada de los diez resultados con mayor puntuación conforme a las reglas de orden y desempate.

### Requisitos no funcionales

- **RNF-001**: La experiencia DEBE ser utilizable en navegadores de escritorio vigentes mediante teclado, sin requerir un dispositivo apuntador para las acciones de juego.
- **RNF-002**: El 95 % de las entradas direccionales válidas DEBE mostrar reconocimiento visual en un máximo de 100 ms; el movimiento efectivo de la serpiente DEBE ocurrir únicamente en el siguiente desplazamiento programado del juego.
- **RNF-003**: El 95 % de las consultas exitosas del ranking DEBE mostrar su resultado en un máximo de 2 segundos bajo condiciones normales de uso.
- **RNF-004**: El estado, la puntuación, la pausa y la finalización DEBEN distinguirse sin depender exclusivamente del color.
- **RNF-005**: Los mensajes de error DEBEN ser comprensibles, no revelar información sensible y permitir continuar con acciones seguras.
- **RNF-006**: Las entradas y los resultados destinados a persistencia DEBEN validarse antes de aceptarse.
- **RNF-007**: Las credenciales y datos sensibles NO DEBEN exponerse al jugador ni formar parte de mensajes de diagnóstico visibles.
- **RNF-008**: Para un mismo conjunto de resultados válidos, el ranking DEBE producir siempre el mismo orden.
- **RNF-009**: Los textos visibles para el jugador DEBEN presentarse en español claro.

### Trazabilidad inicial

| Historia | Requisitos funcionales | Reglas principales |
|----------|-------------------------|--------------------|
| HU-001 | RF-001 a RF-005, RF-030 | RN-001, RN-002, RN-013 |
| HU-002 | RF-006 a RF-010 | RN-003 |
| HU-003 | RF-011 a RF-015, RF-029 | RN-004, RN-005, RN-010 |
| HU-004 | RF-016 a RF-020 | RN-006, RN-010 |
| HU-005 | RF-021 a RF-028, RF-030, RF-031 | RN-007, RN-008, RN-009, RN-011, RN-012, RN-013 |

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: El 100 % de los escenarios de aceptación documentados para las cinco historias produce el resultado observable esperado.
- **CE-002**: Iniciar, pausar, reanudar o completar un reinicio directo o ya confirmado refleja el nuevo estado al jugador en un máximo de 1 segundo.
- **CE-003**: Durante una pausa de al menos 10 segundos, la posición, longitud y puntuación permanecen sin cambios en el 100 % de las pruebas.
- **CE-004**: En el 100 % de los consumos válidos, la longitud aumenta en un segmento y la puntuación en 10 puntos exactamente una vez.
- **CE-005**: El 100 % de las colisiones de pared o cuerpo incluidas en el conjunto de prueba finaliza la partida sin movimientos ni puntuación posteriores.
- **CE-006**: Con un conjunto conocido de al menos 15 resultados, el ranking muestra exactamente los 10 mejores en el orden definido, incluidos los empates.
- **CE-007**: El 100 % de los resultados guardados correctamente continúa disponible al iniciar una sesión posterior.
- **CE-008**: Ante fallos simulados de registro y consulta, el 100 % de los casos muestra un mensaje controlado y no informa una operación exitosa inexistente.

## Supuestos

- La primera versión está dirigida a una persona que juega en un navegador de escritorio con teclado.
- Las cuatro flechas son el conjunto inicial y suficiente de controles direccionales.
- La velocidad de desplazamiento permanece constante durante una partida; el ritmo inicial específico se definirá en la planificación técnica sin introducir progresión por puntuación, tiempo o alimentos consumidos.
- El ranking es global e histórico, muestra el alias introducido, la posición, la puntuación y el momento de consecución, sin cuentas ni autenticación.
- Cada alimento otorga 10 puntos y un segmento de crecimiento.
- Los resultados se conservan mientras no exista una política de retención aprobada que indique lo contrario.
- La persistencia se realizará en una base de datos relacional, conforme a la constitución, sin seleccionar producto ni diseño en esta fase.
- La aplicación puede informar fallos de persistencia sin impedir que el jugador inicie una partida nueva.

## Dependencias

- Disponibilidad de una capacidad persistente para registrar y consultar resultados.
- Disponibilidad de un navegador de escritorio que entregue eventos de las cuatro flechas del teclado.
- Definición posterior, durante planificación, de mecanismos técnicos que satisfagan las reglas sin cambiar su comportamiento aprobado.

## Registro de propuesta y revisión

- Artefacto generado por Codex mediante `speckit-specify` el 2026-10-20.
- Estado del flujo: Specify y Clarify completadas y aprobadas formalmente por revisión humana el 2026-10-20.
- La aprobación de esta especificación no autoriza por sí sola la fase Plan ni ninguna escritura o modificación en Jira.
