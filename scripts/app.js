'use strict';

import { initDB, loadAllClients, saveClient } from './db.js';
import { clients } from './state.js';
import { initTheme } from './utils.js';
import { initClients } from './clients.js';
import { initTransactions } from './transactions.js';
import { updateClientSelect, updateClientDebtList, initTableInteractions } from './ui.js';
import { initDashboard, updateStats } from './dashboard.js';
import { initExportWizard } from './export.js';
import * as uiAlerts from './uiAlerts.js';

$(async function () {

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
    (rows || []).forEach((c) => { clients[c.name] = c; });
  } catch (err) {
    console.warn('⚠ No se pudieron cargar los clientes:', err);
  }

  // 4) Migración segura de tipos de transacción (es -> en)
  try {
    let changed = false;
    Object.values(clients).forEach((c) => {
      if (!Array.isArray(c.transactions)) return;
      c.transactions.forEach((t) => {
        if (t.type === 'Pago') { t.type = 'payment'; changed = true; }
        else if (t.type === 'Compra') { t.type = 'purchase'; changed = true; }
      });
      // No forzamos recálculo de balance: asumimos balance ya consistente
      if (changed) saveClient(c);
      changed = false;
    });
  } catch (err) {
    console.warn('⚠ Migración de tipos fallida:', err);
  }

  // 5) Inicializar módulos funcionales
  initClients();
  initTransactions();
  initDashboard();
  initExportWizard();

  // 6) Render inicial de UI
  updateClientSelect();
  updateClientDebtList();
  updateStats();

  // 7) Interacciones de tabla
  initTableInteractions();
});
