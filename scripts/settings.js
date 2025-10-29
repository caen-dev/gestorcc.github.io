'use strict';

const KEY_NAME = 'cuentasplus:businessName';
const KEY_PHONE = 'cuentasplus:businessPhone';
const KEY_ADDR = 'cuentasplus:businessAddress';

export function loadBusinessInfo() {
  return {
    name: localStorage.getItem(KEY_NAME) || '',
    phone: localStorage.getItem(KEY_PHONE) || '',
    address: localStorage.getItem(KEY_ADDR) || ''
  };
}

export function saveBusinessInfo(data) {
  localStorage.setItem(KEY_NAME, data.name.trim());
  localStorage.setItem(KEY_PHONE, data.phone.trim());
  localStorage.setItem(KEY_ADDR, data.address.trim());
}

export function initBusinessSettings() {
  const modal = $('#businessSettingsModal');

  $('#open-settings-btn').on('click', () => {
    const { name, phone, address } = loadBusinessInfo();
    $('#business-name').val(name);
    $('#business-phone').val(phone);
    $('#business-address').val(address);
    modal.modal('show');
  });

  $('#save-business-settings').on('click', () => {
    saveBusinessInfo({
      name: $('#business-name').val(),
      phone: $('#business-phone').val(),
      address: $('#business-address').val()
    });
    modal.modal('hide');
    Swal.fire({
      icon: 'success',
      title: 'Guardado ✅',
      text: 'Datos del negocio actualizados',
      confirmButtonColor: '#0d6efd'
    });
  });
}
