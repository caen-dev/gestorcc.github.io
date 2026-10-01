'use strict';

/**
 * MIGRATION.JS — Phase 1: UUID Normalization
 *
 * This module provides idempotent normalization functions to upgrade
 * legacy Cuentas+ data to include:
 * - UUID identifiers (client.id, transaction.id)
 * - Global business ID (client.businessId, transaction.businessId)
 * - Timestamp tracking (createdAt, updatedAt)
 * - Transaction relationships (transaction.clientId)
 * - Date field migration (date → occurredAt)
 *
 * RULES:
 * 1. All functions are idempotent: running twice produces the same result.
 * 2. UUID generation happens once; existing UUIDs are preserved.
 * 3. businessId is global per installation (stored in localStorage).
 * 4. createdAt on legacy data is the migration timestamp.
 * 5. updatedAt is only set/updated on write operations.
 * 6. No fields are deleted; only new fields are added.
 */

/**
 * Generates a UUID v4 using the Web Crypto API.
 * @returns {string} UUID v4 string
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Gets or creates a unique business ID for this installation.
 * Stored in localStorage to ensure consistency across sessions.
 *
 * @returns {string} UUID of the business
 */
export function getOrCreateBusinessId() {
  const BUSINESS_ID_KEY = 'cuentasplus:businessId';
  let businessId = localStorage.getItem(BUSINESS_ID_KEY);

  if (!businessId) {
    businessId = generateUUID();
    localStorage.setItem(BUSINESS_ID_KEY, businessId);
  }

  return businessId;
}

/**
 * Checks if a client object needs normalization (legacy data).
 *
 * @param {object} client - Client object to check
 * @returns {boolean} True if client is missing any required UUID/timestamp fields
 */
export function detectLegacyClient(client) {
  if (!client) return false;
  return !client.id || !client.businessId || !client.createdAt || !client.updatedAt;
}

/**
 * Normalizes a client object by adding UUID and timestamp fields.
 *
 * IDEMPOTENT: calling multiple times produces the same result.
 * - If client.id exists, it is preserved.
 * - If client.id is missing, a new UUID is generated.
 * - businessId is always the installation's global businessId.
 * - createdAt on legacy clients is set to migration timestamp.
 * - updatedAt is NOT modified by this function (only on write).
 *
 * @param {object} client - Client object from IndexedDB
 * @param {string} migrationTimestamp - ISO 8601 timestamp (default: now)
 * @returns {object} Normalized client object
 */
export function ensureClientUUIDs(client, migrationTimestamp = new Date().toISOString()) {
  if (!client) return client;

  const normalized = { ...client };

  // Generate UUID if missing (idempotent: existing UUIDs are preserved)
  if (!normalized.id) {
    normalized.id = generateUUID();
  }

  // Set businessId to global business ID
  normalized.businessId = getOrCreateBusinessId();

  // Set createdAt to migration timestamp if missing (legacy data)
  if (!normalized.createdAt) {
    normalized.createdAt = migrationTimestamp;
  }

  // Set updatedAt to migration timestamp if missing (legacy data)
  // Note: updatedAt should only change on write operations, not on normalization reads
  if (!normalized.updatedAt) {
    normalized.updatedAt = migrationTimestamp;
  }

  // Normalize transactions within the client
  if (Array.isArray(normalized.transactions)) {
    normalized.transactions = normalized.transactions.map((txn) =>
      ensureTransactionUUIDs(txn, normalized.id, migrationTimestamp)
    );
  } else {
    normalized.transactions = [];
  }

  return normalized;
}

/**
 * Normalizes a transaction object by adding UUID, relationships, and timestamp fields.
 *
 * IDEMPOTENT: calling multiple times produces the same result.
 * - If transaction.id exists, it is preserved.
 * - If transaction.id is missing, a new UUID is generated.
 * - clientId is always set to the provided clientId.
 * - businessId is always the installation's global businessId.
 * - date is migrated to occurredAt if occurredAt is missing.
 * - createdAt on legacy transactions is set to migration timestamp.
 * - updatedAt is NOT modified by this function (only on write).
 *
 * @param {object} transaction - Transaction object
 * @param {string} clientId - UUID of the client this transaction belongs to
 * @param {string} migrationTimestamp - ISO 8601 timestamp (default: now)
 * @returns {object} Normalized transaction object
 */
export function ensureTransactionUUIDs(
  transaction,
  clientId,
  migrationTimestamp = new Date().toISOString()
) {
  if (!transaction) return transaction;

  const normalized = { ...transaction };

  // Generate UUID if missing (idempotent: existing UUIDs are preserved)
  if (!normalized.id) {
    normalized.id = generateUUID();
  }

  // Set clientId to the provided client UUID
  normalized.clientId = clientId;

  // Set businessId to global business ID
  normalized.businessId = getOrCreateBusinessId();

  // Migrate date → occurredAt if occurredAt is missing
  if (!normalized.occurredAt && normalized.date) {
    normalized.occurredAt = normalized.date;
  }

  // Set createdAt to migration timestamp if missing (legacy data)
  if (!normalized.createdAt) {
    normalized.createdAt = migrationTimestamp;
  }

  // Set updatedAt to migration timestamp if missing (legacy data)
  // Note: updatedAt should only change on write operations, not on normalization reads
  if (!normalized.updatedAt) {
    normalized.updatedAt = migrationTimestamp;
  }

  return normalized;
}

/**
 * Helper to check if a client or any of its transactions need normalization.
 *
 * @param {object} client - Client object with transactions
 * @returns {boolean} True if client or any transaction is legacy
 */
export function clientNeedsNormalization(client) {
  if (!client) return false;
  if (detectLegacyClient(client)) return true;
  if (Array.isArray(client.transactions)) {
    return client.transactions.some((txn) => !txn.id || !txn.clientId);
  }
  return false;
}
