import React, { useState } from 'react';

export default function StatusTracker() {
  const [reference, setReference] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statusLevels = [
    { key: 'Requested', title: 'Request Received', desc: 'Your request is in our system. A coordinator will review scheduling details shortly.' },
    { key: 'Confirmed', title: 'Consultation Confirmed', desc: 'Your appointment is confirmed. The physician has reserved your slot.' },
    { key: 'Checked-In', title: 'Arrived & Checked In', desc: 'You have checked in at reception. Please make yourself comfortable in the lounge.' },
    { key: 'In Consultation', title: 'In Consultation', desc: 'Your session with the specialist is currently underway.' },
    { key: 'Completed', title: 'Visit Completed', desc: 'Your appointment is completed. Wellness insights and billing details are archived.' }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError('');
    setAppointment(null);

    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${reference}`);
      if (!response.ok) {
        throw new Error('No appointment found matching this reference code.');
      }
      const data = await response.json();
      setAppointment(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (stepKey) => {
    if (!appointment) return '';
    if (appointment.status === 'Cancelled') return 'cancelled';

    const currentStatusIndex = statusLevels.findIndex(s => s.key === appointment.status);
    const stepIndex = statusLevels.findIndex(s => s.key === stepKey);

    if (stepIndex < currentStatusIndex) return 'completed';
    if (stepIndex === currentStatusIndex) return 'active';
    return '';
  };

  return (
    <div className="tracking-container glass-panel">
      <h2 style={{ textAlign: 'center', color: '#2d4c3f', marginBottom: '2rem' }}>
        Track Appointment Status
      </h2>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Enter Booking Reference (e.g. AC-X5Y2Z9)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? 'Searching...' : 'Locate'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {appointment && (
        <div>
          {/* Brief Card Summary */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#2d4c3f' }}>{appointment.patientName}</h3>
              <span className={`status-badge ${appointment.status.toLowerCase().replace(' ', '-')}`}>
                {appointment.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem', color: '#53605a' }}>
              <div><strong>Practitioner:</strong> {appointment.doctorName} ({appointment.doctorSpecialty})</div>
              <div><strong>Scheduled:</strong> {appointment.date} at {appointment.timeSlot}</div>
              <div><strong>Reference ID:</strong> {appointment.reference}</div>
            </div>
          </div>

          {/* Timeline Tracking */}
          {appointment.status === 'Cancelled' ? (
            <div style={{ color: '#721c24', background: '#f8d7da', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
              <h4>Appointment Cancelled</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>This appointment has been cancelled. Please book another session or contact us directly.</p>
            </div>
          ) : (
            <div className="timeline">
              {statusLevels.map(step => (
                <div key={step.key} className={`timeline-item ${getStepClass(step.key)}`}>
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                    {appointment.status === step.key && (
                      <span className="timeline-time">Current Stage</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
