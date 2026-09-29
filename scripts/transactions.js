'use strict';

import { clients } from './state.js?v=20260928-8';
import { saveClient } from './db.js?v=20260928-8';
import { updateClientDebtList, updateClientSelect } from './ui.js?v=20260928-8';
import { updateStats } from './dashboard.js?v=20260928-10';
import { todayStr, isEmpty, formatMoneyLive, parseMoneyToNumber } from './utils.js?v=20260928-8';
import * as uiAlerts from './uiAlerts.js?v=20260928-8';

export function initTransactions() {
  const $amount = $('#amount');

  // Formateo en vivo
  $amount.on('input', function () {
    const formatted = formatMoneyLive(this.value);
    this.value = formatted;
    this.setSelectionRange(formatted.length, formatted.length);
  });
  $amount.on('blur', function () { this.value = formatMoneyLive(this.value); });
  $amount.on('focus', function () { setTimeout(() => this.select(), 0); });

  // Submit
  $('#account-form').on('submit', async function (e) {
    e.preventDefault();
    const clientName = $('#select-client').val();
    const type = $('#transaction-type').val();
    const rawAmount = $('#amount').val();
    const amount = parseMoneyToNumber(rawAmount);
    const method = $('#payment-method').val();

    if (isEmpty(clientName))
      return uiAlerts.warning('Seleccione un cliente', 'Debes elegir un cliente.');
    if (!Number.isFinite(amount) || amount <= 0)
      return uiAlerts.error('Monto inválido', 'Ingrese un monto mayor que cero.');

    const $submit = $('#account-form button[type="submit"]').prop('disabled', true);
    let saved;
    try {
      saved = await handleTransaction(clientName, type, amount, method);
    } catch (err) {
      console.error(err);
      uiAlerts.error('No se pudo guardar la transacción', err?.message || String(err));
    } finally {
      $submit.prop('disabled', false);
    }
    if (!saved) return;

    $('#select-client').val('').trigger('change');
    $('#account-form').trigger('reset');
    $('#client-filter').val('');
    $('#client-search-status').text('');
    updateClientSelect(); // mantiene el placeholder y no recuerda el último
  });
}

async function handleTransaction(clientName, type, amount, paymentMethod) {
  const c = clients[clientName];
  if (!c) {
    uiAlerts.error('Error', 'El cliente no existe.');
    return false;
  }

  const date = todayStr();
  let transaction;
  let balance = Number(c.balance) || 0;
  if (type === 'purchase') {
    const updatedBalance = balance + amount;
    if (!Number.isFinite(updatedBalance)) {
      uiAlerts.error('Monto inválido', 'El total de la deuda supera el límite permitido.');
      return false;
    }
    balance = updatedBalance;
    transaction = { type: 'purchase', amount, date, paymentMethod };
  } else if (type === 'payment') {
    if (balance <= 0) {
      uiAlerts.warning('Sin deuda', 'Este cliente no tiene deuda pendiente.');
      return false;
    }
    if (amount > balance) {
      return uiAlerts.warning('Monto excedido', `El pago supera la deuda actual ($${Number(c.balance).toLocaleString('es-AR')}).`);
    }
    transaction = { type: 'payment', amount, date, paymentMethod };
    balance = Math.max(0, balance - amount);
  } else {
    uiAlerts.error('Tipo inválido', 'Tipo de transacción desconocido.');
    return false;
  }

  const updatedClient = {
    ...c,
    balance,
    transactions: [...(c.transactions || []), transaction]
  };
  await saveClient(updatedClient);
  clients[clientName] = updatedClient;
  updateClientDebtList();
  updateStats();
  uiAlerts.toast('Transacción registrada correctamente 💰');
  return true;
}
