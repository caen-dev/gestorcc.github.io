'use strict';

import { parseLocalDate } from './utils.js?v=20260928-8';

export function filterTransactions(transactions, { month = '', type = 'all' } = {}) {
  return transactions
    .filter((transaction) => {
      const normalizedType = transaction.type === 'Compra'
        ? 'purchase'
        : transaction.type === 'Pago'
          ? 'payment'
          : transaction.type;
      if (type !== 'all' && normalizedType !== type) return false;
      if (!month) return true;
      const date = parseLocalDate(transaction.date);
      return date && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === month;
    })
    .slice()
    .sort((a, b) => (parseLocalDate(b.date)?.getTime() || 0) - (parseLocalDate(a.date)?.getTime() || 0));
}

export function transactionTypeLabel(type) {
  if (type === 'purchase' || type === 'Compra') return 'Compra';
  if (type === 'payment' || type === 'Pago') return 'Pago';
  return String(type ?? '');
}
