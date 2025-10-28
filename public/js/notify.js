// public/js/notify.js
(function(){
  // contenedor
  let host = document.querySelector('.toast-host');
  if(!host){
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }

  function makeToast(text, type='info', ms=3000){
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;

  // iconos inline (ligeros)
  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 7L9 18l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8.5h.01M11 11h2v5h-2z" fill="currentColor"/></svg>`
  };

  el.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__text">${text}</span>
    <button class="close" aria-label="Cerrar">✕</button>
  `;

  const close = () => {
    el.style.animation = 'toast-out .15s ease forwards';
    setTimeout(()=> el.remove(), 150);
  };
  el.querySelector('.close').addEventListener('click', close);

  host.appendChild(el);
  if(ms) setTimeout(close, ms);
}


  // API global
  window.showToast = makeToast;

  // "Flash" cross-page
  window.setFlash = (type, text, timeout=3000) => {
    sessionStorage.setItem('flash', JSON.stringify({type, text, timeout}));
  };
  window.consumeFlash = () => {
    const raw = sessionStorage.getItem('flash');
    if(!raw) return;
    sessionStorage.removeItem('flash');
    try {
      const {type, text, timeout} = JSON.parse(raw);
      makeToast(text, type, timeout);
    } catch {}
  };

  // mostrar si hay mensaje pendiente
  document.addEventListener('DOMContentLoaded', () => {
    window.consumeFlash();
  });
})();
