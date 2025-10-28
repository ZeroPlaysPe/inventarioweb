// server.js (ESM)
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import { getDB } from './db.js';

const app = express();

// Recomendado en Render/proxy
app.set('trust proxy', 1);

/* =============================
   Middlewares básicos
   ============================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized:
