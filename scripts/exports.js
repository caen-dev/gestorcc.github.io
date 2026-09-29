'use strict';

import { clients } from './state.js?v=20260928-8';
import { money, todayFileStr, formatDateForPDF } from './utils.js?v=20260928-8';
import { loadBusinessInfo, saveBusinessInfo } from './settings.js?v=20260928-8';
import { replaceAllClients } from './db.js?v=20260928-8';
import { validateBackup } from './backup.js?v=20260928-8';
import { buildClientSummaryRows, buildTransactionRows, serializeCSV } from './report.js?v=20260928-8';
import { updateClientSelect, updateClientDebtList } from './ui.js?v=20260928-18';
import { updateStats } from './dashboard.js?v=20260928-15';
import * as uiAlerts from './uiAlerts.js?v=20260928-18';

export function initExportWizard() {
  $('#export-btn').on('click', async () => {
    const result = await Swal.fire({
      title: 'Exportar Información',
      input: 'select',
      inputLabel: 'Formato del informe',
      inputOptions: {
        summary: 'CSV: saldos de clientes',
        transactions: 'CSV: movimientos detallados',
        pdf: 'PDF: resumen de saldos'
      },
      inputValue: 'summary',
      showCancelButton: true,
      confirmButtonText: 'Exportar',
      cancelButtonText: 'Cancelar',
      icon: 'info',
      customClass: { popup: document.body.classList.contains('dark-mode') ? 'swal2-dark' : 'swal2-light' }
    });

    if (!result.isConfirmed) return;
    if (result.value === 'pdf') return exportPDF();
    return exportCSV(result.value);
  });

  $('#backup-btn').on('click', () => {
    setTimeout(() => Swal.fire({
      title: 'Copias de seguridad',
      text: 'Guardá una copia de tus clientes, movimientos y datos del negocio, o restaurala desde un archivo JSON.',
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: 'Cerrar',
      customClass: { popup: document.body.classList.contains('dark-mode') ? 'swal2-dark' : 'swal2-light' },
      html: `
        <p>El archivo contiene datos personales. Guardalo en un lugar seguro.</p>
        <p>La restauración reemplaza los datos guardados en este dispositivo.</p>
        <div class="backup-actions">
          <button type="button" id="download-backup-btn" class="btn btn-primary">Descargar copia JSON</button>
          <button type="button" id="restore-backup-btn" class="btn btn-outline-secondary">Restaurar copia</button>
        </div>`,
      didOpen: (popup) => {
        popup.querySelector('#download-backup-btn').addEventListener('click', () => {
          Swal.close();
          setTimeout(() => {
            try {
              exportBackup();
            } catch (err) {
              console.error(err);
              uiAlerts.error('No se pudo generar la copia', err?.message || String(err));
            }
          }, 0);
        });
        popup.querySelector('#restore-backup-btn').addEventListener('click', () => {
          Swal.close();
          $('#backup-file-input').trigger('click');
        });
      }
    }), 0);
  });

  $('#backup-file-input').on('change', async function () {
    const file = this.files[0];
    if (!file) return;

    try {
      const contents = JSON.parse(await file.text());
      const { business: restoredBusiness, clients: restoredClients } = validateBackup(contents);
      const exportedAt = new Date(contents.exportedAt);
      const backupDate = Number.isNaN(exportedAt.getTime())
        ? 'No indicada'
        : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(exportedAt);
      const transactionCount = restoredClients.reduce(
        (count, client) => count + client.transactions.length,
        0
      );
      const confirmed = await uiAlerts.confirm(
        'Revisá y confirmá la restauración',
        `Comercio: ${restoredBusiness.name || 'Sin nombre'}\nFecha de la copia: ${backupDate}\nClientes: ${restoredClients.length}\nMovimientos: ${transactionCount}\n\nAl continuar, se reemplazarán los clientes, movimientos y ajustes de este dispositivo. Esta acción no se puede deshacer.`
      );
      if (!confirmed) return;

      const previousBusiness = loadBusinessInfo();
      let businessUpdateStarted = false;
      try {
        businessUpdateStarted = true;
        saveBusinessInfo(restoredBusiness);
        await replaceAllClients(restoredClients);
      } catch (err) {
        if (businessUpdateStarted) {
          try {
            saveBusinessInfo(previousBusiness);
          } catch (rollbackError) {
            console.error('No se pudieron recuperar los datos anteriores del negocio:', rollbackError);
            throw new Error(`${err?.message || String(err)} Además, no se pudieron recuperar los ajustes anteriores.`);
          }
        }
        throw err;
      }
      Object.keys(clients).forEach((name) => { delete clients[name]; });
      restoredClients.forEach((client) => { clients[client.name] = client; });
      updateClientSelect();
      updateClientDebtList();
      updateStats();
      uiAlerts.toast('Copia restaurada correctamente ✅');
    } catch (err) {
      console.error(err);
      uiAlerts.error('No se pudo restaurar la copia', err?.message || String(err));
    } finally {
      this.value = '';
    }
  });
}

function exportBackup() {
  const backup = {
    format: 'cuentasplus-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    business: loadBusinessInfo(),
    clients: Object.values(clients).map((client) => ({
      ...client,
      transactions: (client.transactions || []).map((transaction) => ({ ...transaction }))
    }))
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cuentasplus_respaldo_${todayFileStr()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  uiAlerts.toast('Copia de seguridad descargada ✅');
}

// =================================================================
// ✅ EXPORTACIÓN CSV
// =================================================================
function exportCSV(kind = 'summary') {
  const list = Object.values(clients);
  if (!list.length) return uiAlerts.warning('Sin datos', 'No hay clientes para exportar.');

  const rows = kind === 'transactions'
    ? buildTransactionRows(list)
    : buildClientSummaryRows(list);
  if (kind === 'transactions' && rows.length === 1)
    return uiAlerts.warning('Sin movimientos', 'Todavía no hay movimientos para exportar.');

  const blob = new Blob([serializeCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const reportType = kind === 'transactions' ? 'movimientos' : 'saldos';
  a.download = `cuentasplus_${reportType}_${todayFileStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  uiAlerts.toast(kind === 'transactions'
    ? 'Informe de movimientos exportado correctamente ✅'
    : 'Informe de saldos exportado correctamente ✅');
}

// =================================================================
// ✅ EXPORTACIÓN PDF COMERCIAL
// =================================================================
async function exportPDF() {
  if (!Object.keys(clients).length)
    return uiAlerts.warning('Sin datos', 'No hay información para exportar.');

  if (!window.jspdf?.jsPDF)
    return uiAlerts.error('PDF no disponible', 'No se pudo cargar la biblioteca para generar PDF. Revisá la conexión e intentá de nuevo.');

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  if (typeof doc.autoTable !== 'function')
    return uiAlerts.error('PDF no disponible', 'No se pudo cargar el complemento para crear tablas en PDF. Revisá la conexión e intentá de nuevo.');

  const marginX = 15;
  let cursorY = 15;

  // Datos del negocio
  let business;
  try {
    business = loadBusinessInfo();
  } catch (err) {
    console.error(err);
    return uiAlerts.error('No se pudieron leer los ajustes del negocio', err?.message || String(err));
  }
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
    headStyles: { fillColor: [24, 50, 79] },
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

  doc.save(`cuentasplus_${todayFileStr()}.pdf`);
  uiAlerts.toast('PDF generado correctamente 📄');
}
