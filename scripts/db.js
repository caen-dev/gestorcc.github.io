'use strict';

/**
 * DB.JS — IndexedDB Layer
 *
 * CONTRACT (Phase 1):
 * - Keep DB version = 1
 * - Keep keyPath = name
 * - Keep clients[name] as the in-memory access pattern
 * - Add UUID + metadata fields to objects without changing schema version
 * - Persist normalization only when needed
 *
 * This is a safe migration layer for legacy data. It does not break the
 * existing app while preparing the schema for the future multi-user/cloud model.
 */

import {
  ensureClientUUIDs,
  ensureTransactionUUIDs,
  clientNeedsNormalization
} from './migration.js';

export let db;
const DB_NAME = 'clientsDB';
const STORE = 'clientsStore';

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'name' });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      db.onversionchange = () => {
        db.close();
        db = undefined;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error('No se pudo abrir la base de datos local.'));
    request.onblocked = () => reject(new Error('No se pudo abrir la base de datos porque otra pestaña la está usando.'));
  });
}

export function saveClient(client, previousName = null) {
  const normalized = ensureClientUUIDs(client, new Date().toISOString());

  return runTransaction('readwrite', (store) => {
    if (previousName && previousName !== normalized.name) store.delete(previousName);
    if (!normalized.transactions) normalized.transactions = [];
    normalized.transactions = normalized.transactions.map((txn) =>
      ensureTransactionUUIDs(txn, normalized.id, new Date().toISOString())
    );
    normalized.updatedAt = new Date().toISOString();
    store.put(normalized);
  });
}

export function deleteClientByName(name) {
  return runTransaction('readwrite', (store) => store.delete(name));
}

export function saveClients(clients) {
  if (!clients.length) return Promise.resolve();

  return runTransaction('readwrite', (store) => {
    clients.forEach((client) => {
      const normalized = ensureClientUUIDs(client, new Date().toISOString());
      normalized.updatedAt = new Date().toISOString();
      normalized.transactions = (normalized.transactions || []).map((txn) =>
        ensureTransactionUUIDs(txn, normalized.id, new Date().toISOString())
      );
      store.put(normalized);
    });
  });
}

export function replaceAllClients(clients) {
  return runTransaction('readwrite', (store) => {
    store.clear();
    clients.forEach((client) => {
      const normalized = ensureClientUUIDs(client, new Date().toISOString());
      normalized.updatedAt = new Date().toISOString();
      normalized.transactions = (normalized.transactions || []).map((txn) =>
        ensureTransactionUUIDs(txn, normalized.id, new Date().toISOString())
      );
      store.put(normalized);
    });
  });
}

export function loadAllClients() {
  let rows = [];
  return runTransaction('readonly', (store) => {
    const request = store.getAll();
    request.onsuccess = () => { rows = request.result || []; };
  }).then(async () => {
    const normalizedRows = rows.map((client) => {
      const migrated = ensureClientUUIDs(client, new Date().toISOString());
      migrated.transactions = (migrated.transactions || []).map((txn) =>
        ensureTransactionUUIDs(txn, migrated.id, new Date().toISOString())
      );
      return migrated;
    });

    const changed = normalizedRows.filter((client, index) => {
      const original = rows[index];
      return JSON.stringify(client) !== JSON.stringify(original);
    });

    if (changed.length) {
      await runTransaction('readwrite', (store) => {
        changed.forEach((client) => store.put(client));
      });
    }

    return normalizedRows;
  });
}

function runTransaction(mode, operation) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('La base de datos local no está inicializada.'));
      return;
    }

    let transaction;
    try {
      transaction = db.transaction(STORE, mode);
      operation(transaction.objectStore(STORE));
    } catch (error) {
      reject(error);
      return;
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error('No se pudo completar la operación en la base de datos local.')
    );
    transaction.onabort = () => reject(
      transaction.error || new Error('La operación en la base de datos local fue cancelada.')
    );
  });
}
