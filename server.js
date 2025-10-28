// server.js (ESM)
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { getDB } from './db.js';
const app = express();

/* =============================
   Middlewares básicos
   ============================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,              // en producción con HTTPS: true
      maxAge: 1000 * 60 * 60 * 8, // 8h
    },
  })
);

// Archivos estáticos (tu web)
app.use(express.static('public'));

/* =============================
   Helper: exigir sesión (SOLO UNO)
   ============================= */
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, error: 'No autenticado' });
  next();
}

/* =============================
   Rutas de autenticación
   ============================= */

// Crear cuenta
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || password.length < 4) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }
    const db = await getDB();
    const exists = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese email' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password_hash, purchased) VALUES (?,?,0)',
      [email, hash]
    );

    req.session.user = { id: result.lastID, email, purchased: 0 };
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Datos inválidos' });

    const db = await getDB();
    const user = await db.get('SELECT id, email, password_hash, purchased FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });

    req.session.user = { id: user.id, email: user.email, purchased: user.purchased };
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Sesión actual: siempre refresca 'purchased' desde la DB
app.get('/api/me', async (req, res) => {
  if (!req.session.user) return res.json({ user: null });

  try {
    const db = await getDB();
    const row = await db.get('SELECT id, email, purchased FROM users WHERE id = ?', [req.session.user.id]);
    if (row) {
      req.session.user = { id: row.id, email: row.email, purchased: row.purchased ? 1 : 0 };
    }
    return res.json({ user: req.session.user });
  } catch (e) {
    console.error(e);
    return res.json({ user: req.session.user }); // fallback
  }
});


/* =============================
   Descarga protegida
   ============================= */
app.get('/download', requireAuth, async (req, res) => {
  if (!req.session.user.purchased) return res.status(403).send('Se requiere compra activa');
  const file = path.join(process.cwd(), 'downloads', 'inventario-app.zip');
  return res.download(file, 'SistemaInventario.zip');
});// Descarga protegida: verifica en DB que purchased=1
app.get('/download', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const row = await db.get('SELECT purchased FROM users WHERE id = ?', [req.session.user.id]);
    const purchased = row && (row.purchased ? 1 : 0);
    req.session.user.purchased = purchased;

    if (!purchased) return res.status(403).send('Necesitas completar el pago para descargar.');

    const file = path.join(process.cwd(), 'downloads', 'inventario-app.zip');
    return res.download(file, 'SistemaInventario.zip');
  } catch (e) {
    console.error(e);
    return res.status(500).send('Error al verificar tu compra.');
  }
});
+63

/* =============================
   PAGO SIMULADO (sin dinero real)
   ============================= */
app.post('/api/mock-pay', requireAuth, async (req, res) => {
  try {
    const { card } = req.body || {};
    const digits = String(card || '').replace(/\D/g, '');

    // Aprobadas de demo / Rechazada de demo
    const okCards  = ['4242424242424242', '4111111111111111', '5555555555554444'];
    const badCards = ['4000000000000002'];

    if (!digits)                   return res.status(400).json({ ok:false, error:'Tarjeta inválida' });
    if (badCards.includes(digits)) return res.status(402).json({ ok:false, error:'Tarjeta rechazada (simulado)' });
    if (!okCards.includes(digits)) return res.status(402).json({ ok:false, error:'Tarjeta no admitida en demo' });

    const db = await getDB();
    await db.run('UPDATE users SET purchased = 1 WHERE id = ?', [req.session.user.id]);

    // Actualiza la sesión en memoria
    req.session.user = { ...req.session.user, purchased: 1 };

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

/* =============================
   (Opcional) 404 estático
   ============================= */
// app.use((req, res) => res.status(404).sendFile(path.join(process.cwd(), 'public', '404.html')));

/* =============================
   ARRANCAR SERVIDOR (al final)
   ============================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor local en http://localhost:${PORT}`);
});
