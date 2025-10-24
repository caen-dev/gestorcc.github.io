import { clients } from './state.js';
import { money, parseLocalDate } from './utils.js';

export function initDashboard() {
  const $panel = $('#dashboard-panel');
  const $backdrop = $('#dashboard-backdrop');

  function openDashboard() {
    $panel.addClass('open').attr('aria-hidden', 'false');
    $backdrop.addClass('show').attr('aria-hidden', 'false');
    updateStats();
  }
  function closeDashboard() {
    $panel.removeClass('open').attr('aria-hidden', 'true');
    $backdrop.removeClass('show').attr('aria-hidden', 'true');
  }

  $('#open-dashboard-btn').on('click', openDashboard);
  $('#close-dashboard-btn').on('click', closeDashboard);
  $backdrop.on('click', closeDashboard);
  $(document).on('keydown', (e) => { if (e.key === 'Escape' && $panel.hasClass('open')) closeDashboard(); });

  $('#refresh-stats-btn').on('click', function () {
    updateStats();
    uiAlerts.toast('Dashboard actualizada 🔄', 'info');
  });

  $('#export-csv-btn').on('click', function () {
    uiAlerts.info('Exportar CSV', 'Esta función estará disponible próximamente.');
  });

  // Tarjetas -> modales
  $('.stat-card').on('click', function () {
    const type = $(this).data('type');
    const dark = document.body.classList.contains('dark-mode');
    const styleClass = dark ? 'swal2-dark' : 'swal2-light';

    if (type === 'clients') {
      const rows = Object.values(clients)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => `<tr><td>${c.name}</td><td>${money(c.balance)}</td><td>${c.phone}</td></tr>`)
        .join('') || '<tr><td colspan="3" class="text-muted">Sin clientes</td></tr>';
      const html = `
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0">
            <thead><tr><th>Cliente</th><th>Saldo</th><th>Teléfono</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      Swal.fire({ title: 'Clientes registrados', html, customClass: { popup: styleClass }, confirmButtonColor: '#0d6efd' });
      return;
    }

    if (type === 'debt') {
      const list = Object.values(clients).filter(c => (c.balance || 0) > 0).sort((a, b) => b.balance - a.balance).slice(0, 10);
      const rows = list.length
        ? list.map(d => `<tr><td>${d.name}</td><td>${money(d.balance)}</td></tr>`).join('')
        : '<tr><td colspan="2" class="text-muted">No hay deudores.</td></tr>';
      const html = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0">
            <thead><tr><th>Cliente</th><th>Deuda</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      Swal.fire({ title: 'Top deudores', html, icon: list.length ? 'info' : 'success', customClass: { popup: styleClass }, confirmButtonColor: '#0d6efd' });
      return;
    }

    if (type === 'payments') {
      const now = new Date(); const M = now.getMonth(); const Y = now.getFullYear();
      const pagos = [];
      Object.values(clients).forEach(c => (c.transactions || []).forEach(t => {
        const d = parseLocalDate(t.date);
        if (t.type === 'Pago' && d && d.getFullYear() === Y && d.getMonth() === M)
          pagos.push({ cliente: c.name, monto: t.amount, fecha: t.date, metodo: t.paymentMethod });
      }));
      const rows = pagos.length
        ? pagos.sort((a, b) => parseLocalDate(b.fecha) - parseLocalDate(a.fecha))
            .slice(0, 20)
            .map(p => `<tr><td>${p.fecha}</td><td>${p.cliente}</td><td>${money(p.monto)}</td><td>${p.metodo}</td></tr>`).join('')
        : '<tr><td colspan="4" class="text-muted">Sin pagos este mes.</td></tr>';
      const html = `
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      Swal.fire({ title: 'Pagos del mes', html, customClass: { popup: styleClass }, confirmButtonColor: '#0d6efd' });
      return;
    }

    if (type === 'debtors') {
      const list = Object.values(clients).filter(c => (c.balance || 0) > 0).sort((a, b) => a.name.localeCompare(b.name));
      const rows = list.length
        ? list.map(d => `<tr><td>${d.name}</td><td>${money(d.balance)}</td></tr>`).join('')
        : '<tr><td colspan="2" class="text-muted">No hay clientes con deuda.</td></tr>';
      const html = `
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead><tr><th>Cliente</th><th>Saldo</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      Swal.fire({ title: 'Clientes con deuda', html, customClass: { popup: styleClass }, confirmButtonColor: '#0d6efd' });
      return;
    }
  });
}

export function updateStats() {
  const { totalClients, totalDebt, debtorsCount, monthPayments } = computeStats();
  $('#stat-total-clients').text(totalClients.toLocaleString('es-AR'));
  $('#stat-total-debt').text(money(totalDebt));
  $('#stat-debtors-count').text(debtorsCount.toLocaleString('es-AR'));
  $('#stat-month-payments').text(money(monthPayments));
}

function computeStats() {
  const names = Object.keys(clients);
  const totalClients = names.length;
  let totalDebt = 0, debtorsCount = 0, monthPayments = 0;

  const now = new Date(); const M = now.getMonth(); const Y = now.getFullYear();
  names.forEach((n) => {
    const c = clients[n]; if (!c) return;
    totalDebt += (c.balance || 0);
    if ((c.balance || 0) > 0) debtorsCount++;
    (c.transactions || []).forEach((t) => {
      if (t.type !== 'Pago') return;
      const d = parseLocalDate(t.date);
      if (d && d.getFullYear() === Y && d.getMonth() === M) monthPayments += (Number(t.amount) || 0);
    });
  });
  return { totalClients, totalDebt, debtorsCount, monthPayments };
}
