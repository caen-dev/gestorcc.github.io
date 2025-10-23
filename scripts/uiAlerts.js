(function (global) {
  const DEFAULT_CONFIRM_COLOR = '#0d6efd';
  const hasSwal = typeof global.Swal === 'function';
  if (!hasSwal) console.error('[uiAlerts] SweetAlert2 no está disponible.');

  function fire({ icon = 'info', title = '', text = '', showConfirmButton = true }) {
    if (hasSwal) {
      return Swal.fire({
        icon, title, text, showConfirmButton,
        confirmButtonColor: DEFAULT_CONFIRM_COLOR,
      });
    } else {
      alert(`${title}\n\n${text}`);
      return Promise.resolve();
    }
  }

  const uiAlerts = {
    success(t, x = '') { return fire({ icon: 'success', title: t, text: x }); },
    error(t, x = '') { return fire({ icon: 'error', title: t, text: x }); },
    warning(t, x = '') { return fire({ icon: 'warning', title: t, text: x }); },
    info(t, x = '') { return fire({ icon: 'info', title: t, text: x }); },
    toast(msg, icon = 'success') {
      if (hasSwal) {
        return Swal.fire({
          toast: true,
          position: 'top-end',
          icon,
          title: msg,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        console.log(`[${icon}] ${msg}`);
        return Promise.resolve();
      }
    },
    async confirm(t, x = '¿Deseás continuar?') {
      if (hasSwal) {
        const res = await Swal.fire({
          icon: 'question', title: t, text: x,
          showCancelButton: true,
          confirmButtonColor: DEFAULT_CONFIRM_COLOR,
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí', cancelButtonText: 'Cancelar',
        });
        return res.isConfirmed;
      } else {
        return confirm(`${t}\n\n${x}`);
      }
    },
  };

  global.uiAlerts = uiAlerts;
  console.log('[uiAlerts] Módulo inicializado correctamente.');
})(window);
