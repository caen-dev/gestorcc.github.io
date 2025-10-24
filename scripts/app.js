'use strict';

import { initDB, loadAllClients } from './db.js';
import { clients } from './state.js';
import { initTheme } from './utils.js';
import { initClients } from './clients.js';
import { initTransactions } from './transactions.js';
import { updateClientSelect, updateClientDebtList, initTableInteractions } from './ui.js';
import { initDashboard, updateStats } from './dashboard.js';

$(document).ready(async function () {
  // Tema
  initTheme();

  // DB
  try {
    await initDB();
  } catch (err) {
    return uiAlerts.error('Error', String(err && err.message ? err.message : err));
  }

  // Cargar clientes desde IndexedDB -> al estado compartido
  const rows = await loadAllClients();
  // Mutamos el objeto exportado (sin reemplazar referencia)
  rows.forEach((c) => { clients[c.name] = c; });

  // Inicializar UI y módulos
  updateClientSelect();
  updateClientDebtList();
  updateStats();
  initTableInteractions();

  initClients();
  initTransactions();
  initDashboard();
});
