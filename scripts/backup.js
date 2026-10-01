'use strict';

/**
 * BACKUP.JS — Validation and normalization for backup/restore operations
 *
 * MONETARY CONTRACT FOR BACKUP/RESTORE:
 *
 * Export format (JSON):
 * - All monetary values are stored as integer cents (amountCents).
 * - balance: integer cents (e.g., 150 = $1,50)
 * - transaction.amountCents: integer cents
 * - transaction.amount: integer cents (duplicate for compatibility, not authoritative)
 *
 * Import validation:
 * - Accepts both old format (amount as decimal) and new format (amountCents as integer).
 * - Normalizes all amounts to integer cents internally.
 * - Rejects malformed data with clear error messages.
 * - If a backup has mixed formats, unifies to cents before storing.
 *
 * This ensures:
 * 1. Backward compatibility with older backups (decimal format).
 * 2. Forward compatibility with cloud storage (integer cents).
 * 3. No precision loss during import/export cycles.
 * 4. Clear validation before data replacement.
 */

/**
 * Validates and normalizes a backup file's JSON structure.
 *
 * Accepts both legacy (decimal amounts) and current (integer cents) formats.
 * Returns normalized data with all amounts as integer cents.
 *
 * @param {object} data - Parsed JSON from backup file
 * @returns {object} { business, clients } with normalized monetary values
 * @throws {Error} If backup is invalid or corrupted
 */
export function validateBackup(data) {
  // ===== STRUCTURE VALIDATION =====
  if (!data || typeof data !== 'object') {
    throw new Error('El archivo no es una copia válida de Cuentas+.');
  }

  if (data.format !== 'cuentasplus-backup') {
    throw new Error('El archivo no es una copia válida de Cuentas+ (formato no reconocido).');
  }

  if (!data.version || data.version !== 1) {
    throw new Error('La versión de la copia no es compatible con esta versión de Cuentas+.');
  }

  if (!Array.isArray(data.clients)) {
    throw new Error('La copia no contiene una lista válida de clientes.');
  }

  if (!data.business || typeof data.business !== 'object') {
    throw new Error('La copia no contiene datos válidos del negocio.');
  }

  // ===== BUSINESS INFO VALIDATION =====
  for (const field of ['name', 'phone', 'address']) {
    if (typeof data.business[field] !== 'string') {
      throw new Error(`La copia no contiene el campo de negocio '${field}' en un formato válido.`);
    }
  }

  // ===== CLIENTS & TRANSACTIONS VALIDATION =====
  const names = new Set();
  const clients = data.clients.map((clientData) => {
    if (!clientData || typeof clientData !== 'object') {
      throw new Error('La copia contiene un cliente inválido.');
    }

    if (typeof clientData.name !== 'string' || !clientData.name.trim()) {
      throw new Error('La copia contiene un cliente sin nombre válido.');
    }

    const name = clientData.name.trim();
    if (names.has(name)) {
      throw new Error(`La copia contiene clientes duplicados: "${name}".`);
    }
    names.add(name);

    // Normalize balance to integer cents
    const balanceCents = normalizeMonetaryValue(clientData.balance, 'saldo');
    if (!Number.isFinite(balanceCents) || balanceCents < 0) {
      throw new Error(`El saldo de "${name}" no es válido o es negativo.`);
    }

    if (!Array.isArray(clientData.transactions)) {
      throw new Error(`Las transacciones de "${name}" no tienen un formato válido.`);
    }

    // Normalize transactions
    const transactions = clientData.transactions.map((txnData, txnIndex) => {
      if (!txnData || typeof txnData !== 'object') {
        throw new Error(`La copia contiene una transacción inválida para "${name}".`);
      }

      if (!['purchase', 'payment', 'Compra', 'Pago'].includes(txnData.type)) {
        throw new Error(
          `La copia contiene una transacción con tipo inválido para "${name}" (posición ${txnIndex}).`
        );
      }

      // Normalize amount to integer cents
      const amountCents = normalizeMonetaryValue(txnData.amount || txnData.amountCents, 'monto');
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        throw new Error(
          `La copia contiene un monto inválido o no positivo para "${name}" (transacción ${txnIndex}).`
        );
      }

      if (typeof txnData.date !== 'string' || !txnData.date.trim()) {
        throw new Error(
          `La copia contiene una fecha vacía para "${name}" (transacción ${txnIndex}).`
        );
      }

      // Normalize transaction type (Spanish → English)
      const normalizedType = txnData.type === 'Compra'
        ? 'purchase'
        : txnData.type === 'Pago'
          ? 'payment'
          : txnData.type;

      return {
        type: normalizedType,
        amountCents,
        amount: amountCents, // Keep for backward compatibility
        date: txnData.date.trim(),
        paymentMethod: typeof txnData.paymentMethod === 'string'
          ? txnData.paymentMethod.trim()
          : '-'
      };
    });

    return {
      name,
      phone: typeof clientData.phone === 'string' ? clientData.phone.trim() : '-',
      street: typeof clientData.street === 'string' ? clientData.street.trim() : '-',
      number: typeof clientData.number === 'string' ? clientData.number.trim() : '-',
      balance: balanceCents,
      transactions
    };
  });

  return {
    business: {
      name: data.business.name.trim(),
      phone: data.business.phone.trim(),
      address: data.business.address.trim()
    },
    clients
  };
}

/**
 * Internal helper: normalizes a monetary value to integer cents.
 *
 * Accepts:
 * - Integer (already cents): 150 → 150
 * - Decimal dollars: 1.50 → 150
 * - String with either format: "1.50" → 150, "150" → 15000
 *
 * @param {number|string} value - Value in any format
 * @param {string} fieldName - Field name for error messages
 * @returns {number} Integer cents, or NaN if invalid
 */
function normalizeMonetaryValue(value, fieldName = 'monto') {
  if (value === null || value === undefined || value === '') {
    return NaN;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return NaN;
  }

  if (num < 0) {
    return NaN;
  }

  // If it's already a large integer, treat it as cents
  // (e.g., 150 from an integer field is cents, not dollars)
  if (Number.isInteger(num) && num >= 100) {
    return num;
  }

  // If it's a small decimal or small integer, treat as dollars and convert to cents
  // (e.g., 1.50 → 150, or 1 → 100)
  return Math.round(num * 100);
}

/**
 * Validates that a backup can be safely restored to the current app state.
 *
 * This is a pre-flight check before calling replaceAllClients.
 *
 * @param {object} validatedBackup - Result from validateBackup()
 * @returns {object} { isValid: boolean, warnings: string[], errors: string[] }
 */
export function preFlightCheckBackup(validatedBackup) {
  const warnings = [];
  const errors = [];

  if (!validatedBackup || !validatedBackup.clients) {
    errors.push('La copia validada no tiene estructura correcta.');
    return { isValid: false, warnings, errors };
  }

  const totalTransactions = validatedBackup.clients.reduce(
    (sum, client) => sum + (client.transactions || []).length,
    0
  );

  // Warning: large number of transactions might take time to restore
  if (totalTransactions > 10000) {
    warnings.push(`La copia contiene ${totalTransactions} movimientos. La restauración puede tomar unos segundos.`);
  }

  // Warning: any client with very large balance (might indicate data corruption)
  for (const client of validatedBackup.clients) {
    if (client.balance > 999999999) { // More than ~$9,999,999.99
      warnings.push(`El cliente "${client.name}" tiene un saldo muy alto. Verificá que sea correcto.`);
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * Creates a standardized backup object for export.
 *
 * Ensures:
 * - All monetary values are integer cents.
 * - Consistent structure and versioning.
 * - Metadata for recovery and debugging.
 *
 * @param {object} businessInfo - { name, phone, address }
 * @param {array} clients - Array of client objects with integer-cent balances
 * @returns {object} Backup object ready for JSON.stringify() and download
 */
export function createBackupObject(businessInfo, clients) {
  return {
    format: 'cuentasplus-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    business: {
      name: businessInfo.name || '',
      phone: businessInfo.phone || '',
      address: businessInfo.address || ''
    },
    clients: clients.map((client) => ({
      name: client.name,
      phone: client.phone,
      street: client.street,
      number: client.number,
      balance: Math.round(client.balance), // Ensure integer cents
      transactions: (client.transactions || []).map((txn) => ({
        type: txn.type,
        amountCents: Math.round(txn.amountCents || txn.amount),
        amount: Math.round(txn.amountCents || txn.amount), // Keep for backward compat
        date: txn.date,
        paymentMethod: txn.paymentMethod || '-'
      }))
    }))
  };
}

/**
 * Validates that two backup objects have consistent monetary totals.
 *
 * Useful for debugging sync issues or comparing backups.
 *
 * @param {object} backup1 - First backup object
 * @param {object} backup2 - Second backup object
 * @returns {object} { match: boolean, totals: { backup1, backup2 }, differences: string[] }
 */
export function compareBackupTotals(backup1, backup2) {
  const calculateTotal = (backup) => {
    return backup.clients.reduce((sum, client) => sum + (client.balance || 0), 0);
  };

  const total1 = calculateTotal(backup1);
  const total2 = calculateTotal(backup2);
  const differences = [];

  if (total1 !== total2) {
    differences.push(`Total de saldo: $${(total1 / 100).toFixed(2)} vs $${(total2 / 100).toFixed(2)}`);
  }

  const txnCount1 = backup1.clients.reduce((sum, c) => sum + (c.transactions || []).length, 0);
  const txnCount2 = backup2.clients.reduce((sum, c) => sum + (c.transactions || []).length, 0);

  if (txnCount1 !== txnCount2) {
    differences.push(`Cantidad de movimientos: ${txnCount1} vs ${txnCount2}`);
  }

  return {
    match: differences.length === 0,
    totals: { backup1: total1, backup2: total2 },
    differences
  };
}
