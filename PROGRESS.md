# Estado del producto

Última actualización: 2026-09-28.

## Alcance del avance

El porcentaje es una estimación, no una certificación de producto terminado. Para el **MVP local de un comercio y un perfil de navegador**, la estimación es ahora de alrededor del 94–95%: las operaciones principales, respaldo/restauración, directorio, historial filtrable, informes, pruebas automatizadas y una pasada de navegador de escritorio con emulación móvil están cubiertos. Esto no equivale a estar listo para vender a clientes sin validación en dispositivos físicos, revisión formal de privacidad/operación y ejecución confirmada de CI en GitHub.

## Mejoras implementadas

- Corregidos los enlaces de módulos que impedían arrancar la aplicación; Ajustes, CSV y PDF vuelven a estar conectados.
- Compras y pagos se guardan con tipos consistentes; el dashboard se actualiza sin recargar y se mantienen las transacciones antiguas.
- Alta y edición comparten el envío del formulario; se puede guardar editando con Enter, y hay una salida explícita para cancelar la edición sin borrar ni renombrar el registro.
- Los datos de clientes se muestran como texto en la tabla y los detalles del dashboard, no se interpretan como HTML.
- El encabezado y los resúmenes se adaptan a móvil/tablet; el zoom del usuario sigue disponible y los controles se pueden operar con teclado.
- Las operaciones de IndexedDB esperan confirmación de commit; errores de lectura o escritura se informan y no se presentan como éxitos. Cambiar el nombre de un cliente es atómico; al restaurar, el reemplazo de registros se confirma en una única transacción y se intenta revertir el perfil del negocio si esa transacción falla.
- Los fallos de almacenamiento del perfil del negocio se informan, y el formulario de ajustes permanece abierto para no aparentar que guardó.
- Añadida copia JSON versionada de clientes, movimientos y datos del comercio, validada antes de restaurar y con confirmación explícita antes de reemplazar registros. Se avisa que el archivo incluye información personal y no está cifrado.
- CSV con campos entrecomillados/escapados y nombres de archivo compatibles con Windows; se añadió guía de uso y este registro de avance.
- Suite inicial `node:test` sin dependencias de runtime, ejecutable con `npm test`, y workflow de GitHub Actions con Node.js 22.
- Extraída la validación de copias a un módulo independiente para hacerla comprobable; se cubren restauración/versionado, transacciones antiguas, clientes duplicados, datos malformados, escrituras IndexedDB fallidas y formatos monetarios/fechas.
- El monto acepta decimales con coma o punto para teclados/regiones distintas y rechaza entradas parciales; las fechas rechazan calendarios imposibles en vez de normalizar un día fuera de rango.
- Añadido enlace para saltar al contenido, etiquetas explícitas de búsqueda, ayuda asociada al campo de monto y estructura accesible para la tabla y el modal de Ajustes.
- La edición de clientes anuncia el modo en el encabezado y coloca el foco en el nombre; los cuadros de diálogo SweetAlert conservan su gestión de foco al superponerse a otros flujos.
- Los estilos muestran un foco visible consistente, deshabilitan visualmente botones durante guardados y respetan la preferencia del sistema de reducir movimiento.
- El directorio lista también a clientes con saldo cero, permite alternar entre todos y solo deudores, buscar por nombre/teléfono/domicilio y anuncia el total mostrado; un comercio sin registros ve pasos de inicio y acceso para agregar el primero.
- La búsqueda del directorio y el buscador inteligente de transacciones ignoran mayúsculas y tildes. El buscador prioriza coincidencias de nombre, permite recorrer hasta ocho sugerencias con teclado y selecciona el cliente del control requerido antes de guardar.
- El directorio muestra el conteo de movimientos; los detalles personales y todo el historial cronológico se abren desde **Ver información**, sin ocupar una columna de movimientos. La tabla del historial conserva desplazamiento legible en pantallas pequeñas.
- Exportación con selector para CSV de saldos, CSV detallado de todos los movimientos o PDF de saldos; ambos CSV escapan campos y neutralizan fórmulas de hojas de cálculo. El último movimiento del resumen se determina por fecha real, no solo por el orden del arreglo.
- La confirmación de restauración muestra comercio, fecha de exportación y cantidad de clientes/movimientos antes de reemplazar datos.
- El historial de cada cliente se consulta incluso si ya saldó la deuda, con filtro por mes/tipo, orden cronológico descendente, tabla desplazable en móvil y contenido generado como texto para evitar interpretar datos del cliente como HTML.
- El directorio permite ordenar por actividad real más reciente, saldo más alto o nombre; el cálculo usa la fecha del movimiento más reciente, aunque los registros históricos no estén guardados cronológicamente.
- Se simplificó la presentación a una paleta azul/gris discreta, paneles planos y encabezados directos; los formularios aparecen primero, las cuatro métricas compactas quedan debajo y el directorio sigue a continuación.
- El encabezado concentra la marca Cuentas+ y un botón de herramientas a la izquierda; exportar, respaldo, ajustes, resumen y tema aparecen en un panel desplegable animado, operable por teclado y cerrable con Escape o al pulsar fuera.
- El resumen de cuentas queda oculto al iniciar y solo se muestra desde la herramienta **Resumen**, con cierre explícito y métricas conservadas.
- El directorio presenta cliente y contacto juntos, seguidos por movimientos (cantidad y fecha de la última actividad), saldo y acciones; conserva los controles de información y edición por cliente. Se validan fechas reales al determinar el último movimiento, y el detalle expandido ocupa correctamente todas las columnas.
- La guía inicial aparece solo cuando no hay clientes guardados y se oculta al crear el primero; los títulos de las tarjetas y los botones de acción tienen jerarquía tipográfica clara y adaptable.
- En pantallas estrechas la tabla conserva columnas legibles con desplazamiento horizontal dentro de su propio contenedor, sin ensanchar la página.
- Se integró el buscador del directorio en el encabezado de la sección, junto al título en escritorio y debajo del título en móvil; los filtros de saldo y orden quedan agrupados y alineados aparte.
- La capa visual mantiene foco visible, controles táctiles de 44 px, tema oscuro y soporte de movimiento reducido sin animaciones decorativas persistentes.
- El usuario pidió descartar el estilo anterior, que mostraba el resumen y demasiados elementos destacados en la portada; esta simplificación reemplaza esa presentación sin quitar los detalles del resumen ni los flujos existentes.
- Los cuadros de diálogo comparten colores del tema; el orden de pestañas y el nombre de las tablas del dashboard mejoran, inputs y estados Bootstrap heredan colores claro/oscuro y la tipografía usa una pila del sistema para consistencia sin descargar fuentes.
- Se actualizó la caché de CSS y los módulos retocados para que la versión estática publicada recoja el tema y el flujo de resumen sin depender de contenido antiguo en caché.

## Validaciones de esta etapa

- El usuario confirma que el buscador y el historial actualizados funcionan correctamente en navegador y móvil.
- El rediseño y sus hojas de estilo están disponibles en la vista previa de esta worktree; queda pendiente la inspección visual final de ambos temas en tamaños de escritorio y móvil.
- Cambios de auditoría: falta completar la verificación dinámica de apertura/cierre del modal de ajustes, foco/inert y tarjetas del resumen en ambos temas.

- En Microsoft Edge, alta de cliente, compra, recarga con datos conservados y edición/renombrado con saldo y movimientos preservados; cancelar edición restaura el formulario sin modificar el cliente.
- Se descargó/capturó una copia JSON completa y se restauró una copia de prueba, verificando datos y saldo; se rechazó un JSON malformado sin reemplazar los registros existentes.
- Se cargaron movimientos antiguos `Compra`/`Pago` y se confirmó su migración persistente a `purchase`/`payment` junto con el total correcto en el dashboard.
- Se simuló un fallo de IndexedDB al guardar una transacción; saldo y movimientos en pantalla permanecieron intactos y el formulario volvió a habilitarse.
- Se simuló un fallo de almacenamiento de Ajustes; no se mostró confirmación de éxito ni se cerró el modal.
- Se simuló un fallo al confirmar la restauración; no se reemplazaron los clientes y el perfil del negocio volvió al valor anterior.
- En Microsoft Edge, se comprobó que no hay desbordamiento horizontal a 320, 390, 575, 768 y 1440 px y que la etiqueta de viewport no limita el zoom.
- Se probaron los ajustes, informes CSV/PDF y los controles de teclado/foco del dashboard.
- Se volvió a comprobar el enlace de imports y exports del grafo de módulos; `git -c core.whitespace=cr-at-eol diff --check` pasó.
- Suite automatizada: `npm test` con Node.js 22.23.3 — 13/13 pruebas pasaron tras añadir los filtros de historial; todos los módulos pasaron `node --check` y el grafo de imports arranca en Node; GitHub Actions está configurado, pero su ejecución remota aún no fue confirmada.
- Suite actualizada: `node --test` — 15/15 pruebas; todos los scripts pasaron `node --check` y `git -c core.whitespace=cr-at-eol diff --check` pasó.
- Informes CSV y directorio: pruebas verifican clientes sin deuda, búsqueda por contacto sin distinguir tildes, movimientos Compra/Pago completos, encabezados y neutralización de fórmulas.
- Historial: pruebas verifican filtrado por mes/tipo, compatibilidad con tipos antiguos y orden más reciente primero.
- En Microsoft Edge se recorrieron carga inicial, alta, compra, pago, persistencia y apertura del historial a 390 px.
- En Google Chrome se recorrieron anchos de 320, 390, 575, 768 y 1440 px sin desbordamiento horizontal; se verificaron alta, compra/pago con coma y punto, almacenamiento, búsqueda de nombre acentuado, edición/renombre conservando saldo e historial, historial filtrado y descarga/lectura de CSV detallado.
- En Chrome se probó la previsualización de copia: cancelar conservó los registros; confirmar reemplazó clientes y ajustes con los conteos/fecha correctos. También se verificaron enlace de salto, foco visible, etiquetas de búsqueda, descripción del monto, soporte de movimiento reducido y ciclo de teclado Tab/Escape del dashboard.
- Buscador inteligente de clientes: pruebas unitarias añadidas para priorización de nombre exacto, normalización de tildes y búsqueda por teléfono/domicilio; el usuario confirma el funcionamiento general en navegador y móvil.
- Directorio: pruebas automatizadas de orden por fecha real, deuda y nombre. En Edge se verificaron las tres opciones y la ausencia de desbordamiento horizontal del documento en escritorio y a 390 px.
- Revisión visual actual: marca y controles del encabezado reorganizados; buscador del directorio junto al título en escritorio y debajo en móvil; resumen de cuatro métricas trasladado bajo los formularios. En vista previa se comprobó el layout a 320, 390, 768 y 1200 px CSS, sin overflow, cambio claro/oscuro y apertura de detalle desde las tarjetas; `npm test` pasó 15/15.
- El árbol de accesibilidad de Chrome expuso los landmarks `banner`, `main` y `contentinfo`, y el nombre accesible del enlace para saltar al contenido.
- Se usaron los binarios reales de Edge y Chrome en modo automatizable/headless y emulación de tamaños de pantalla; esto **no** sustituye pruebas en Safari iOS, Chrome Android en hardware ni una prueba completa con lector de pantalla.
- Validación de interfaz/accesibilidad: pendiente de completar con inspección visual y pruebas de teclado con lectores de pantalla/dispositivos; los cambios actuales son mejoras de base, no una certificación WCAG.

## Trabajo pendiente antes de considerar una salida comercial

- Publicar el workflow `Tests` y observarlo en GitHub Actions: en este momento solo aparece el workflow de Pages en GitHub, porque los cambios de CI de esta worktree todavía no están publicados.
- Probar dispositivos físicos y plataformas aún no cubiertas, especialmente iOS Safari y Android Chrome; validar con lectores de pantalla, descargas/restauración y funcionamiento con conectividad intermitente.
- Para probar el teléfono en la misma LAN, el equipo debe estar conectado a una red de confianza marcada como Privada en Windows; ahora la Wi‑Fi está en perfil Público y no se expondrá el servidor de desarrollo mientras siga así.
- Definir validaciones y políticas de negocio con usuarios reales; revisar accesibilidad y privacidad con un checklist formal.
- Documentar soporte, retención y recuperación de datos, y verificar el despliegue desde cero antes de una publicación.
- Si se requiere acceso multiusuario o sincronización entre dispositivos, diseñar almacenamiento remoto, autenticación, autorización y copias administradas; IndexedDB por sí sola no cubre ese modelo.
- Definir si el archivo de respaldo debe cifrarse y revisar cómo recuperar de forma consistente entre IndexedDB y preferencias del comercio si el navegador se interrumpe durante la restauración.

## Siguientes mejoras recomendadas

1. Probar los flujos de alta, registro, respaldo/restauración y consulta en Android Chrome e iOS Safari, incluyendo lector de pantalla; son las principales validaciones de experiencia real todavía abiertas.
2. Evaluar resiliencia del primer arranque y de uso sin conexión: hoy se descargan bibliotecas desde CDN. Antes de introducir caché offline/PWA, decidir cómo se actualizarán las dependencias y cómo se comunica al usuario el estado local de sus datos.
3. Hacer pruebas moderadas con comercios reales sobre el directorio, el registro de movimientos y el respaldo; priorizar cambios a partir de dificultades observadas, sin agregar flujos de producto no validados.
4. Si se confirma que más de un dispositivo o usuario debe compartir datos, definir un alcance de sincronización y permisos; no extender el almacenamiento local actual para simular sincronización.
