export const LOCALE = 'es-AR';
export const money = (n) => `$${Number(n || 0).toLocaleString(LOCALE)}`;
export const todayStr = () => new Date().toLocaleDateString(LOCALE);

export function isEmpty(v) { return v === undefined || v === null || v === ''; }

export function parseLocalDate(str) {
  if (!str) return null;
  const p = String(str).split('/');
  if (p.length >= 3) {
    const d = new Date(+p[2], +p[1] - 1, +p[0]);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Formateo en vivo y parseo de montos con formato AR
export function formatMoneyLive(raw) {
  if (!raw) return '';
  let v = raw.replace(/[^\d,]/g, '');
  const parts = v.split(',');
  let intPart = parts[0] || '';
  let decPart = (parts[1] || '').slice(0, 2);
  intPart = intPart.replace(/^0+(?=\d)/, '');
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart.length ? `${intPart},${decPart}` : intPart;
}
export function parseMoneyToNumber(str) {
  if (!str) return NaN;
  const normalized = String(str).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

// Tema oscuro (igual a tu lógica actual)
export function initTheme() {
  const DARK_KEY = 'gestorcc:darkmode';
  const toggleSwitch = document.getElementById('toggle-dark-mode');
  if (toggleSwitch && localStorage.getItem(DARK_KEY) === '1') {
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
      localStorage.setItem(DARK_KEY, document.body.classList.contains('dark-mode') ? '1' : '0');
    });
  }
}
