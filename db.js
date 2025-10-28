// db.js (ESM)
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getDB() {
  const db = await open({
    filename: "./inventario.db",
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      purchased INTEGER DEFAULT 0
    );
  `);
  return db;
}
