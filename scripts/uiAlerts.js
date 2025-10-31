'use strict';

// Este archivo ahora es un MÓDULO ES. No se incluye como <script> clásico.
// Se usa con: import * as uiAlerts from './uiAlerts.js';

const DEFAULT_CONFIRM_COLOR = '#0d6efd';

function isDarkMode() {
  return document.body.classList.contains('dark-mode');
}

function fire({ icon = 'info', title = '', text = '', showConfirmButton = true }) {
  const dark = isDarkMode();
  const hasSwal = typeof window.Swal === 'function';

  const config = {
    icon,
    title,
    text,
    showConfirmButton,
    confirmButtonColor: DEFAULT_CONFIRM_COLOR,
    background: dark ? '#1e2124' : '#ffffff',
    color: dark ? '#f8f9fa' : '#212529',
    backdrop: dark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.3)',
    customClass: { popup: dark ? 'swal2-dark' : 'swal2-light', title: 'swal-title', htmlContainer: 'swal-text' }
  };

  if (hasSwal) {
    return window.Swal.fire(config);
  } else {
    alert(`${title}\n\n${text}`);
    return Promise.resolve();
  }
}

export function success(t, x = '') { return fire({ icon: 'success', title: t, text: x }); }
export function error(t, x = '')   { return fire({ icon: 'error',   title: t, text: x }); }
export function warning(t, x = '') { return fire({ icon: 'warning', title: t, text: x }); }
export function info(t, x = '')    { return fire({ icon: 'info',    title: t, text: x }); }

export function toast(msg, icon = 'success') {
  const dark = isDarkMode();
  const hasSwal = typeof window.Swal === 'function';
  if (hasSwal) {
    return window.Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: msg,
      background: dark ? '#1e2124' : '#ffffff',
      color: dark ? '#f8f9fa' : '#212529',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true
    });
  } else {
    console.log(`[${icon}] ${msg}`);
    return Promise.resolve();
  }
}

export async function confirm(t, x = '¿Deseás continuar?') {
  const dark = isDarkMode();
  const hasSwal = typeof window.Swal === 'function';
  if (hasSwal) {
    const res = await window.Swal.fire({
      icon: 'question',
      title: t,
      text: x,
      showCancelButton: true,
      confirmButtonColor: DEFAULT_CONFIRM_COLOR,
      cancelButtonColor: dark ? '#6c757d' : '#adb5bd',
      background: dark ? '#1e2124' : '#ffffff',
      color: dark ? '#f8f9fa' : '#212529',
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    return res.isConfirmed;
  } else {
    return window.confirm(`${t}\n\n${x}`);
  }
}
