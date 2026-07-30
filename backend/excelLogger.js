import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCEL_FILE = path.join(__dirname, 'appointments.xlsx');

export function logAppointmentToExcel(app) {
  try {
    let workbook;
    let sheetData = [];

    // Row representation for excel sheet
    const newRow = {
      'Booking Reference': app.reference,
      'Patient Name': app.patientName,
      'Patient Email': app.patientEmail,
      'Patient Phone': app.patientPhone,
      'Clinician': app.doctorName,
      'Specialty': app.doctorSpecialty,
      'Scheduled Date': app.date,
      'Scheduled Time Slot': app.timeSlot,
      'Additional Notes': app.notes,
      'Booking Status': app.status,
      'Created At': app.createdAt
    };

    if (fs.existsSync(EXCEL_FILE)) {
      // Read existing workbook
      workbook = XLSX.readFile(EXCEL_FILE);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      sheetData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      // Create a brand new workbook
      workbook = XLSX.utils.book_new();
    }

    // Append new row
    sheetData.push(newRow);

    // Create sheet and replace/insert into workbook
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    
    // Set column widths to look clean and neat
    worksheet['!cols'] = [
      { wch: 20 }, // Reference
      { wch: 22 }, // Patient Name
      { wch: 26 }, // Email
      { wch: 18 }, // Phone
      { wch: 22 }, // Doctor Name
      { wch: 26 }, // Specialty
      { wch: 15 }, // Date
      { wch: 15 }, // Time
      { wch: 30 }, // Notes
      { wch: 15 }, // Status
      { wch: 26 }  // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
    
    // Handle duplication override (if sheet already existed, remove old one first)
    if (workbook.SheetNames.length > 1) {
      workbook.SheetNames.shift(); // Remove first sheet which was empty or duplicate
    }

    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(`✓ Appointment ${app.reference} logged to Excel sheet: ${EXCEL_FILE}`);
  } catch (err) {
    console.error(`⚠️ Failed to log appointment to Excel: ${err.message}`);
  }
}
