'use strict';

import { clients } from './state.js';
import { money, todayStr, formatDateForPDF } from './utils.js';
import { loadBusinessInfo } from './settings.js';
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
  });
}

// =================================================================
// ✅ EXPORTACIÓN CSV
// =================================================================
function exportCSV() {
  const list = Object.values(clients);
  if (!list.length) return uiAlerts.warning('Sin datos', 'No hay clientes para exportar.');

  let csv = "Cliente;Deuda;Último Movimiento;Teléfono\n";

  list.forEach(c => {
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

// Evitar inyección o caracteres conflictivos
function sanitize(str) {
  if (!str) return '';
  const s = String(str);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s.replace(/\r?\n/g, ' ').trim();
}

// =================================================================
// ✅ EXPORTACIÓN PDF COMERCIAL
// =================================================================
async function exportPDF() {
  if (!Object.keys(clients).length)
    return uiAlerts.warning('Sin datos', 'No hay información para exportar.');

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const marginX = 15;
  let cursorY = 15;

  // Datos del negocio
  const business = loadBusinessInfo();
  if (business.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(business.name, marginX, cursorY);
    cursorY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (business.phone) {
      doc.text(`Tel: ${business.phone}`, marginX, cursorY);
      cursorY += 5;
    }
    if (business.address) {
      doc.text(business.address, marginX, cursorY);
      cursorY += 5;
    }
    cursorY += 5;
  }

  // Branding Cuentas+
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Cuentas+", marginX, cursorY);
  cursorY += 6;

  // Fecha del reporte
  doc.setFontSize(10);
  doc.text(`Fecha: ${formatDateForPDF(new Date())}`, marginX, cursorY);
  cursorY += 10;

  // Tabla principal
  const tableData = Object.values(clients).map(c => {
    const last = c.transactions?.length
      ? c.transactions[c.transactions.length - 1].date
      : '—';
    return [
      c.name,
      money(c.balance),
      last,
      c.phone || '-'
    ];
  });

  doc.autoTable({
    startY: cursorY,
    head: [['Cliente', 'Saldo', 'Último Mov.', 'Teléfono']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [13, 110, 253] },
    styles: { fontSize: 9 }
  });

  // Footer comercial
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Documento generado con Cuentas+ — Tu negocio en orden, siempre.",
    marginX,
    pageH - 10
  );

  doc.save(`cuentasplus_${todayStr()}.pdf`);
  uiAlerts.toast('PDF generado correctamente 📄');
}
