// db.js — versión solo con sqlite3 (sin el paquete "sqlite")
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

let db = null;

export async function getDB() {
  if (db) return db;

  const dbPath = path.join(__dirname, 'inventario.db');

  // abrimos la base
  const raw = await new Promise((resolve, reject) => {
    const conn = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });

  // Promisificamos get / run / all para poder usar await
  db = {
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        raw.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        raw.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        raw.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve(this); // this.lastID, this.changes
        });
      });
    }
  };

  // aseguramos que exista la tabla de usuarios
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      purchased INTEGER DEFAULT 0
    )
  `);

  return db;
}
