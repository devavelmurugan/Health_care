import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import {
  initDb,
  getDoctors,
  getAppointments,
  getAppointmentByReference,
  addAppointment,
  updateAppointmentStatus,
  getUserByUsername,
  addUser
} from './db.js';
import { logAppointmentToExcel } from './excelLogger.js';
import { sendBookingThanks, sendBookingConfirmed } from './emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-auracare-secret-key-112233';

app.use(cors());
app.use(express.json());

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. Auth token required." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
}

// ---------------- AUTH ROUTES ----------------

// Register a new coordinator (Admin)
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  try {
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword
    };

    await addUser(newUser);
    res.status(201).json({ message: "Administrator account created successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Login (generates token)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid administrative credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid administrative credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------- CLINICAL ROUTES ----------------

// Get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await getDoctors();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific appointment by reference code (public client access)
app.get('/api/appointments/:reference', async (req, res) => {
  const reference = req.params.reference.trim().toUpperCase();
  try {
    const appointment = await getAppointmentByReference(reference);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment reference not found." });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new appointment booking (public access)
app.post('/api/appointments', async (req, res) => {
  const { doctorId, patientName, patientEmail, patientPhone, date, timeSlot, notes } = req.body;

  if (!doctorId || !patientName || !patientEmail || !patientPhone || !date || !timeSlot) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const doctors = await getDoctors();
    const doctor = doctors.find(d => d.id === doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Generate reference code
    const reference = 'AC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newAppointment = {
      id: uuidv4(),
      reference,
      doctorId,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      patientName,
      patientEmail,
      patientPhone,
      date,
      timeSlot,
      notes: notes || '',
      status: 'Requested',
      createdAt: new Date().toISOString()
    };

    // 1. Save to Database
    const savedApp = await addAppointment(newAppointment);

    // 2. Append to Excel File
    logAppointmentToExcel(savedApp);

    // 3. Send Email Confirmation
    await sendBookingThanks(savedApp);

    res.status(201).json(savedApp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all appointments (Admin/Dashboard view - Protected)
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await getAppointments();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update appointment status (Admin/Staff flow - Protected)
app.patch('/api/appointments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Requested', 'Confirmed', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status update." });
  }

  try {
    const updated = await updateAppointmentStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    
    // Send Confirmation Email if the state has been updated to Confirmed
    if (status === 'Confirmed') {
      await sendBookingConfirmed(updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Initialize DB and startup
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Aura Care Backend running on http://localhost:${PORT}`);
  });
});
