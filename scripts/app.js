$(document).ready(function () {
  let db;
  const dbName = 'clientsDB';
  const storeName = 'clientsStore';
  let clients = {};

  // === MODO OSCURO (nuevo switch profesional) ===
  const DARK_KEY = 'gestorcc:darkmode';
  const isDark = localStorage.getItem(DARK_KEY) === '1';
  const toggleSwitch = document.getElementById('toggle-dark-mode');

  if (isDark) {
    document.body.classList.add('dark-mode');
    toggleSwitch.checked = true;
  }

  toggleSwitch.addEventListener('change', function () {
    document.body.classList.toggle('dark-mode');
    const enabled = document.body.classList.contains('dark-mode');
    localStorage.setItem(DARK_KEY, enabled ? '1' : '0');
  });


  /* === IndexedDB === */
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: 'name' });
    }
  };
  request.onsuccess = e => { db = e.target.result; loadClients(); };
  request.onerror = () => uiAlerts.error('Error', 'No se pudo abrir la base de datos.');

  function loadClients() {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const getAll = store.getAll();
    getAll.onsuccess = () => {
      clients = {};
      getAll.result.forEach(c => clients[c.name] = c);
      updateClientSelect();
      updateClientDebtList();
    };
  }

  function saveClient(client) {
    db.transaction(storeName, 'readwrite').objectStore(storeName).put(client);
  }

  /* === Agregar Cliente === */
  $('#client-form').submit(function (e) {
    e.preventDefault();
    const name = $('#client-name').val().trim();
    const phone = $('#client-phone').val().trim() || '-';
    const street = $('#client-street').val().trim() || '-';
    const number = $('#client-number').val().trim() || '-';
    if (!name) return uiAlerts.error('Campo obligatorio', 'El nombre no puede estar vacío.');
    if (clients[name]) return uiAlerts.warning('Duplicado', 'El cliente ya existe.');

    const newClient = { name, phone, street, number, balance: 0, transactions: [] };
    clients[name] = newClient;
    saveClient(newClient);
    updateClientSelect();
    $('#client-form').trigger('reset');
    uiAlerts.toast('Cliente agregado correctamente ✅');
  });

  /* === Select de clientes === */
  function updateClientSelect(filter = '') {
    const $select = $('#select-client').empty();
    Object.keys(clients).sort().forEach(name => {
      if (name.toLowerCase().includes(filter.toLowerCase()))
        $select.append(new Option(name, name));
    });
  }
  $('#client-filter').on('input', e => updateClientSelect(e.target.value));

  /* === Editar Cliente con auto-scroll === */
  $(document).on('click', '.edit-client', function () {
    const originalName = $(this).data('client');
    const c = clients[originalName];
    if (!c) return;

    $('#client-name').val(c.name);
    $('#client-phone').val(c.phone === '-' ? '' : c.phone);
    $('#client-street').val(c.street === '-' ? '' : c.street);
    $('#client-number').val(c.number === '-' ? '' : c.number);
    delete clients[originalName];
    updateClientSelect();

    $('html, body').animate({ scrollTop: $('#client-form').offset().top - 80 }, 600);

    const $btn = $('#client-form button[type="submit"]');
    $btn.text('Actualizar Cliente');

    $btn.off('click').on('click', function (e) {
      e.preventDefault();
      const name = $('#client-name').val().trim();
      const phone = $('#client-phone').val().trim() || '-';
      const street = $('#client-street').val().trim() || '-';
      const number = $('#client-number').val().trim() || '-';
      if (!name) return uiAlerts.error('Campo obligatorio', 'El nombre no puede estar vacío.');
      if (clients[name] && name !== originalName)
        return uiAlerts.warning('Duplicado', 'Ya existe otro cliente con ese nombre.');

      const updated = { name, phone, street, number, balance: c.balance, transactions: c.transactions };
      clients[name] = updated;
      saveClient(updated);

      $('#client-form').trigger('reset');
      $btn.text('Agregar Cliente').off('click');
      updateClientSelect();
      updateClientDebtList();
      uiAlerts.toast('Cliente actualizado correctamente ✏️');
    });
  });
});
