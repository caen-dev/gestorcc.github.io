'use strict';

import { clients } from './state.js';
import { saveClient } from './db.js';
import { updateClientDebtList, updateClientSelect } from './ui.js';
import { updateStats } from './dashboard.js';
import { todayStr, isEmpty, formatMoneyLive, parseMoneyToNumber } from './utils.js';
import * as uiAlerts from './uiAlerts.js'; // ⬅️ agregado

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
  $('#account-form').on('submit', function (e) {
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

    handleTransaction(clientName, type, amount, method);

    $('#select-client').val('').trigger('change');
    $('#account-form').trigger('reset');
    updateClientSelect(); // mantiene el placeholder y no recuerda el último
  });
}

function handleTransaction(clientName, type, amount, paymentMethod) {
  const c = clients[clientName];
  if (!c) return uiAlerts.error('Error', 'El cliente no existe.');

  const date = todayStr();
  if (type === 'purchase') {
    c.transactions.push({ type: 'Compra', amount, date, paymentMethod });
    c.balance += amount;
  } else if (type === 'payment') {
    if (c.balance <= 0) return uiAlerts.warning('Sin deuda', 'Este cliente no tiene deuda pendiente.');
    if (amount > c.balance)
      return uiAlerts.warning('Monto excedido', `El pago supera la deuda actual ($${Number(c.balance).toLocaleString('es-AR')}).`);
    c.transactions.push({ type: 'Pago', amount, date, paymentMethod });
    c.balance -= amount;
    if (c.balance < 0) c.balance = 0;
  } else {
    return uiAlerts.error('Tipo inválido', 'Tipo de transacción desconocido.');
  }

  saveClient(c);
  updateClientDebtList();
  updateStats();
  uiAlerts.toast('Transacción registrada correctamente 💰');
    }
