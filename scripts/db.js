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
    request.onsuccess = (e) => { db = e.target.result; resolve(db); };
    request.onerror = () => reject(new Error('No se pudo abrir la base de datos local.'));
  });
}

export function saveClient(client) {
  db.transaction(STORE, 'readwrite').objectStore(STORE).put(client);
}

export function deleteClientByName(name) {
  db.transaction(STORE, 'readwrite').objectStore(STORE).delete(name);
}

export function loadAllClients() {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const getAll = store.getAll();
    getAll.onsuccess = () => resolve(getAll.result || []);
  });
}
