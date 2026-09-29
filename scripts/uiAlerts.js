'use strict';

// uiAlerts.js — híbrido: exporta como ESM y también adjunta window.uiAlerts

function isDarkMode() {
  return document.body.classList.contains('dark-mode');
}

export function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  return {
    accent: read('--accent', '#16766d'),
    surface: read('--modal-bg', '#ffffff'),
    text: read('--modal-text', '#24343a'),
    muted: read('--muted', '#5d6d70')
  };
}

function fire({ icon = 'info', title = '', text = '', showConfirmButton = true }) {
  const palette = getThemeColors();
  const hasSwal = typeof window.Swal === 'function';

  const config = {
    icon,
    title,
    text,
    showConfirmButton,
    confirmButtonColor: palette.accent,
    background: palette.surface,
    color: palette.text,
    backdrop: isDarkMode() ? 'rgba(0,0,0,0.75)' : 'rgba(25,52,59,0.32)',
    customClass: { popup: isDarkMode() ? 'swal2-dark' : 'swal2-light', title: 'swal-title', htmlContainer: 'swal-text' }
  };

  if (hasSwal) return window.Swal.fire(config);
  alert(`${title}\n\n${text}`);
  return Promise.resolve();
}

function success(t, x = '') { return fire({ icon: 'success', title: t, text: x }); }
function error(t, x = '')   { return fire({ icon: 'error',   title: t, text: x }); }
function warning(t, x = '') { return fire({ icon: 'warning', title: t, text: x }); }
function info(t, x = '')    { return fire({ icon: 'info',    title: t, text: x }); }

function toast(msg, icon = 'success') {
  const palette = getThemeColors();
  const hasSwal = typeof window.Swal === 'function';
  if (hasSwal) {
    return window.Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: msg,
      background: palette.surface,
      color: palette.text,
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true
    });
  }
  console.log(`[${icon}] ${msg}`);
  return Promise.resolve();
}

async function confirm(t, x = '¿Deseás continuar?') {
  const palette = getThemeColors();
  const hasSwal = typeof window.Swal === 'function';
  if (hasSwal) {
    const res = await window.Swal.fire({
      icon: 'question',
      title: t,
      text: x,
      showCancelButton: true,
      confirmButtonColor: palette.accent,
      cancelButtonColor: palette.muted,
      background: palette.surface,
      color: palette.text,
      customClass: { popup: isDarkMode() ? 'swal2-dark' : 'swal2-light' },
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    return res.isConfirmed;
  }
  return window.confirm(`${t}\n\n${x}`);
}

// —— Export ESM
export { success, error, warning, info, toast, confirm };

// —— También global por compatibilidad
window.uiAlerts = { success, error, warning, info, toast, confirm };
export default window.uiAlerts;
