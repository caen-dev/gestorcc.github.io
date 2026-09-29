'use strict';

import { clients } from './state.js?v=20260928-8';
import { saveClient } from './db.js?v=20260928-8';
import { updateClientSelect, updateClientDebtList } from './ui.js?v=20260928-16';
import { updateStats } from './dashboard.js?v=20260928-15';
import * as uiAlerts from './uiAlerts.js?v=20260928-8';

export function initClients() {
  let editingClientName = null;
  const $form = $('#client-form');
  const $title = $('#client-form-title');
  const $submit = $form.find('button[type="submit"]');
  const $cancel = $('#cancel-client-edit');
  $form[0].reset();
  $title.text('Agregar Cliente');
  $submit.text('Agregar Cliente');
  $cancel.addClass('d-none');

  $form.on('submit', async function (e) {
    e.preventDefault();
    const name = $('#client-name').val().trim();
    const phone = $('#client-phone').val().trim() || '-';
    const street = $('#client-street').val().trim() || '-';
    const number = $('#client-number').val().trim() || '-';
    const existing = editingClientName ? clients[editingClientName] : null;

    if (!name) return uiAlerts.error('Campo obligatorio', 'El nombre no puede estar vacío.');
    if (editingClientName && !existing)
      return uiAlerts.error('No se pudo editar el cliente', 'El cliente ya no está disponible. Volvé a cargar la lista.');
    if (clients[name] && name !== editingClientName)
      return uiAlerts.warning('Cliente duplicado', 'Ya existe un cliente con ese nombre.');

    const client = existing
      ? { ...existing, name, phone, street, number }
      : { name, phone, street, number, balance: 0, transactions: [] };

    const previousName = editingClientName;
    $submit.prop('disabled', true);
    try {
      await saveClient(client, previousName);
    } catch (err) {
      console.error(err);
      return uiAlerts.error('No se pudo guardar el cliente', err?.message || String(err));
    } finally {
      $submit.prop('disabled', false);
    }
    if (previousName && name !== previousName) delete clients[previousName];
    clients[name] = client;

    updateClientSelect();
    $form.trigger('reset');
    editingClientName = null;
    $title.text('Agregar Cliente');
    $submit.text('Agregar Cliente');
    $cancel.addClass('d-none');
    updateClientDebtList();
    updateStats();
    uiAlerts.toast(existing ? 'Cliente actualizado correctamente ✏️' : 'Cliente agregado correctamente ✅');
  });

  $cancel.on('click', () => {
    $form[0].reset();
    editingClientName = null;
    $title.text('Agregar Cliente');
    $submit.text('Agregar Cliente');
    $cancel.addClass('d-none');
    $('#client-name').trigger('focus');
  });

  // Editar cliente
  $(document).on('click', '.edit-client', function () {
    const originalName = $(this).data('client');
    const c = clients[originalName];
    if (!c) return;

    editingClientName = originalName;
    $('#client-name').val(c.name);
    $('#client-phone').val(c.phone === '-' ? '' : c.phone);
    $('#client-street').val(c.street === '-' ? '' : c.street);
    $('#client-number').val(c.number === '-' ? '' : c.number);

    $('html, body').animate({ scrollTop: $('#client-form').offset().top - 80 }, 500);
    $title.text(`Editar cliente: ${c.name}`);
    $submit.text('Actualizar Cliente');
    $cancel.removeClass('d-none');
    $('#client-name').trigger('focus');
  });
}
