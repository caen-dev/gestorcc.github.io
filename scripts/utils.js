export const LOCALE = 'es-AR';
export const money = (n) => `$${Number(n || 0).toLocaleString(LOCALE)}`;
export const todayStr = () => new Date().toLocaleDateString(LOCALE);
export const formatDateForPDF = (date) => new Intl.DateTimeFormat(LOCALE).format(date);
export const todayFileStr = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
export const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es-AR');

export function isEmpty(v) { return v === undefined || v === null || v === ''; }

export function parseLocalDate(str) {
  if (!str) return null;
  const p = String(str).split('/');
  if (p.length === 3) {
    if (!p.every((part) => /^\d+$/.test(part))) return null;
    const day = Number(p[0]);
    const month = Number(p[1]);
    const year = Number(p[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
      return null;
    return date;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Formateo en vivo y parseo de montos con formato AR
export function formatMoneyLive(raw) {
  const value = String(raw ?? '');
  if (!value) return '';
  if (/[^0-9.,]/.test(value) || (value.match(/,/g) || []).length > 1) return value;
  const commaIndex = value.indexOf(',');
  if (commaIndex >= 0 && value.length - commaIndex - 1 > 2) return value;

  let v = value.replace(/\./g, '');
  if (commaIndex < 0) {
    const decimalPoint = /^(\d+)\.(\d{0,2})$/.exec(value);
    if (decimalPoint) v = `${decimalPoint[1]},${decimalPoint[2]}`;
  }
  const parts = v.split(',');
  let intPart = parts[0] || '';
  let decPart = (parts[1] || '').slice(0, 2);
  intPart = intPart.replace(/^0+(?=\d)/, '');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return v.includes(',') ? `${intPart},${decPart}` : intPart;
}
export function parseMoneyToNumber(str) {
  if (!str) return NaN;
  const value = String(str).trim();
  const isDotDecimal = /^\d+\.\d{1,2}$/.test(value);
  if (!isDotDecimal && !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return NaN;
  const normalized = isDotDecimal ? value : value.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

// Tema oscuro (igual a tu lógica actual)
export function initTheme() {
  const DARK_KEY = 'gestorcc:darkmode';
  const toggleSwitch = document.getElementById('toggle-dark-mode');
  let darkModeEnabled = false;
  try {
    darkModeEnabled = localStorage.getItem(DARK_KEY) === '1';
  } catch (error) {
    console.warn('No se pudo leer la preferencia de tema:', error);
  }
  if (toggleSwitch && darkModeEnabled) {
    document.body.classList.add('dark-mode');
    toggleSwitch.checked = true;
  }
  function animateThemeTransition() {
    document.body.classList.add('theme-transition');
    setTimeout(() => document.body.classList.remove('theme-transition'), 400);
  }
  if (toggleSwitch) {
    toggleSwitch.addEventListener('change', () => {
      animateThemeTransition();
      document.body.classList.toggle('dark-mode');
      try {
        localStorage.setItem(DARK_KEY, document.body.classList.contains('dark-mode') ? '1' : '0');
      } catch (error) {
        console.error('No se pudo guardar la preferencia de tema:', error);
        window.uiAlerts?.error('No se pudo guardar el tema', error?.message || String(error));
      }
    });
  }
}
