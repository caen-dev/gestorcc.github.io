'use strict';

import { initDB, loadAllClients, saveClients } from './db.js?v=20260928-8';
import { clients } from './state.js?v=20260928-8';
import { initTheme } from './utils.js?v=20260928-8';
import { initClients } from './client.js?v=20260928-8';
import { initTransactions } from './transactions.js?v=20260928-8';
import { updateClientSelect, updateClientDebtList, initTableInteractions } from './ui.js?v=20260928-16';
import { initDashboard, updateStats } from './dashboard.js?v=20260928-15';
import { initExportWizard } from './exports.js?v=20260928-8';
import { initBusinessSettings } from './settings.js?v=20260928-8';
import * as uiAlerts from './uiAlerts.js?v=20260928-8';

export async function startApp() {

  // 1) Tema (persistente)
  initTheme();

  // 2) Inicializar DB
  try {
    await initDB();
  } catch (err) {
    uiAlerts.error('Error', err?.message || String(err));
    console.error(err);
    return;
  }

  // 3) Cargar clientes a estado global
  try {
    const rows = await loadAllClients();
    rows.forEach((c) => { clients[c.name] = c; });
  } catch (err) {
    uiAlerts.error('No se pudieron cargar los datos', err?.message || String(err));
    console.error(err);
    return;
  }

  // 4) Migración segura de tipos de transacción (es -> en)
  try {
    const migrated = Object.values(clients).map((client) => {
      let changed = false;
      const transactions = (client.transactions || []).map((transaction) => {
        if (transaction.type === 'Pago') {
          changed = true;
          return { ...transaction, type: 'payment' };
        }
        if (transaction.type === 'Compra') {
          changed = true;
          return { ...transaction, type: 'purchase' };
        }
        return transaction;
      });
      return changed ? { ...client, transactions } : null;
    }).filter(Boolean);
    await saveClients(migrated);
    migrated.forEach((client) => { clients[client.name] = client; });
  } catch (err) {
    uiAlerts.warning('No se pudieron actualizar algunos datos', err?.message || String(err));
    console.error(err);
  }

  // 5) Inicializar módulos funcionales
  initClients();
  initTransactions();
  initDashboard();
  initBusinessSettings();
  initExportWizard();

  // 6) Render inicial de UI
  updateClientSelect();
  updateClientDebtList();
  updateStats();

  // 7) Interacciones de tabla
  initTableInteractions();
}

initHeaderTools();
$(startApp);

function initHeaderTools() {
  if (typeof document === 'undefined') return;
  const toggle = document.getElementById('header-tools-toggle');
  const panel = document.getElementById('header-tools-panel');
  if (!toggle || !panel) return;

  const setOpen = (open, restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar herramientas' : 'Abrir herramientas');
    const icon = toggle.querySelector('i');
    icon?.classList.toggle('fa-bars', !open);
    icon?.classList.toggle('fa-times', open);
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    panel.classList.toggle('is-open', open);
    if (!open && restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) panel.querySelector('button, a, input')?.focus();
  });

  panel.addEventListener('click', (event) => {
    const action = event.target.closest('a, button');
    if (action?.id === 'open-dashboard-btn') {
      window.setTimeout(() => setOpen(false), 0);
    } else if (action) {
      window.setTimeout(() => setOpen(false, panel.contains(document.activeElement)), 0);
    }
  });

  const summaryButton = document.getElementById('open-dashboard-btn');
  const overview = document.getElementById('business-overview');
  summaryButton?.addEventListener('click', () => {
    if (!overview || !summaryButton) return;
    const showing = overview.hidden;
    overview.hidden = !showing;
    summaryButton.setAttribute('aria-expanded', String(showing));
    summaryButton.setAttribute('aria-label', showing ? 'Ocultar resumen de cuentas' : 'Mostrar resumen de cuentas');
    if (showing) {
      overview.focus();
      overview.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      toggle.focus();
    }
  });

  document.getElementById('close-overview-btn')?.addEventListener('click', () => {
    if (!overview || !summaryButton) return;
    overview.hidden = true;
    summaryButton.setAttribute('aria-expanded', 'false');
    summaryButton.setAttribute('aria-label', 'Mostrar resumen de cuentas');
    toggle.focus();
  });

  document.addEventListener('click', (event) => {
    if (
      !panel.contains(event.target) &&
      !toggle.contains(event.target) &&
      toggle.getAttribute('aria-expanded') === 'true'
    ) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });
}
