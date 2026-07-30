import React, { useState, useEffect } from 'react';

export default function BookingWizard({ onBookingSuccess }) {
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
  ];

  useEffect(() => {
    // Fetch doctors from backend
    fetch('http://localhost:5000/api/doctors')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch clinicians');
        return res.json();
      })
      .then(data => setDoctors(data))
      .catch(err => setError(err.message));
  }, []);

  const handleInfoChange = (e) => {
    setPatientInfo({ ...patientInfo, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && !selectedDoctor) {
      setError('Please select a doctor to continue.');
      return;
    }
    if (step === 2 && (!date || !timeSlot)) {
      setError('Please choose both a date and a preferred time slot.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!patientInfo.name || !patientInfo.email || !patientInfo.phone) {
      setError('Please fill in all contact information.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          patientName: patientInfo.name,
          patientEmail: patientInfo.email,
          patientPhone: patientInfo.phone,
          date,
          timeSlot,
          notes: patientInfo.notes
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Booking request failed.');
      }

      const result = await response.json();
      onBookingSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-wizard glass-panel">
      <h2 style={{ textAlign: 'center', color: '#2d4c3f', marginBottom: '1.5rem' }}>
        Reserve Your consultation
      </h2>

      {/* Step Progress Nodes */}
      <div className="wizard-steps">
        <div className={`step-node ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">1</div>
          <span className="step-label">Clinician</span>
        </div>
        <div className={`step-node ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">2</div>
          <span className="step-label">Time & Date</span>
        </div>
        <div className={`step-node ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
          <div className="step-circle">3</div>
          <span className="step-label">Patient Details</span>
        </div>
      </div>

      {error && (
        <div style={{ color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Step 1: Doctor Selection */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d4c3f' }}>Select a Wellness Professional</h3>
          <div className="doctors-grid">
            {doctors.map(doc => (
              <div
                key={doc.id}
                className={`doctor-card glass-panel ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
                onClick={() => setSelectedDoctor(doc)}
              >
                <img src={doc.image} alt={doc.name} className="doctor-img" />
                <div className="doctor-info">
                  <h4>{doc.name}</h4>
                  <div className="doctor-specialty">{doc.specialty}</div>
                  <div className="doctor-rating">★ {doc.rating} / 5.0</div>
                  <p style={{ fontSize: '0.85rem', color: '#53605a' }}>{doc.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Slot Selection */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d4c3f' }}>Select Date & Preferred Time</h3>
          <div className="date-slot-picker">
            <div className="form-group">
              <label className="form-label">Consultation Date</label>
              <input
                type="date"
                className="input-date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: '1rem' }}>Available Slots</label>
              <div className="slots-container">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    className={`slot-btn ${timeSlot === slot ? 'selected' : ''}`}
                    onClick={() => setTimeSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Patient Info */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: '#2d4c3f' }}>Your Contact Details</h3>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Eleanor Vance"
              className="form-input"
              value={patientInfo.name}
              onChange={handleInfoChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="eleanor@domain.com"
              className="form-input"
              value={patientInfo.email}
              onChange={handleInfoChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 019-2834"
              className="form-input"
              value={patientInfo.phone}
              onChange={handleInfoChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Special Notes / Requests (Optional)</label>
            <textarea
              name="notes"
              rows="3"
              placeholder="Any physical symptoms or specific accommodation needs..."
              className="form-input"
              style={{ resize: 'none' }}
              value={patientInfo.notes}
              onChange={handleInfoChange}
            ></textarea>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="wizard-actions">
        {step > 1 ? (
          <button className="btn-secondary" onClick={handleBack}>
            Previous
          </button>
        ) : (
          <div />
        )}
        {step < 3 ? (
          <button className="btn-book" onClick={handleNext}>
            Continue
          </button>
        ) : (
          <button className="btn-book" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm Appointment'}
          </button>
        )}
      </div>
    </div>
  );
}
