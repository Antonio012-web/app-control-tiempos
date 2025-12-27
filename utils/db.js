// utils/db.js
import * as SQLite from 'expo-sqlite';

let db = null;

export async function initDB() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('timetracker.db');
  }

  // Migraciones: añade columnas si no existen
  await db.execAsync(`ALTER TABLE registros ADD COLUMN observaciones TEXT;`).catch(() => {});
  await db.execAsync(`ALTER TABLE registros ADD COLUMN herramienta TEXT;`).catch(() => {});
  await db.execAsync(`ALTER TABLE registros ADD COLUMN epp TEXT;`).catch(() => {});
  await db.execAsync(`ALTER TABLE jobs ADD COLUMN image TEXT;`).catch(() => {});

  // Crea tablas si no existen (incluye nuevas columnas)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS jobs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      operacion   TEXT    NOT NULL,
      nombre      TEXT    NOT NULL,
      trabajador  TEXT    NOT NULL,
      fecha       TEXT    NOT NULL,
      image       TEXT
    );
    CREATE TABLE IF NOT EXISTS registros (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id        INTEGER NOT NULL,
      proceso       TEXT    NOT NULL,
      tiempo        INTEGER NOT NULL,
      observaciones TEXT,
      herramienta   TEXT,
      epp           TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );
  `);

  console.log('✅ DB inicializada/migrada correctamente');
}

export function getDB() {
  if (!db) throw new Error('BD no inicializada. Llama primero a initDB().');
  return db;
}
