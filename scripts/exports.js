'use strict';

import { clients } from './state.js';
import { money, todayStr } from './utils.js';
import * as uiAlerts from './uiAlerts.js';

export function initExportWizard() {
  $('#export-btn').on('click', async () => {

    const result = await Swal.fire({
      title: 'Exportar Información',
      text: 'Elegí el formato que deseás generar',
      showCancelButton: true,
      confirmButtonText: 'CSV',
      cancelButtonText: 'Cancelar',
      showDenyButton: true,
      denyButtonText: 'PDF',
      icon: 'info',
      customClass: { popup: document.body.classList.contains('dark-mode') ? 'swal2-dark' : 'swal2-light' }
    });

    if (result.isConfirmed) return exportCSV();
    if (result.isDenied) return exportPDF();
    // cancelado → no hacemos nada
  });
}

function exportCSV() {
  const rows = Object.values(clients);
  if (rows.length === 0) return uiAlerts.warning('Sin datos', 'No hay clientes para exportar.');

  let csv = "Cliente;Deuda;Último Movimiento;Teléfono\n";

  rows.forEach(c => {
    const last = c.transactions?.length
      ? c.transactions[c.transactions.length - 1].date
      : '—';

    csv += `${sanitize(c.name)};${sanitize(money(c.balance))};${sanitize(last)};${sanitize(c.phone)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `cuentasplus_${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  uiAlerts.toast('Archivo CSV exportado correctamente ✅');
}

// Placeholder para el próximo commit
function exportPDF() {
  uiAlerts.info('Exportar PDF', 'Disponible en el próximo update 📄');
}

// evitar inyección en CSV
function sanitize(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  // Evita fórmulas en Excel/Sheets y caracteres problemáticos
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s.replace(/\r?\n/g, ' ').trim();
}
