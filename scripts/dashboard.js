'use strict';

import { clients } from './state.js';
import { money, parseLocalDate } from './utils.js';
import * as uiAlerts from './uiAlerts.js';

export function initDashboard() {
  const $panel = $('#dashboard-panel');
  const $backdrop = $('#dashboard-backdrop');

  const openDashboard = () => {
    $panel.addClass('open').attr('aria-hidden', 'false');
    $backdrop.addClass('show').attr('aria-hidden', 'false');
    updateStats();
  };

  const closeDashboard = () => {
    $panel.removeClass('open').attr('aria-hidden', 'true');
    $backdrop.removeClass('show').attr('aria-hidden', 'true');
  };

  $('#open-dashboard-btn').on('click', openDashboard);
  $('#close-dashboard-btn').on('click', closeDashboard);
  $backdrop.on('click', closeDashboard);
  $(document).on('keydown', (e) => (e.key === 'Escape' && $panel.hasClass('open')) && closeDashboard());

  $('#refresh-stats-btn').on('click', () => {
    updateStats();
    uiAlerts.toast('Dashboard actualizada 🔄');
  });

  $('#export-csv-btn').on('click', () =>
    uiAlerts.info('Exportar CSV', 'Usá el botón “Exportar” del encabezado para elegir formato.'));

  $('.stat-card').on('click', (e) => showCardModal($(e.currentTarget).data('type')));
}

// --------------------------------------------------------

function showCardModal(type) {
  const dark = document.body.classList.contains('dark-mode');
  const styleClass = dark ? 'swal2-dark' : 'swal2-light';

  if (type === 'clients') return modalClients(styleClass);
  if (type === 'debt') return modalDebt(styleClass);
  if (type === 'payments') return modalPayments(styleClass);
  if (type === 'debtors') return modalDebtors(styleClass);
}

// -------------------------- MODALES ----------------------

function modalClients(styleClass) {
  const rows = Object.values(clients)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c =>
      `<tr><td>${c.name}</td><td>${money(c.balance)}</td><td>${c.phone}</td></tr>`
    ).join('') || `<tr><td colspan="3" class="text-muted">Sin clientes</td></tr>`;

  Swal.fire({
    title: 'Clientes registrados',
    html: wrapTable(`
      <thead><tr><th>Cliente</th><th>Saldo</th><th>Teléfono</th></tr></thead>
      <tbody>${rows}</tbody>`),
    customClass: { popup: styleClass },
    confirmButtonColor: '#0d6efd'
  });
}

function modalDebt(styleClass) {
  const list = Object.values(clients)
    .filter(c => (Number(c.balance) || 0) > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  const rows = list.length
    ? list.map(c =>
        `<tr><td>${c.name}</td><td>${money(c.balance)}</td></tr>`
      ).join('')
    : `<tr><td colspan="2" class="text-muted">No hay deudores</td></tr>`;

  Swal.fire({
    title: 'Top deudores',
    html: wrapTable(`
      <thead><tr><th>Cliente</th><th>Deuda</th></tr></thead>
      <tbody>${rows}</tbody>`),
    icon: list.length ? 'info' : 'success',
    customClass: { popup: styleClass },
    confirmButtonColor: '#0d6efd'
  });
}

function modalPayments(styleClass) {
  const now = new Date();
  const pagos = [];

  Object.values(clients).forEach(c =>
    (c.transactions || []).forEach(t => {
      if (t.type !== 'payment') return;
      const d = parseLocalDate(t.date);
      if (!d) return;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        pagos.push({ cliente: c.name, ...t });
      }
    })
  );

  const rows = pagos.length
    ? pagos
        .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
        .slice(0, 20)
        .map(p =>
          `<tr><td>${p.date}</td><td>${p.cliente}</td><td>${money(p.amount)}</td><td>${p.paymentMethod}</td></tr>`
        ).join('')
    : `<tr><td colspan="4" class="text-muted">Sin pagos este mes</td></tr>`;

  Swal.fire({
    title: 'Pagos del mes',
    html: wrapTable(`
      <thead><tr><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th></tr></thead>
      <tbody>${rows}</tbody>`),
    customClass: { popup: styleClass },
    confirmButtonColor: '#0d6efd'
  });
}

function modalDebtors(styleClass) {
  const list = Object.values(clients)
    .filter(c => (Number(c.balance) || 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = list.length
    ? list.map(d =>
        `<tr><td>${d.name}</td><td>${money(d.balance)}</td></tr>`
      ).join('')
    : `<tr><td colspan="2" class="text-muted">Sin clientes con deuda</td></tr>`;

  Swal.fire({
    title: 'Clientes con deuda',
    html: wrapTable(`
      <thead><tr><th>Cliente</th><th>Saldo</th></tr></thead>
      <tbody>${rows}</tbody>`),
    customClass: { popup: styleClass },
    confirmButtonColor: '#0d6efd'
  });
}

// -------------------------- HELPERS ----------------------

function wrapTable(innerHTML) {
  return `
    <div class="table-responsive">
      <table class="table table-sm table-striped mb-0">
        ${innerHTML}
      </table>
    </div>`;
}

// --------------------------------------------------------
export function updateStats() {
  const { totalClients, totalDebt, debtorsCount, monthPayments } = computeStats();
  $('#stat-total-clients').text(totalClients.toLocaleString('es-AR'));
  $('#stat-total-debt').text(money(totalDebt));
  $('#stat-debtors-count').text(debtorsCount.toLocaleString('es-AR'));
  $('#stat-month-payments').text(money(monthPayments));
}

function computeStats() {
  const now = new Date();
  let totalDebt = 0, debtorsCount = 0, monthPayments = 0;

  const list = Object.values(clients);
  list.forEach(c => {
    const bal = Number(c.balance) || 0;
    totalDebt += bal;
    if (bal > 0) debtorsCount++;

    (c.transactions || []).forEach(t => {
      if (t.type !== 'payment') return;
      const d = parseLocalDate(t.date);
      if (!d) return;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        monthPayments += Number(t.amount) || 0;
      }
    });
  });

  return {
    totalClients: list.length,
    totalDebt,
    debtorsCount,
    monthPayments
  };
}
