document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "btnComprar") {
    e.preventDefault();
    try {
      const res = await fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("No se pudo iniciar el pago.");
      }
    } catch {
      alert("Error conectando con el servidor.");
    }
  }
});
// registro
fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include'
});

// saber quién soy
fetch('/api/me', {
  credentials: 'include'
});

// logout
fetch('/api/logout', {
  method: 'POST',
  credentials: 'include'
});

// pago simulado
fetch('/api/mock-pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ card }),
  credentials: 'include'
});

