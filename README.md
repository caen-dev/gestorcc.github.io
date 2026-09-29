# Cuentas+

Aplicación web para llevar clientes, compras y pagos de un comercio pequeño. La interfaz usa módulos JavaScript nativos y guarda los registros localmente en IndexedDB del navegador.

La interfaz usa una paleta discreta azul y gris, con modos claro y oscuro. El encabezado destaca la marca y abre un menú animado de herramientas desde la izquierda; el selector de tema está dentro de ese menú. El resumen está oculto en la pantalla principal y se muestra únicamente desde la herramienta **Resumen**.

El acceso **Resumen** del menú muestra cuatro métricas, cuyos indicadores abren detalles; **Cerrar resumen** lo oculta nuevamente. El directorio separa cliente, contacto, cantidad/fecha del último movimiento, saldo y acciones; los filtros de saldo/orden quedan agrupados bajo el buscador. El menú funciona con teclado, se cierra con Escape y conserva el foco visible. El cuadro de ajustes mantiene el foco dentro del diálogo y oculta el contenido de fondo a tecnologías de asistencia. Los controles principales y las acciones por cliente tienen áreas táctiles amplias.

## Uso

Abrí la aplicación publicada o servila desde un servidor web estático. La primera carga requiere conexión para descargar las bibliotecas de interfaz y exportación externas. Los datos de clientes se guardan en el navegador y no se sincronizan automáticamente entre dispositivos ni perfiles.

En **Respaldo** podés descargar una copia JSON de clientes, movimientos y datos del comercio, o restaurarla en este dispositivo. Restaurar reemplaza todos los registros actuales; guardá una copia antes si necesitás conservarlos. El JSON contiene datos personales y no está cifrado: guardalo en un lugar seguro. Los informes CSV y PDF están en **Exportar**.

El directorio incluye todos los clientes, también los que ya no tienen deuda. La búsqueda encuentra nombres y datos de contacto sin distinguir mayúsculas ni tildes; podés filtrar deudores y ordenar por actividad más reciente, deuda o nombre. Al registrar una transacción, el buscador inteligente encuentra clientes por nombre, teléfono o domicilio; podés recorrer sugerencias con las flechas y seleccionar con Enter. En una instalación vacía se muestran los pasos iniciales. Desde **Exportar** podés generar un CSV con saldos resumidos, un CSV con cada movimiento o un PDF de saldos. Antes de restaurar una copia, revisá el comercio, la fecha y las cantidades que se muestran en la confirmación.

En el directorio, **Ver información** abre los datos de contacto y el historial completo del cliente en la misma fila. El historial es de solo lectura: para preservar integridad contable, todavía no se permite modificar ni eliminar movimientos registrados.

## Desarrollo

La aplicación no tiene paso de compilación ni dependencias de runtime locales. Serví la carpeta raíz con un servidor estático; por ejemplo, `python -m http.server 8000`, y abrí `http://localhost:8000`.

Para ejecutar las pruebas de regresión necesitás Node.js 22 o posterior:

```sh
npm test
```

GitHub Actions ejecuta esta suite en cada push y pull request. Las pruebas automatizadas complementan, pero no sustituyen, la validación en navegadores y dispositivos reales.

En worktrees de Windows con finales CRLF, comprobá el diff con `git -c core.whitespace=cr-at-eol diff --check`.

Consultá [PROGRESS.md](PROGRESS.md) para el estado de avance, validaciones y trabajo pendiente antes de una oferta comercial.

La interfaz incluye navegación por teclado, enlace para saltar al contenido, foco visible y soporte para reducir movimiento. Estas medidas mejoran la accesibilidad básica, pero todavía hace falta validar con lectores de pantalla y auditorías en dispositivos reales antes de declarar conformidad con WCAG.

Se han hecho pruebas de flujo en Microsoft Edge y Google Chrome, incluyendo emulación de anchos móviles. Esa emulación no equivale a probar Safari/iOS o Chrome/Android en dispositivos físicos.
