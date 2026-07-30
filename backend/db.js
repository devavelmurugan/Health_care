import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_JSON_DB = path.join(__dirname, 'db_fallback.json');

const DEFAULT_DOCTORS = [
  {
    id: "doc-1",
    name: "Dr. Evelyn Thorne",
    specialty: "Wellness & Spa Consultation",
    bio: "Specializes in holistic therapy, stress management, and preventative longevity care.",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance",
    specialty: "Cardiology",
    bio: "Expert in cardiovascular health and premium personalized stress testing.",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "doc-3",
    name: "Dr. Serena Patel",
    specialty: "Dermatology",
    bio: "Focuses on premium skincare, anti-aging therapies, and aesthetic dermatology.",
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300"
  },
  {
    id: "doc-4",
    name: "Dr. Adrian Sterling",
    specialty: "Pediatrics",
    bio: "Caring and gentle child development and family health consulting.",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300"
  }
];

let pool = null;
let useFallback = false;

// Initialize Database Connection / Schema
export async function initDb() {
  try {
    // Connect to server without database first to ensure database exists
    const initialConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'auracare'}\``);
    await initialConnection.end();

    // Now establish connection pool with the database
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'auracare',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✓ Successfully connected to MySQL database.');

    // Create Tables if not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        bio TEXT,
        rating DECIMAL(3,2),
        image TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(50) PRIMARY KEY,
        reference VARCHAR(20) NOT NULL,
        doctorId VARCHAR(50) NOT NULL,
        doctorName VARCHAR(100) NOT NULL,
        doctorSpecialty VARCHAR(100) NOT NULL,
        patientName VARCHAR(100) NOT NULL,
        patientEmail VARCHAR(100) NOT NULL,
        patientPhone VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        timeSlot VARCHAR(20) NOT NULL,
        notes TEXT,
        status VARCHAR(30) DEFAULT 'Requested',
        createdAt VARCHAR(50) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);

    // Seed doctors
    const [existingDocs] = await pool.query('SELECT COUNT(*) as count FROM doctors');
    if (existingDocs[0].count === 0) {
      for (const doc of DEFAULT_DOCTORS) {
        await pool.query(
          'INSERT INTO doctors (id, name, specialty, bio, rating, image) VALUES (?, ?, ?, ?, ?, ?)',
          [doc.id, doc.name, doc.specialty, doc.bio, doc.rating, doc.image]
        );
      }
      console.log('✓ MySQL Doctors table seeded.');
    }

  } catch (err) {
    console.warn('⚠️ Could not connect to MySQL server. Falling back to local JSON file storage.');
    console.warn(`Error detail: ${err.message}`);
    useFallback = true;

    // Setup local JSON file fallback
    if (!fs.existsSync(LOCAL_JSON_DB)) {
      fs.writeFileSync(LOCAL_JSON_DB, JSON.stringify({ doctors: DEFAULT_DOCTORS, appointments: [], users: [] }, null, 2));
    }
  }
}

// Helper methods to read/write from correct DB source
export async function getDoctors() {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    return JSON.parse(raw).doctors;
  }
  const [rows] = await pool.query('SELECT * FROM doctors');
  return rows;
}

export async function getAppointments() {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    return JSON.parse(raw).appointments;
  }
  const [rows] = await pool.query('SELECT * FROM appointments');
  return rows;
}

export async function getAppointmentByReference(reference) {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    const db = JSON.parse(raw);
    return db.appointments.find(a => a.reference === reference || a.id === reference) || null;
  }
  const [rows] = await pool.query('SELECT * FROM appointments WHERE reference = ? OR id = ?', [reference, reference]);
  return rows.length > 0 ? rows[0] : null;
}

export async function addAppointment(app) {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    const db = JSON.parse(raw);
    db.appointments.push(app);
    fs.writeFileSync(LOCAL_JSON_DB, JSON.stringify(db, null, 2));
    return app;
  }
  await pool.query(
    `INSERT INTO appointments (id, reference, doctorId, doctorName, doctorSpecialty, patientName, patientEmail, patientPhone, date, timeSlot, notes, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [app.id, app.reference, app.doctorId, app.doctorName, app.doctorSpecialty, app.patientName, app.patientEmail, app.patientPhone, app.date, app.timeSlot, app.notes, app.status, app.createdAt]
  );
  return app;
}

export async function updateAppointmentStatus(id, status) {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    const db = JSON.parse(raw);
    const idx = db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = status;
      fs.writeFileSync(LOCAL_JSON_DB, JSON.stringify(db, null, 2));
      return db.appointments[idx];
    }
    return null;
  }
  await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0];
}

export async function getUserByUsername(username) {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    const db = JSON.parse(raw);
    return db.users.find(u => u.username === username) || null;
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows.length > 0 ? rows[0] : null;
}

export async function addUser(user) {
  if (useFallback) {
    const raw = fs.readFileSync(LOCAL_JSON_DB, 'utf8');
    const db = JSON.parse(raw);
    db.users.push(user);
    fs.writeFileSync(LOCAL_JSON_DB, JSON.stringify(db, null, 2));
    return user;
  }
  await pool.query('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [user.id, user.username, user.password]);
  return user;
}
