'use strict';

import {
  parseMoneyToCents,
  formatMoneyFromCents,
  formatMoneyLive as liveFormatMoney
} from './currency.js';

export const LOCALE = 'es-AR';

/**
 * money(value)
 *
 * IMPORTANT: all monetary values in the app should be stored internally as integer cents.
 * This helper formats either:
 * - integer cents (preferred internal value), or
 * - legacy decimal dollars (compatibility fallback)
 *
 * Example:
 *   money(150)      -> "$1,50"
 *   money(100000)   -> "$1.000,00"
 *   money(1000.5)   -> "$1.000,50"
 */
export const money = (n) => {
  const value = Number(n ?? 0);
  if (!Number.isFinite(value)) return '$0,00';

  // Preferred internal representation: integer cents.
  if (Number.isInteger(value)) {
    return formatMoneyFromCents(value);
  }

  // Legacy fallback: decimal dollars -> convert to cents for formatting.
  return formatMoneyFromCents(Math.round(value * 100));
};

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

// NOTE: This remains only as compatibility wrapper for the older codebase.
// The project standard is: parseMoneyToCents() from currency.js.
export function formatMoneyLive(raw) {
  return liveFormatMoney(raw);
}

export function parseMoneyToNumber(str) {
  return parseMoneyToCents(str);
}

// Tema oscuro
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
