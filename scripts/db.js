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
  return runTransaction('readwrite', (store) => {
    if (previousName && previousName !== client.name) store.delete(previousName);
    store.put(client);
  });
}

export function deleteClientByName(name) {
  return runTransaction('readwrite', (store) => store.delete(name));
}

export function saveClients(clients) {
  if (!clients.length) return Promise.resolve();
  return runTransaction('readwrite', (store) => {
    clients.forEach((client) => store.put(client));
  });
}

export function replaceAllClients(clients) {
  return runTransaction('readwrite', (store) => {
    store.clear();
    clients.forEach((client) => store.put(client));
  });
}

export function loadAllClients() {
  let rows = [];
  return runTransaction('readonly', (store) => {
    const request = store.getAll();
    request.onsuccess = () => { rows = request.result || []; };
  }).then(() => rows);
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
