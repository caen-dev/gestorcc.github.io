'use strict';

import { money, parseLocalDate } from './utils.js?v=20260928-8';

function latestTransactionDate(transactions = []) {
  return transactions.reduce((latest, transaction) => {
    const date = parseLocalDate(transaction.date);
    if (!date) return latest;
    return !latest || date > latest.date ? { date, label: transaction.date } : latest;
  }, null)?.label || '—';
}

export function buildClientSummaryRows(clients) {
  return [
    ['Cliente', 'Saldo actual', 'Último movimiento', 'Teléfono'],
    ...clients.map((client) => [
      client.name,
      money(client.balance),
      latestTransactionDate(client.transactions),
      client.phone || '-'
    ])
  ];
}

export function buildTransactionRows(clients) {
  const rows = [['Fecha', 'Cliente', 'Tipo', 'Monto', 'Método de pago']];
  for (const client of clients) {
    for (const transaction of client.transactions || []) {
      const type = transaction.type === 'purchase' || transaction.type === 'Compra'
        ? 'Compra'
        : transaction.type === 'payment' || transaction.type === 'Pago'
          ? 'Pago'
          : transaction.type;
      rows.push([
        transaction.date,
        client.name,
        type,
        money(transaction.amount),
        transaction.paymentMethod || '-'
      ]);
    }
  }
  return rows;
}

export function serializeCSV(rows) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
}

function csvCell(value) {
  const sanitized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const safe = /^[=+@]/.test(sanitized) || /^-\S/.test(sanitized)
    ? `'${sanitized}`
    : sanitized;
  return `"${safe.replace(/"/g, '""')}"`;
}
