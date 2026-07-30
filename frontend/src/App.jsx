import React, { useState } from 'react';
import BookingWizard from './components/BookingWizard';
import StatusTracker from './components/StatusTracker';
import Dashboard from './components/Dashboard';

export default function App() {
  const [view, setView] = useState('home'); // home, book, track, admin
  const [bookedAppointment, setBookedAppointment] = useState(null);

  const handleBookingSuccess = (appointment) => {
    setBookedAppointment(appointment);
    setView('success');
  };

  return (
    <div>
      {/* Header Navigation */}
      <header>
        <div className="container nav-wrapper">
          <a className="brand" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
            AURA <span>CARE</span>
          </a>
          <nav className="nav-menu">
            <span 
              className={`nav-link ${view === 'home' ? 'active' : ''}`} 
              onClick={() => setView('home')}
            >
              Overview
            </span>
            <span 
              className={`nav-link ${view === 'track' ? 'active' : ''}`} 
              onClick={() => setView('track')}
            >
              Track Appointment
            </span>
            <span 
              className={`nav-link ${view === 'admin' ? 'active' : ''}`} 
              onClick={() => setView('admin')}
            >
              Coordination Hub
            </span>
            <button className="btn-book" onClick={() => setView('book')}>
              Reserve Visit
            </button>
          </nav>
        </div>
      </header>

      {/* Main Views */}
      <main className="container" style={{ minHeight: 'calc(100vh - 350px)' }}>
        
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div>
            <section className="hero">
              <div className="hero-grid">
                <div className="hero-content">
                  <span className="section-tag" style={{ textAlign: 'left', margin: '0 0 1rem 0' }}>
                    Welcome to Aura Care Clinique
                  </span>
                  <h1>Where Healthcare Meets Hospitality</h1>
                  <p>
                    Experience medical excellence in an atmosphere designed for comfort, healing, and peace of mind. We offer bespoke health consulting and luxury outpatient services tailored to your lifestyle.
                  </p>
                  <div className="hero-actions">
                    <button className="btn-book" onClick={() => setView('book')}>
                      Book Private Consultation
                    </button>
                    <button className="btn-secondary" onClick={() => setView('track')}>
                      Track Live Appointment
                    </button>
                  </div>
                </div>
                <div 
                  className="hero-image-container" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600')` }}
                />
              </div>
            </section>

            {/* Core Values / Specialties */}
            <section className="section">
              <span className="section-tag">Premium Specialties</span>
              <h2 className="section-title">Specialized Clinical Pathways</h2>
              <div className="specialties-grid">
                <div className="specialty-card glass-panel" onClick={() => setView('book')}>
                  <div className="specialty-icon">🌿</div>
                  <h3>Holistic & Longevity Care</h3>
                  <p>Tailored preventative protocols, nutrition therapy, and biohacking consultations.</p>
                </div>
                <div className="specialty-card glass-panel" onClick={() => setView('book')}>
                  <div className="specialty-icon">🫀</div>
                  <h3>Cardiology Suite</h3>
                  <p>Comprehensive lipid profiling, advanced ECGs, and premium stress analysis.</p>
                </div>
                <div className="specialty-card glass-panel" onClick={() => setView('book')}>
                  <h3>Aesthetic Dermatology</h3>
                  <p>Regenerative skin therapies, laser diagnostics, and medical-grade facials.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: BOOKING WIZARD */}
        {view === 'book' && (
          <section className="section">
            <BookingWizard onBookingSuccess={handleBookingSuccess} />
          </section>
        )}

        {/* VIEW: TRACKING STATUS */}
        {view === 'track' && (
          <section className="section">
            <StatusTracker />
          </section>
        )}

        {/* VIEW: BOOKING SUCCESS CONFIRMATION */}
        {view === 'success' && bookedAppointment && (
          <section className="section" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ maxWidth: '600px', padding: '3.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', color: '#bf9f62', marginBottom: '1rem' }}>✓</div>
              <h2 style={{ color: '#2d4c3f', marginBottom: '1rem' }}>Your Reservation is Requested</h2>
              <p style={{ color: '#53605a', marginBottom: '2rem' }}>
                Thank you for selecting Aura Care. A hospitality specialist is reviewing your slot details. Keep your booking reference code safe to track live status updates.
              </p>
              <div style={{ background: 'rgba(191, 159, 98, 0.1)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', color: '#53605a', marginBottom: '0.5rem' }}>
                  Booking Reference Code
                </span>
                <strong style={{ fontSize: '2rem', color: '#2d4c3f', letterSpacing: '0.05em' }}>
                  {bookedAppointment.reference}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-book" onClick={() => setView('track')}>
                  Track Status
                </button>
                <button className="btn-secondary" onClick={() => setView('home')}>
                  Return Home
                </button>
              </div>
            </div>
          </section>
        )}

        {/* VIEW: ADMIN STAFF PORTAL */}
        {view === 'admin' && (
          <section className="section">
            <Dashboard />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer>
        <div className="container footer-grid">
          <div className="footer-col">
            <h4>Aura Care</h4>
            <p>Empowering life-long vitality through luxurious hospitality-oriented medical practices.</p>
          </div>
          <div className="footer-col">
            <h4>Visit Us</h4>
            <p>100 Serenity Blvd, Suite A</p>
            <p>Geneva, Switzerland</p>
          </div>
          <div className="footer-col">
            <h4>Reservations</h4>
            <p>Mon - Fri: 8:00 AM - 6:00 PM</p>
            <p>Saturday: 9:00 AM - 3:00 PM</p>
          </div>
        </div>
        <div className="footer-bottom container">
          &copy; {new Date().getFullYear()} Aura Care. All rights reserved. Designed for healing.
        </div>
      </footer>
    </div>
  );
}
