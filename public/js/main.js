// public/js/main.js
// controla: sesión, login, registro, pago demo, alertas y navbar
document.addEventListener('DOMContentLoaded', () => {
  /* -------------------------------------
     1. Helpers / referencias al DOM
  ------------------------------------- */
  const alertContainer = createAlertContainer();

  // navbar: donde va el botón "Entrar" o el menú de usuario
  const navbarUserSlot =
    document.getElementById('nav-user') ||
    document.querySelector('[data-slot="user"]');

  // panel de cuenta que pusimos en pricing
  const panelPerfil = document.getElementById('panel-perfil');
  const panelEmail = document.getElementById('panel-email');
  const panelStatus = document.getElementById('panel-status');
  const panelActions = document.getElementById('panel-actions');

  // botones de pricing
  const btnDescargar =
    document.getElementById('btn-descargar') ||
    document.querySelector('[data-action="download"]');

  const btnMiCuenta =
    document.getElementById('btn-mi-cuenta') ||
    document.querySelector('[data-action="account"]');

  // formularios de la página de cuenta (account.html)
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const toRegister = document.getElementById('link-to-register');
  const toLogin = document.getElementById('link-to-login');

  // formulario o botón de pago en pricing
  const formPay = document.getElementById('form-pago');
  const btnPagar = document.getElementById('btn-pagar');

  /* -------------------------------------
     2. Cargar sesión al entrar
  ------------------------------------- */
  loadSession();

  async function loadSession() {
    try {
      const res = await fetch('/api/me', {
        credentials: 'include'
      });
      const data = await res.json();
      renderSession(data.user);
    } catch (err) {
      console.error('No se pudo leer sesión:', err);
      renderSession(null);
    }
  }

  /* -------------------------------------
     3. Renderizar según haya usuario o no
  ------------------------------------- */
  function renderSession(user) {
    // 3.1 navbar
    if (navbarUserSlot) {
      if (user) {
        navbarUserSlot.innerHTML = `
          <div class="user-menu">
            <span class="user-mail">${user.email}</span>
            <button id="btn-logout" class="btn-small btn-outline">Salir</button>
          </div>
        `;
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
          btnLogout.addEventListener('click', doLogout);
        }
      } else {
        navbarUserSlot.innerHTML = `
          <a href="/account.html" class="btn-small btn-primary">Entrar</a>
        `;
      }
    }

    // 3.2 panel de perfil en pricing
    if (panelPerfil) {
      if (user) {
        panelPerfil.style.display = 'block';
        panelEmail.textContent = user.email;
        panelStatus.textContent = user.purchased
          ? 'Estado: ✅ compra activa'
          : 'Estado: ❌ aún no has pagado';

        // acciones
        panelActions.innerHTML = '';
        if (!user.purchased) {
          const b = document.createElement('button');
          b.textContent = 'Ir a pagar';
          b.className = 'btn-small btn-primary';
          b.addEventListener('click', () => {
            // si hay formulario de pago en la página, lo enfocamos
            const pago = document.getElementById('form-pago') || document.getElementById('card-number');
            if (pago && pago.scrollIntoView) pago.scrollIntoView({ behavior: 'smooth' });
          });
          panelActions.appendChild(b);
        } else {
          const b = document.createElement('a');
          b.textContent = 'Descargar';
          b.className = 'btn-small btn-success';
          b.href = '/download';
          panelActions.appendChild(b);
        }
      } else {
        panelPerfil.style.display = 'none';
      }
    }

    // 3.3 botones de pricing
    if (btnDescargar) {
      btnDescargar.onclick = () => {
        if (!user) {
          showAlert('warning', 'Primero inicia sesión.');
          location.href = '/account.html';
          return;
        }
        if (!user.purchased) {
          showAlert('warning', 'Aún no has pagado. Completa el pago primero.');
          return;
        }
        // descarga
        window.location.href = '/download';
      };
    }

    if (btnMiCuenta) {
      btnMiCuenta.onclick = () => {
        if (!user) {
          location.href = '/account.html';
        } else {
          // ya logueado
          showAlert('info', 'Ya estás logueado.');
        }
      };
    }
  }

  /* -------------------------------------
     4. LOGIN / REGISTER (account.html)
  ------------------------------------- */

  // cambiar entre login y register
  if (toRegister && toLogin && formLogin && formRegister) {
    toRegister.addEventListener('click', (e) => {
      e.preventDefault();
      formLogin.style.display = 'none';
      formRegister.style.display = 'block';
    });
    toLogin.addEventListener('click', (e) => {
      e.preventDefault();
      formLogin.style.display = 'block';
      formRegister.style.display = 'none';
    });
  }

  // login
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formLogin.querySelector('input[name="email"]').value.trim();
      const password = formLogin.querySelector('input[name="password"]').value.trim();

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'No se pudo iniciar sesión');
          return;
        }

        showAlert('success', 'Sesión iniciada ✅');
        // volver a la página principal o pricing
        setTimeout(() => {
          window.location.href = '/pricing.html';
        }, 700);
      } catch (err) {
        console.error(err);
        showAlert('danger', 'Error de conexión con el servidor');
      }
    });
  }

  // registro
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = formRegister.querySelector('input[name="email"]').value.trim();
      const password = formRegister.querySelector('input[name="password"]').value.trim();

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'No se pudo registrar');
          return;
        }

        showAlert('success', 'Registro exitoso 🎉');
        // ir a pricing
        setTimeout(() => {
          window.location.href = '/pricing.html';
        }, 700);
      } catch (err) {
        console.error(err);
        showAlert('danger', 'Error de conexión con el servidor');
      }
    });
  }

  /* -------------------------------------
     5. Logout
  ------------------------------------- */
  async function doLogout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      showAlert('info', 'Sesión cerrada');
      // recargar para pintar otra vez
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (err) {
      console.error(err);
      showAlert('danger', 'No se pudo cerrar sesión');
    }
  }

  /* -------------------------------------
     6. Pago simulado
  ------------------------------------- */
  // caso formulario
  if (formPay) {
    formPay.addEventListener('submit', async (e) => {
      e.preventDefault();
      const card = formPay.querySelector('input[name="card"]').value.trim();

      try {
        const res = await fetch('/api/mock-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ card })
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'No se pudo procesar el pago demo');
          return;
        }

        showAlert('success', 'Pago simulado exitoso ✅ ya puedes descargar.');
        // refrescar datos de usuario
        loadSession();
      } catch (err) {
        console.error(err);
        showAlert('danger', 'Error al conectar con el servidor');
      }
    });
  }

  // caso botón
  if (btnPagar) {
    btnPagar.addEventListener('click', async () => {
      // tarjeta fija de prueba
      try {
        const res = await fetch('/api/mock-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ card: '4242424242424242' })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showAlert('danger', data.error || 'No se pudo procesar el pago demo');
          return;
        }
        showAlert('success', 'Pago simulado exitoso ✅ ya puedes descargar.');
        loadSession();
      } catch (err) {
        console.error(err);
        showAlert('danger', 'Error al conectar con el servidor');
      }
    });
  }

  /* -------------------------------------
     7. Helpers de alertas
  ------------------------------------- */
  function createAlertContainer() {
    let box = document.getElementById('alert-container');
    if (box) return box;

    box = document.createElement('div');
    box.id = 'alert-container';
    box.style.position = 'fixed';
    box.style.top = '18px';
    box.style.left = '50%';
    box.style.transform = 'translateX(-50%)';
    box.style.zIndex = '9999';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '10px';
    document.body.appendChild(box);
    return box;
  }

  function showAlert(type, message) {
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    el.textContent = message;

    // estilos inline por si no cargó el css
    el.style.padding = '12px 16px';
    el.style.borderRadius = '10px';
    el.style.minWidth = '280px';
    el.style.maxWidth = '420px';
    el.style.color = '#fff';
    el.style.fontSize = '14px';
    el.style.boxShadow = '0 12px 30px rgba(0,0,0,.25)';
    el.style.backdropFilter = 'blur(6px)';

    if (type === 'success') el.style.background = 'linear-gradient(120deg,#22c55e,#16a34a)';
    else if (type === 'danger') el.style.background = 'linear-gradient(120deg,#ef4444,#b91c1c)';
    else if (type === 'warning') el.style.background = 'linear-gradient(120deg,#f97316,#ea580c)';
    else el.style.background = 'rgba(15,23,42,.85)';

    alertContainer.appendChild(el);

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .4s';
      setTimeout(() => el.remove(), 400);
    }, 3500);
  }
});
