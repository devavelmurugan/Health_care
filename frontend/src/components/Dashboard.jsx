import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth states
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const fetchAppointments = () => {
    if (!token) return;
    setLoading(true);
    setError('');
    
    fetch('http://localhost:5000/api/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          // Token expired or invalid
          handleLogout();
          throw new Error('Session expired. Please log in again.');
        }
        if (!res.ok) throw new Error('Failed to load portal records');
        return res.json();
      })
      .then(data => setAppointments(data.reverse()))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setUsername('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setAuthSuccess('Account created successfully! You can now log in.');
      setIsRegistering(false);
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setAppointments([]);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status.');
      }

      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert(err.message);
    }
  };

  // Login / Register Interface
  if (!token) {
    return (
      <div className="glass-panel" style={{ maxWidth: '450px', margin: '4rem auto', padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', color: '#bf9f62', marginBottom: '1rem' }}>🛡️</div>
        <h2 style={{ color: '#2d4c3f', marginBottom: '0.5rem' }}>
          {isRegistering ? 'Create Admin Account' : 'Staff Authentication'}
        </h2>
        <p style={{ color: '#53605a', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {isRegistering 
            ? 'Set up security credentials to manage outpatient reservations.'
            : 'Access clinical reservation boards and patient logs.'}
        </p>

        {authError && (
          <div style={{ color: '#721c24', background: '#f8d7da', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {authError}
          </div>
        )}

        {authSuccess && (
          <div style={{ color: '#155724', background: '#d4edda', padding: '0.8rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {authSuccess}
          </div>
        )}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="admin"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-book" style={{ width: '100%', marginTop: '1rem' }}>
            {isRegistering ? 'Register Admin' : 'Access Portal'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {isRegistering ? (
            <p style={{ fontSize: '0.9rem', color: '#53605a' }}>
              Already registered?{' '}
              <span 
                style={{ color: '#bf9f62', cursor: 'pointer', fontWeight: '500' }} 
                onClick={() => { setIsRegistering(false); setAuthError(''); }}
              >
                Sign In
              </span>
            </p>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#53605a' }}>
              First time setup?{' '}
              <span 
                style={{ color: '#bf9f62', cursor: 'pointer', fontWeight: '500' }} 
                onClick={() => { setIsRegistering(true); setAuthError(''); }}
              >
                Create Credentials
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Interface
  return (
    <div className="glass-panel" style={{ padding: '3rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#2d4c3f' }}>Reception & Care Coordination Portal</h2>
          <span style={{ fontSize: '0.85rem', color: '#bf9f62', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Authorized Session Active (JWT Protected)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={fetchAppointments}>Refresh Records</button>
          <button className="btn-secondary" style={{ borderColor: '#721c24', color: '#721c24' }} onClick={handleLogout}>
            Logout & Lock
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#721c24', background: '#f8d7da', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#53605a' }}>Syncing patient records...</p>}

      {!loading && appointments.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#53605a', padding: '3rem 0' }}>
          <p>No appointment records found in the database.</p>
        </div>
      ) : (
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Patient</th>
                <th>Clinician</th>
                <th>Date & Time</th>
                <th>Current Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: '600', color: '#bf9f62' }}>{app.reference}</td>
                  <td>
                    <div><strong>{app.patientName}</strong></div>
                    <div style={{ fontSize: '0.8rem', color: '#53605a' }}>{app.patientEmail}</div>
                    <div style={{ fontSize: '0.8rem', color: '#53605a' }}>{app.patientPhone}</div>
                  </td>
                  <td>{app.doctorName}</td>
                  <td>{app.date} @ {app.timeSlot}</td>
                  <td>
                    <span className={`status-badge ${app.status.toLowerCase().replace(' ', '-')}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      <option value="Requested">Requested</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked-In">Checked-In</option>
                      <option value="In Consultation">In Consultation</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
