import { clients } from './state.js';
import { money, parseLocalDate } from './utils.js';

export function updateClientSelect(filter = '') {
  const $select = $('#select-client').empty();
  $select.append(new Option('Seleccionar cliente…', ''));

  const keys = Object.keys(clients).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) {
    $select.append(new Option('— No hay clientes —', ''));
    $select.val('');
    return;
  }
  keys.forEach((name) => {
    if (name.toLowerCase().includes(String(filter).toLowerCase())) {
      $select.append(new Option(name, name));
    }
  });
  $select.val(''); // no dejar seleccionado el primero
}

export function updateClientDebtList() {
  const $tbody = $('#debt-list tbody').empty();
  const orderedClients = Object.values(clients)
    .filter((c) => (c.transactions || []).length > 0 && (c.balance || 0) > 0)
    .sort((a, b) => {
      const aLast = parseLocalDate(a.transactions[a.transactions.length - 1]?.date);
      const bLast = parseLocalDate(b.transactions[b.transactions.length - 1]?.date);
      return (bLast?.getTime() || 0) - (aLast?.getTime() || 0);
    });

  orderedClients.forEach((c) => {
    const orderedTx = c.transactions.slice().sort((x, y) => (parseLocalDate(y.date) - parseLocalDate(x.date)));
    const recentHtml =
      orderedTx
        .slice(0, 5)
        .map((t) => `${t.date} - ${t.type}: ${money(t.amount)} (${t.paymentMethod})`)
        .join('<br>') +
      (c.transactions.length > 5 ? '<br><a href="#" class="view-more">Ver más</a>' : '');

    const $btns = $('<div>')
      .addClass('btn-container')
      .append(
        $('<button>')
          .addClass('btn btn-info btn-sm toggle-info')
          .attr('title', 'Ver información')
          .html('<i class="fas fa-info-circle"></i>')
          .data('client', c.name),
        $('<button>')
          .addClass('btn btn-warning btn-sm edit-client')
          .attr('title', 'Editar cliente')
          .html('<i class="fas fa-edit"></i>')
          .data('client', c.name)
      );

    const $row = $('<tr>').append(
      $('<td>').html(`<strong>${c.name}</strong>`).append($btns),
      $('<td>').html(recentHtml),
      $('<td>').text(money(c.balance))
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

export function initTableInteractions() {
  // Ver más
  $(document).on('click', '.view-more', function (e) {
    e.preventDefault();
    const clientName =
      $(this).closest('tr').find('.edit-client').data('client') ||
      $(this).closest('tr').find('strong').text();
    const c = clients[clientName];
    if (!c) return;

    const all = c.transactions
      .slice()
      .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
      .map((t) => `${t.date} - ${t.type}: ${money(t.amount)} (${t.paymentMethod})`)
      .join('<br>');
    $(this).closest('td').html(all);
  });

  // Mostrar info personal
  $(document).on('click', '.toggle-info', function () {
    $(this).closest('tr').next('.personal-info-row').slideToggle();
  });

  // Filtro de texto
  $('#debt-search').on('input', function () {
    const txt = $(this).val().toLowerCase();
    const $rows = $('#debt-list tbody tr');
    $rows.each(function () {
      const $tr = $(this);
      if ($tr.hasClass('personal-info-row')) return;
      const visible = $tr.text().toLowerCase().indexOf(txt) > -1;
      $tr.toggle(visible);
      const $info = $tr.next('.personal-info-row');
      if ($info.length) $info.toggle(visible && $tr.is(':visible'));
    });
  });
}
