// server.js – versión para Render
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Render está detrás de proxy
app.set('trust proxy', 1);

// middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// sesión
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// servir carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// helper de auth (SOLO UNO)
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'No autenticado' });
  }
  next();
}

/* ========================
   AUTH
   ======================== */

// registro
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }

    const db = await getDB();
    const exists = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) {
      return res.status(409).json({ ok: false, error: 'El email ya existe' });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const r = await db.run(
      'INSERT INTO users (email, password_hash, purchased) VALUES (?,?,0)',
      [email, hash]
    );

    req.session.user = { id: r.lastID, email, purchased: 0 };
    return res.json({ ok: true });
  } catch (err) {
    console.error('REGISTER', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Datos inválidos' });
    }

    const db = await getDB();
    const user = await db.get(
      'SELECT id, email, password_hash, purchased FROM users WHERE email = ?',
      [email]
    );
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      purchased: user.purchased ? 1 : 0
    };

    return res.json({ ok: true });
  } catch (err) {
    console.error('LOGIN', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// quién soy
app.get('/api/me', async (req, res) => {
  if (!req.session.user) {
    return res.json({ user: null });
  }
  try {
    const db = await getDB();
    const row = await db.get(
      'SELECT id, email, purchased FROM users WHERE id = ?',
      [req.session.user.id]
    );
    if (row) {
      req.session.user = {
        id: row.id,
        email: row.email,
        purchased: row.purchased ? 1 : 0
      };
    }
    return res.json({ user: req.session.user });
  } catch (err) {
    console.error('ME', err);
    return res.json({ user: req.session.user });
  }
});

/* ========================
   PAGO SIMULADO
   ======================== */

app.post('/api/mock-pay', requireAuth, async (req, res) => {
  try {
    const { card } = req.body || {};
    const digits = String(card || '').replace(/\D/g, '');

    const okCards = ['4242424242424242', '4111111111111111', '5555555555554444'];
    const badCards = ['4000000000000002'];

    if (!digits) {
      return res.status(400).json({ ok: false, error: 'Tarjeta inválida' });
    }
    if (badCards.includes(digits)) {
      return res.status(402).json({ ok: false, error: 'Tarjeta rechazada (demo)' });
    }
    if (!okCards.includes(digits)) {
      return res
        .status(402)
        .json({ ok: false, error: 'Tarjeta no admitida en modo demo' });
    }

    const db = await getDB();
    await db.run('UPDATE users SET purchased = 1 WHERE id = ?', [req.session.user.id]);
    req.session.user = { ...req.session.user, purchased: 1 };

    return res.json({ ok: true });
  } catch (err) {
    console.error('MOCK PAY', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

/* ========================
   DESCARGA
   ======================== */

// ⚠️ asegúrate de tener public/dummy.txt en el repo
app.get('/download', requireAuth, async (req, res) => {
  try {
    // si no ha pagado, no
    if (!req.session.user.purchased) {
      return res.status(403).send('Necesitas pagar primero.');
    }

    const file = path.join(process.cwd(), 'public', 'dummy.txt');
    return res.download(file, 'descarga-demo.txt');
  } catch (err) {
    console.error('DOWNLOAD', err);
    return res.status(500).send('Error al descargar');
  }
});

/* ========================
   INICIO
   ======================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor listo en puerto', PORT);
});
