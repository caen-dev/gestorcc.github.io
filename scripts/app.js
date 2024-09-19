$(document).ready(function() {
    let db;
    const dbName = 'clientsDB';
    const storeName = 'clientsStore';
    let clients = {};

    // Abrir IndexedDB
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'name' });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadClients();
    };

    function loadClients() {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getAll = store.getAll();

        getAll.onsuccess = function() {
            clients = {};
            getAll.result.forEach(client => {
                clients[client.name] = client;
            });
            updateClientSelect();
            updateClientDebtList();
        };
    }

    // Agregar cliente
    $('#client-form').submit(function(e) {
        e.preventDefault();
        const name = $('#client-name').val().trim();
        const phone = $('#client-phone').val().trim() || '-';
        const street = $('#client-street').val().trim() || '-';
        const number = $('#client-number').val().trim() || '-';

        if (!name) {
            alert('El nombre del cliente es obligatorio.');
            return;
        }

        if (!clients[name]) {
            const newClient = {
                name: name,
                phone: phone,
                street: street,
                number: number,
                balance: 0,
                transactions: []
            };
            clients[name] = newClient;
            saveClient(newClient);
            updateClientSelect();
            $('#client-form').trigger("reset");
            alert('Cliente agregado con éxito.');
        } else {
            alert('El cliente ya existe.');
        }
    });

    function saveClient(client) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(client);
    }

    // Actualizar select de clientes
    function updateClientSelect(filter = '') {
        const $selectClient = $('#select-client');
        $selectClient.empty();

        Object.keys(clients).sort().forEach(function(client) {
            if (client.toLowerCase().includes(filter.toLowerCase())) {
                $selectClient.append(new Option(client, client));
            }
        });
    }

    // Filtrar clientes en dropdown
    $('#client-filter').on('input', function() {
        const filterText = $(this).val();
        updateClientSelect(filterText);
    });

    // Registrar transacción
    $('#account-form').submit(function(e) {
        e.preventDefault();
        const clientName = $('#select-client').val();
        const transactionType = $('#transaction-type').val();
        const amount = parseFloat($('#amount').val());
        const paymentMethod = $('#payment-method').val();

        if (!clientName) {
            alert('Seleccione un cliente.');
            return;
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            alert('Ingrese un monto válido.');
            return;
        }

        handleTransaction(clientName, transactionType, amount, paymentMethod);
        $('#account-form').trigger("reset");
    });

    // Manejar transacciones
    function handleTransaction(clientName, type, amount, paymentMethod) {
        const client = clients[clientName];
        const date = new Date().toLocaleDateString();

        if (!client) {
            alert('El cliente no existe.');
            return;
        }

        if (type === 'purchase') {
            client.transactions.push({ type: 'Compra', amount: amount, date: date, paymentMethod: paymentMethod });
            client.balance += amount;
        } else if (type === 'payment') {
            if (client.balance < amount) {
                alert(`El monto ingresado excede la deuda actual. La deuda actual es $${client.balance.toLocaleString('es-AR')}.`);
                return;
            }
            client.balance -= amount;
            if (client.balance < 0) client.balance = 0;
            client.transactions.push({ type: 'Pago', amount: amount, date: date, paymentMethod: paymentMethod });
        }

        saveClient(client);  // Guardar cliente actualizado en IndexedDB
        updateClientDebtList();
    }

    // Actualizar lista de deudas
    function updateClientDebtList() {
        const $debtList = $('#debt-list tbody');
        $debtList.empty();

        Object.keys(clients).forEach(function(client) {
            const data = clients[client];
            if (data.transactions.length > 0 && data.balance > 0) {
                const recentTransactions = data.transactions.slice(-5); // Últimas 5 transacciones
                const transactionDetails = recentTransactions.map(t => 
                    `${t.date} - ${t.type}: $${t.amount.toLocaleString('es-AR')} (${t.paymentMethod})`
                ).join('<br>') + (data.transactions.length > 5 ? '<br><a href="#" class="view-more">Ver más</a>' : '');

                const $toggleButton = $('<button>')
                    .html('<i class="fas fa-info-circle"></i>')
                    .addClass('btn btn-info btn-sm toggle-info')
                    .data('client', client);

                const $editButton = $('<button>')
                    .html('<i class="fas fa-edit"></i>')
                    .addClass('btn btn-warning btn-sm edit-client')
                    .data('client', client);

                const $personalInfoRow = $('<tr>')
                    .addClass('personal-info-row')
                    .css('display', 'none') // Ocultar por defecto
                    .append($('<td colspan="3">').html(` 
                        Teléfono: ${data.phone}<br>
                        Domicilio: ${data.street} ${data.number}
                    `));

                const $clientRow = $('<tr>').append(
                    $('<td>').text(client).append(
                        $('<div>').addClass('btn-container').append($toggleButton).append($editButton)
                    ),
                    $('<td>').html(transactionDetails),
                    $('<td>').text(`$${data.balance.toLocaleString('es-AR')}`)
                );

                $debtList.append($clientRow).append($personalInfoRow);
            }
        });

        // Mostrar más transacciones
        $(document).on('click', '.view-more', function(e) {
            e.preventDefault();
            const clientName = $(this).closest('tr').find('.edit-client').data('client');
            const client = clients[clientName];
            const allTransactions = client.transactions.map(t => 
                `${t.date} - ${t.type}: $${t.amount.toLocaleString('es-AR')} (${t.paymentMethod})`
            ).join('<br>');
            $(this).closest('td').html(allTransactions);
        });

        // Alternar fila de información personal al hacer clic en el botón
        $('.toggle-info').on('click', function() {
            const $button = $(this);
            const client = $button.data('client');
            const $infoRow = $button.closest('tr').next('.personal-info-row');

            $infoRow.slideToggle();  // Deslizar la fila con información personal
        });

        // Editar información del cliente
        $('.edit-client').on('click', function() {
            const clientName = $(this).data('client');
            const client = clients[clientName];

            $('#client-name').val(client.name);
            $('#client-phone').val(client.phone === '-' ? '' : client.phone);
            $('#client-street').val(client.street === '-' ? '' : client.street);
            $('#client-number').val(client.number === '-' ? '' : client.number);

            // Reemplazar la información del cliente después de editar
            delete clients[clientName];
            updateClientSelect();

            // Cambiar el botón de guardar a un botón de actualización
            $('#client-form button[type="submit"]').text('Actualizar Cliente').off('click').on('click', function(e) {
                e.preventDefault();
                const name = $('#client-name').val().trim();
                const phone = $('#client-phone').val().trim() || '-';
                const street = $('#client-street').val().trim() || '-';
                const number = $('#client-number').val().trim() || '-';

                if (!name) {
                    alert('El nombre del cliente es obligatorio.');
                    return;
                }

                if (clients[name] && name !== clientName) {
                    alert('El cliente ya existe.');
                    return;
                }

                const updatedClient = {
                    name: name,
                    phone: phone,
                    street: street,
                    number: number,
                    balance: client.balance,
                    transactions: client.transactions
                };
                clients[name] = updatedClient;
                saveClient(updatedClient);

                $('#client-form').trigger("reset");
                $('#client-form button[type="submit"]').text('Agregar Cliente');
                updateClientSelect();
                updateClientDebtList();
                alert('Cliente actualizado con éxito.');
            });
        });
    }

    // Filtrar tabla de deudas
    $('#debt-search').on('input', function() {
        const searchText = $(this).val().toLowerCase();
        $('#debt-list tbody tr').each(function() {
            const rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.indexOf(searchText) > -1);
        });
    });
});
