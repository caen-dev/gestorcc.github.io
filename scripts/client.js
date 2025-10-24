import { clients } from './state.js';
import { saveClient, deleteClientByName } from './db.js';
import { updateClientSelect, updateClientDebtList } from './ui.js';
import { updateStats } from './dashboard.js';
import { isEmpty } from './utils.js';

export function initClients() {
  // Alta de cliente
  $('#client-form').on('submit', function (e) {
    e.preventDefault();
    const name = $('#client-name').val().trim();
    const phone = $('#client-phone').val().trim() || '-';
    const street = $('#client-street').val().trim() || '-';
    const number = $('#client-number').val().trim() || '-';

    if (!name) return uiAlerts.error('Campo obligatorio', 'El nombre no puede estar vacío.');
    if (clients[name]) return uiAlerts.warning('Cliente duplicado', 'Ya existe un cliente con ese nombre.');

    const newClient = { name, phone, street, number, balance: 0, transactions: [] };
    clients[name] = newClient;
    saveClient(newClient);

    updateClientSelect();
    $('#client-form').trigger('reset');
    updateClientDebtList();
    updateStats();
    uiAlerts.toast('Cliente agregado correctamente ✅');
  });

  // Filtro de select
  $('#client-filter').on('input', (e) => updateClientSelect(e.target.value));

  // Editar cliente
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

    $('html, body').animate({ scrollTop: $('#client-form').offset().top - 80 }, 500);

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
        return uiAlerts.warning('Cliente duplicado', 'Ya existe otro cliente con ese nombre.');

      const updated = {
        name, phone, street, number,
        balance: c.balance,
        transactions: c.transactions
      };

      if (name !== originalName) deleteClientByName(originalName);

      clients[name] = updated;
      saveClient(updated);

      $('#client-form').trigger('reset');
      $btn.text('Agregar Cliente').off('click');
      updateClientSelect();
      updateClientDebtList();
      updateStats();
      uiAlerts.toast('Cliente actualizado correctamente ✏️');
    });
  });
}
