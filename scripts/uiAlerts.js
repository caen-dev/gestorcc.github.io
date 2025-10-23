(function (global) {
  const DEFAULT_CONFIRM_COLOR = '#0d6efd';
  const hasSwal = typeof global.Swal === 'function';
  if (!hasSwal) console.error('[uiAlerts] SweetAlert2 no está disponible.');

  // === DETECTAR MODO OSCURO ===
  function isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }

  // === CONFIGURACIÓN BASE ===
  function fire({ icon = 'info', title = '', text = '', showConfirmButton = true }) {
    const dark = isDarkMode();

    const baseConfig = {
      icon,
      title,
      text,
      showConfirmButton,
      confirmButtonColor: DEFAULT_CONFIRM_COLOR,
      background: dark ? '#1e2124' : '#ffffff',
      color: dark ? '#f8f9fa' : '#212529',
      backdrop: dark
        ? 'rgba(0, 0, 0, 0.75)'
        : 'rgba(0, 0, 0, 0.3)',
      customClass: {
        popup: dark ? 'swal2-dark' : 'swal2-light',
        title: 'swal-title',
        htmlContainer: 'swal-text'
      }
    };

    if (hasSwal) {
      return Swal.fire(baseConfig);
    } else {
      alert(`${title}\n\n${text}`);
      return Promise.resolve();
    }
  }

  // === API DE ALERTAS ===
  const uiAlerts = {
    success(t, x = '') { return fire({ icon: 'success', title: t, text: x }); },
    error(t, x = '') { return fire({ icon: 'error', title: t, text: x }); },
    warning(t, x = '') { return fire({ icon: 'warning', title: t, text: x }); },
    info(t, x = '') { return fire({ icon: 'info', title: t, text: x }); },

    toast(msg, icon = 'success') {
      const dark = isDarkMode();
      if (hasSwal) {
        return Swal.fire({
          toast: true,
          position: 'top-end',
          icon,
          title: msg,
          background: dark ? '#1e2124' : '#ffffff',
          color: dark ? '#f8f9fa' : '#212529',
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
          showClass: { popup: 'animate__animated animate__fadeInDown' },
          hideClass: { popup: 'animate__animated animate__fadeOutUp' },
        });
      } else {
        console.log(`[${icon}] ${msg}`);
      }
    },

    async confirm(t, x = '¿Deseás continuar?') {
      const dark = isDarkMode();
      if (hasSwal) {
        const res = await Swal.fire({
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
          reverseButtons: true,
        });
        return res.isConfirmed;
      } else {
        return confirm(`${t}\n\n${x}`);
      }
    },
  };

  global.uiAlerts = uiAlerts;
  console.log('[uiAlerts] Estilos visuales activos (modo dinámico claro/oscuro).');
})(window);
