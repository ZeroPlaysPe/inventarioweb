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
