// public/js/auth-ui.js
(async () => {
  const box = document.getElementById('userBox');
  if (!box) return;

  // URL actual (para volver aquí después de loguear)
  const here = location.pathname + location.search + location.hash;

  // Utilidad para mostrar nombre
  const getDisplayName = (email) => (email || '').split('@')[0];

  // ¿Hay sesión?
  let user = null;
  try {
    const r = await fetch('/api/me');
    const j = await r.json();
    user = j.user || null;
  } catch {}

  // Si NO hay sesión, botón "Entrar" con returnTo
  if (!user) {
    box.innerHTML = `<a class="btn btn-nav" href="account.html?returnTo=${encodeURIComponent(here)}">Entrar</a>`;
    return;
  }

  // Si hay sesión, pinta menú
  const display = getDisplayName(user.email);
  const purchased = !!user.purchased;

  box.innerHTML = `
    <div class="user-menu">
      <button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false">
        <span class="avatar">${display.charAt(0).toUpperCase()}</span>
        <span class="uname">${display}</span>
      </button>
      <div class="user-dropdown" role="menu">
        <div class="user-email">${user.email}</div>
        ${purchased
          ? `<a class="menu-item" href="/download">⬇️ Descargar app</a>`
          : `<a class="menu-item" href="pricing.html">💳 Comprar</a>`}
        <a class="menu-item" href="account.html">👤 Perfil</a>
        <button class="menu-item" id="logoutBtn" type="button">🚪 Cerrar sesión</button>
      </div>
    </div>
  `;

  // Interacción del menú
  const menu = box.querySelector('.user-menu');
  const btn = box.querySelector('.user-btn');
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) menu.classList.remove('open');
  });

  // Logout
  box.querySelector('#logoutBtn')?.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
  });
})();
