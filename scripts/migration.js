'use strict';

/**
 * MIGRATION.JS — Phase 1: UUID Normalization
 *
 * Normaliza datos legacy agregando:
 * - client.id
 * - client.businessId
 * - client.createdAt
 * - client.updatedAt
 * - transaction.id
 * - transaction.clientId
 * - transaction.businessId
 * - transaction.createdAt
 * - transaction.updatedAt
 * - transaction.occurredAt
 *
 * Las funciones son idempotentes:
 * ejecutar la normalización varias veces no reemplaza
 * identificadores ni timestamps ya existentes.
 */

const BUSINESS_ID_KEY = 'cuentasplus:businessId';

let fallbackBusinessId = null;

/**
 * Genera un UUID v4.
 */
export function generateUUID() {
  return globalThis.crypto.randomUUID();
}

/**
 * Devuelve localStorage cuando existe y es accesible.
 *
 * En navegador:
 *   usa el localStorage real.
 *
 * En Node/tests:
 *   devuelve null y se utiliza un almacenamiento en memoria.
 */
function getBusinessIdStorage() {
  try {
    const storage = globalThis.localStorage;

    if (
      storage &&
      typeof storage.getItem === 'function' &&
      typeof storage.setItem === 'function'
    ) {
      return storage;
    }
  } catch {
    // Entorno sin localStorage disponible.
  }

  return null;
}

/**
 * Obtiene o crea el businessId global de esta instalación.
 */
export function getOrCreateBusinessId() {
  const storage = getBusinessIdStorage();

  if (storage) {
    let businessId = storage.getItem(BUSINESS_ID_KEY);

    if (!businessId) {
      businessId = generateUUID();
      storage.setItem(BUSINESS_ID_KEY, businessId);
    }

    return businessId;
  }

  // Fallback para Node/tests.
  if (!fallbackBusinessId) {
    fallbackBusinessId = generateUUID();
  }

  return fallbackBusinessId;
}

/**
 * Determina si un cliente necesita normalización.
 */
export function detectLegacyClient(client) {
  if (!client) return false;

  return (
    !client.id ||
    !client.businessId ||
    !client.createdAt ||
    !client.updatedAt
  );
}

/**
 * Normaliza un cliente.
 */
export function ensureClientUUIDs(
  client,
  migrationTimestamp = new Date().toISOString()
) {
  if (!client) return client;

  const normalized = { ...client };

  if (!normalized.id) {
    normalized.id = generateUUID();
  }

  normalized.businessId = getOrCreateBusinessId();

  if (!normalized.createdAt) {
    normalized.createdAt = migrationTimestamp;
  }

  if (!normalized.updatedAt) {
    normalized.updatedAt = migrationTimestamp;
  }

  if (Array.isArray(normalized.transactions)) {
    normalized.transactions = normalized.transactions.map((transaction) =>
      ensureTransactionUUIDs(
        transaction,
        normalized.id,
        migrationTimestamp
      )
    );
  } else {
    normalized.transactions = [];
  }

  return normalized;
}

/**
 * Normaliza una transacción.
 */
export function ensureTransactionUUIDs(
  transaction,
  clientId,
  migrationTimestamp = new Date().toISOString()
) {
  if (!transaction) return transaction;

  const normalized = { ...transaction };

  if (!normalized.id) {
    normalized.id = generateUUID();
  }

  normalized.clientId = clientId;
  normalized.businessId = getOrCreateBusinessId();

  if (!normalized.occurredAt && normalized.date) {
    normalized.occurredAt = normalized.date;
  }

  if (!normalized.createdAt) {
    normalized.createdAt = migrationTimestamp;
  }

  if (!normalized.updatedAt) {
    normalized.updatedAt = migrationTimestamp;
  }

  return normalized;
}

/**
 * Determina si el cliente o alguna de sus transacciones
 * necesita normalización.
 */
export function clientNeedsNormalization(client) {
  if (!client) return false;

  if (detectLegacyClient(client)) {
    return true;
  }

  if (Array.isArray(client.transactions)) {
    return client.transactions.some(
      (transaction) =>
        !transaction.id ||
        !transaction.clientId ||
        !transaction.businessId ||
        !transaction.createdAt ||
        !transaction.updatedAt ||
        (!transaction.occurredAt && transaction.date)
    );
  }

  return false;
}