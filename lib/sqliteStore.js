import fs from 'fs';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let dbPromise;

function getDatabasePath() {
  return process.env.LOCATION_DB_PATH || path.join(process.cwd(), 'data', 'location-tracker.sqlite');
}

async function getDb() {
  if (!dbPromise) {
    const filename = getDatabasePath();

    if (filename !== ':memory:') {
      fs.mkdirSync(path.dirname(filename), { recursive: true });
    }

    dbPromise = open({ filename, driver: sqlite3.Database });
  }

  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      heading REAL,
      speed REAL,
      timestamp TEXT NOT NULL,
      device_info TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_session_points_token_id
    ON session_points (token, id);

    CREATE TABLE IF NOT EXISTS session_metadata (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL
    );
  `);

  return db;
}

export async function appendSessionPoint(token, point) {
  const db = await getDb();

  await db.run(
    `
      INSERT INTO session_points (token, lat, lng, accuracy, altitude, heading, speed, timestamp, device_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    token,
    point.lat,
    point.lng,
    point.accuracy,
    point.altitude,
    point.heading,
    point.speed,
    point.timestamp,
    JSON.stringify(point.deviceInfo || {})
  );

  const aggregate = await db.get(
    `
      SELECT COUNT(*) AS count, MIN(timestamp) AS createdAt, MAX(timestamp) AS lastUpdateAt
      FROM session_points
      WHERE token = ?
    `,
    token
  );

  return {
    token,
    pointsStored: aggregate?.count || 0,
    createdAt: aggregate?.createdAt || null,
    lastUpdateAt: aggregate?.lastUpdateAt || null
  };
}

export async function getSessionSnapshot(token, maxPoints = 1000) {
  const db = await getDb();

  const aggregate = await db.get(
    `
      SELECT COUNT(*) AS count, MIN(timestamp) AS createdAt, MAX(timestamp) AS lastUpdateAt
      FROM session_points
      WHERE token = ?
    `,
    token
  );

  if (!aggregate || !aggregate.count) {
    return null;
  }

  const rows = await db.all(
    `
      SELECT lat, lng, accuracy, altitude, heading, speed, timestamp, device_info
      FROM session_points
      WHERE token = ?
      ORDER BY id DESC
      LIMIT ?
    `,
    token,
    maxPoints
  );

  const points = rows
    .reverse()
    .map((row) => ({
      lat: row.lat,
      lng: row.lng,
      accuracy: row.accuracy,
      altitude: row.altitude,
      heading: row.heading,
      speed: row.speed,
      timestamp: row.timestamp,
      deviceInfo: JSON.parse(row.device_info || '{}')
    }));

  return {
    token,
    createdAt: aggregate.createdAt,
    lastUpdateAt: aggregate.lastUpdateAt,
    count: aggregate.count,
    points
  };
}

export async function clearSessionStore() {
  const db = await getDb();
  await db.exec('DELETE FROM session_points;');
  await db.exec('DELETE FROM session_metadata;');
}

export async function setSessionEmail(token, email) {
  const db = await getDb();
  await db.run(
    `
      INSERT INTO session_metadata (token, email)
      VALUES (?, ?)
      ON CONFLICT(token) DO UPDATE SET email = excluded.email
    `,
    token,
    email
  );
}

export async function getSessionEmail(token) {
  const db = await getDb();
  const row = await db.get(
    `SELECT email FROM session_metadata WHERE token = ?`,
    token
  );
  return row?.email || null;
}
