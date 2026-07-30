import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// 1. Initial Thanks for Booking Email
export async function sendBookingThanks(app) {
  const isDummyUser = process.env.SMTP_USER === 'your-email@gmail.com' || !process.env.SMTP_USER;
  
  const emailHtml = `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; border: 1px solid #bf9f62; border-radius: 16px; background-color: #fbf9f6;">
      <h2 style="color: #2d4c3f; border-bottom: 2px solid #bf9f62; padding-bottom: 1rem; font-family: Georgia, serif;">Aura Care Clinique</h2>
      <p style="color: #53605a; font-size: 1.1rem; line-height: 1.6;">Dear <strong>${app.patientName}</strong>,</p>
      <p style="color: #53605a; font-size: 1.05rem; line-height: 1.6;">
        Thank you for choosing Aura Care. We have received your booking request. Our care coordination team is currently verifying the doctor's schedule and slot availability.
      </p>
      
      <div style="background-color: #ffffff; padding: 1.5rem; border-radius: 12px; margin: 2rem 0; border: 1px solid rgba(45, 76, 63, 0.08);">
        <table style="width: 100%; border-collapse: collapse; font-size: 1rem;">
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Booking Reference:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f; font-weight: bold; letter-spacing: 0.05em;">${app.reference}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Requested Practitioner:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f;">${app.doctorName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Specialty:</strong></td>
            <td style="padding: 0.75rem 0; color: #bf9f62; text-transform: uppercase; font-size: 0.85rem;">${app.doctorSpecialty}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Date:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f;">${app.date}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Time Slot:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f;">${app.timeSlot}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: rgba(191, 159, 98, 0.1); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; font-size: 0.9rem; text-align: center; color: #2d4c3f;">
        Please keep this Reference Code safe. You will receive another notification once a staff member confirms the appointment.
      </div>
      
      <p style="color: #bf9f62; font-size: 0.9rem; font-weight: bold; margin: 0;">Aura Care Outpatient Relations</p>
    </div>
  `;

  if (isDummyUser) {
    console.log('\n--- EMAIL NOTIFICATION LOG: Initial Thanks For Registration ---');
    console.log(`To: ${app.patientEmail}`);
    console.log(`Subject: Thanks for Booking Appointment - [Ref: ${app.reference}]`);
    console.log('HTML Snippet:');
    console.log(emailHtml);
    console.log('------------------------------------------------------------\n');
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL || `"Aura Care" <${process.env.SMTP_USER}>`,
      to: app.patientEmail,
      subject: `Thanks for Booking Appointment - [Ref: ${app.reference}]`,
      html: emailHtml
    });
    console.log(`✓ Thanks email sent to: ${app.patientEmail} for reference ${app.reference}`);
  } catch (error) {
    console.error(`⚠️ Thanks email delivery failed: ${error.message}`);
  }
}

// 2. Appointment Confirmed Email
export async function sendBookingConfirmed(app) {
  const isDummyUser = process.env.SMTP_USER === 'your-email@gmail.com' || !process.env.SMTP_USER;
  
  const emailHtml = `
    <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; border: 1px solid #2d4c3f; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #2d4c3f; border-bottom: 2px solid #bf9f62; padding-bottom: 1rem; font-family: Georgia, serif;">Aura Care Clinique</h2>
      <p style="color: #53605a; font-size: 1.1rem; line-height: 1.6;">Dear <strong>${app.patientName}</strong>,</p>
      <p style="color: #2d4c3f; font-size: 1.1rem; font-weight: bold; line-height: 1.6;">
        ✓ Your Outpatient Appointment is Confirmed!
      </p>
      <p style="color: #53605a; font-size: 1.05rem; line-height: 1.6;">
        Our coordination team has approved your schedule request. Dr. ${app.doctorName.split(' ').pop()} has reserved your time slot.
      </p>
      
      <div style="background-color: #fbf9f6; padding: 1.5rem; border-radius: 12px; margin: 2rem 0; border: 1px solid rgba(191, 159, 98, 0.2);">
        <table style="width: 100%; border-collapse: collapse; font-size: 1rem;">
          <tr style="border-bottom: 1px solid #e8e3d9;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Booking Reference:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f; font-weight: bold;">${app.reference}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e8e3d9;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Physician:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f;">${app.doctorName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e8e3d9;">
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Confirmed Date:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f; font-weight: bold;">${app.date}</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 0; color: #53605a;"><strong>Confirmed Time:</strong></td>
            <td style="padding: 0.75rem 0; color: #2d4c3f; font-weight: bold;">${app.timeSlot}</td>
          </tr>
        </table>
      </div>

      <div style="font-size: 0.95rem; line-height: 1.6; color: #53605a; margin-bottom: 2rem;">
        <strong>Arrival Directions:</strong> Please arrive 10 minutes prior to your time. You will be welcomed in the lobby for check-in.
      </div>
      
      <p style="color: #bf9f62; font-size: 0.9rem; font-weight: bold; margin: 0;">Aura Care Medical Services Team</p>
    </div>
  `;

  if (isDummyUser) {
    console.log('\n--- EMAIL NOTIFICATION LOG: Appointment Confirmed ---');
    console.log(`To: ${app.patientEmail}`);
    console.log(`Subject: Confirmed Appointment - Reference ${app.reference}`);
    console.log('HTML Snippet:');
    console.log(emailHtml);
    console.log('------------------------------------------------------------\n');
    return;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL || `"Aura Care" <${process.env.SMTP_USER}>`,
      to: app.patientEmail,
      subject: `Confirmed Appointment - Reference ${app.reference}`,
      html: emailHtml
    });
    console.log(`✓ Confirmation email sent to: ${app.patientEmail} for reference ${app.reference}`);
  } catch (error) {
    console.error(`⚠️ Confirmation email delivery failed: ${error.message}`);
  }
}
