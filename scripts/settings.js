'use strict';

import * as uiAlerts from './uiAlerts.js?v=20260928-8';

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
  const modalElement = modal[0];
  let returnFocus = null;
  let backgroundState = [];

  modal.on('show.bs.modal', () => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    backgroundState = Array.from(document.body.children)
      .filter((element) => element !== modalElement && !element.classList.contains('modal-backdrop'))
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute('aria-hidden')
      }));
    backgroundState.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });
  });

  modal.on('shown.bs.modal', () => {
    const backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop || backgroundState.some((state) => state.element === backdrop)) return;
    backgroundState.push({
      element: backdrop,
      inert: backdrop.inert,
      ariaHidden: backdrop.getAttribute('aria-hidden')
    });
    backdrop.inert = true;
    backdrop.setAttribute('aria-hidden', 'true');
  });

  modal.on('hidden.bs.modal', () => {
    backgroundState.forEach(({ element, inert, ariaHidden }) => {
      element.inert = inert;
      if (ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', ariaHidden);
    });
    backgroundState = [];
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  });

  $('#open-settings-btn').on('click', () => {
    try {
      const { name, phone, address } = loadBusinessInfo();
      $('#business-name').val(name);
      $('#business-phone').val(phone);
      $('#business-address').val(address);
      if (modalElement) modal.modal('show');
    } catch (err) {
      console.error(err);
      uiAlerts.error('No se pudieron leer los ajustes del negocio', err?.message || String(err));
    }
  });

  $('#save-business-settings').on('click', () => {
    try {
      saveBusinessInfo({
        name: $('#business-name').val(),
        phone: $('#business-phone').val(),
        address: $('#business-address').val()
      });
    } catch (err) {
      console.error(err);
      uiAlerts.error('No se pudieron guardar los ajustes del negocio', err?.message || String(err));
      return;
    }
    modal.modal('hide');
    const palette = uiAlerts.getThemeColors();
    Swal.fire({
      icon: 'success',
      title: 'Guardado ✅',
      text: 'Datos del negocio actualizados',
      confirmButtonColor: palette.accent,
      background: palette.surface,
      color: palette.text,
      customClass: { popup: document.body.classList.contains('dark-mode') ? 'swal2-dark' : 'swal2-light' }
    });
  });
}
