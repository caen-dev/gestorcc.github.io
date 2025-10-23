$(document).ready(function () {
  let db;
  const dbName = 'clientsDB';
  const storeName = 'clientsStore';
  let clients = {};

  // === MODO OSCURO (switch con checkbox) ===
  const DARK_KEY = 'gestorcc:darkmode';
  const toggleSwitch = document.getElementById('toggle-dark-mode');
  if (toggleSwitch) {
    const isDark = localStorage.getItem(DARK_KEY) === '1';
    if (isDark) {
      document.body.classList.add('dark-mode');
      toggleSwitch.checked = true;
    }
    toggleSwitch.addEventListener('change', function () {
      document.body.classList.toggle('dark-mode');
      const enabled = document.body.classList.contains('dark-mode');
      localStorage.setItem(DARK_KEY, enabled ? '1' : '0');
    });
  }

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
  $('#client-form').on('submit', function (e) {
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

  /* === Registrar Transacción === */
  $('#account-form').on('submit', function (e) {
    e.preventDefault();
    const clientName = $('#select-client').val();
    const type = $('#transaction-type').val(); // 'purchase' | 'payment'
    const amount = parseFloat($('#amount').val());
    const method = $('#payment-method').val();

    if (!clientName) return uiAlerts.warning('Seleccione un cliente', 'Debes elegir un cliente.');
    if (!amount || isNaN(amount) || amount <= 0) return uiAlerts.error('Monto inválido', 'Ingrese un monto válido.');

    handleTransaction(clientName, type, amount, method);
    $('#account-form').trigger('reset');
  });

  function handleTransaction(clientName, type, amount, paymentMethod) {
    const c = clients[clientName];
    const date = new Date().toLocaleDateString();
    if (!c) return uiAlerts.error('Error', 'El cliente no existe.');

    if (type === 'purchase') {
      c.transactions.push({ type: 'Compra', amount, date, paymentMethod });
      c.balance += amount;
    } else if (type === 'payment') {
      if (c.balance < amount) {
        return uiAlerts.warning('Monto excedido',
          `El monto ingresado supera la deuda actual ($${c.balance.toLocaleString('es-AR')}).`);
      }
      c.transactions.push({ type: 'Pago', amount, date, paymentMethod });
      c.balance -= amount;
      if (c.balance < 0) c.balance = 0;
    } else {
      return uiAlerts.error('Tipo inválido', 'Tipo de transacción desconocido.');
    }

    saveClient(c);
    updateClientDebtList();
    uiAlerts.toast('Transacción registrada ✅');
  }

  /* === Select de clientes (con filtro) === */
  function updateClientSelect(filter = '') {
    const $select = $('#select-client').empty();
    Object.keys(clients).sort().forEach(name => {
      if (name.toLowerCase().includes(filter.toLowerCase())) {
        $select.append(new Option(name, name));
      }
    });
  }
  $('#client-filter').on('input', e => updateClientSelect(e.target.value));

  /* === Render de tabla de deudas === */
  function updateClientDebtList() {
    const $tbody = $('#debt-list tbody').empty();

    Object.keys(clients).forEach(name => {
      const c = clients[name];
      if (!c) return;

      // Mostrar solo clientes con movimientos y saldo (resumen de deudas)
      if (c.transactions.length === 0 || c.balance <= 0) return;

      const recent = c.transactions.slice(-5).map(t =>
        `${t.date} - ${t.type}: $${t.amount.toLocaleString('es-AR')} (${t.paymentMethod})`
      ).join('<br>') + (c.transactions.length > 5 ? '<br><a href="#" class="view-more">Ver más</a>' : '');

      // Botones en primera columna (sin añadir columna "Acciones")
      const $btns = $('<div>').addClass('btn-container mt-2').append(
        $('<button>')
          .addClass('btn btn-info btn-sm toggle-info')
          .attr('title', 'Ver información')
          .html('<i class="fas fa-info-circle"></i>')
          .data('client', name),
        $('<button>')
          .addClass('btn btn-warning btn-sm edit-client')
          .attr('title', 'Editar cliente')
          .html('<i class="fas fa-edit"></i>')
          .data('client', name)
      );

      const $row = $('<tr>').append(
        $('<td>').html(`<strong>${name}</strong>`).append($btns),
        $('<td>').html(recent),
        $('<td>').text(`$${c.balance.toLocaleString('es-AR')}`)
      );

      const $infoRow = $('<tr>')
        .addClass('personal-info-row')
        .hide()
        .append(
          $('<td colspan="3">').html(`
            <strong>Teléfono:</strong> ${c.phone}<br>
            <strong>Domicilio:</strong> ${c.street} ${c.number}
          `)
        );

      $tbody.append($row, $infoRow);
    });
  }

  /* === Delegados de eventos de tabla === */
  $(document).on('click', '.view-more', function (e) {
    e.preventDefault();
    const clientName = $(this).closest('tr').find('.edit-client').data('client');
    const c = clients[clientName];
    if (!c) return;

    const all = c.transactions.map(t =>
      `${t.date} - ${t.type}: $${t.amount.toLocaleString('es-AR')} (${t.paymentMethod})`
    ).join('<br>');
    $(this).closest('td').html(all);
  });

  $(document).on('click', '.toggle-info', function () {
    $(this).closest('tr').next('.personal-info-row').slideToggle();
  });

  // === Editar Cliente con auto-scroll (manteniendo tu lógica) ===
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

  /* === Filtro de tabla de deudas === */
  $('#debt-search').on('input', function () {
    const txt = $(this).val().toLowerCase();
    const $rows = $('#debt-list tbody tr');

    $rows.each(function () {
      const $tr = $(this);
      if ($tr.hasClass('personal-info-row')) return; // se controla junto a su anterior

      const visible = $tr.text().toLowerCase().indexOf(txt) > -1;
      $tr.toggle(visible);
      const $info = $tr.next('.personal-info-row');
      if ($info.length) $info.toggle(visible && $tr.is(':visible'));
    });
  });
});
