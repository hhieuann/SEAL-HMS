import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Unhappy Case Simulation: Email contains "error" or "exist"
    if (e.target[2].value.includes('error') || e.target[2].value.includes('exist')) {
      setError('This FPT Email is already registered on the system.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/registration-success');
      }, 1500);
    }, 1000);
  };

  return (
    <div className="auth-card glass-panel animate-fade-in">
      <h2>Registration</h2>
      <p className="auth-subtitle">Join the internal SEAL ecosystem</p>
      
      {/* Error Message UI */}
      {error && (
        <div
          className={shaking ? 'shake' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', marginBottom: '20px',
            animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
          }}
        >
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
        </div>
      )}
      
      {/* Success Message UI */}
      {success && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '10px', marginBottom: '20px',
          }}
        >
          <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '500' }}>{success}</span>
        </div>
      )}
      
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" placeholder="John" defaultValue="Sarah" required />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" placeholder="Doe" defaultValue="Connor" required />
          </div>
        </div>
        <div className="form-group">
          <label>FPT Email Address</label>
          <input type="email" placeholder="example@fpt.edu.vn" defaultValue="sarah.connor@fpt.edu.vn" required pattern=".+@fpt\.edu\.vn" title="Must be a valid @fpt.edu.vn email" style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px', display: 'block' }}>* Only @fpt.edu.vn emails are allowed.</small>
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Create a strong password" defaultValue="password123" required />
        </div>
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label>Student ID</label>
            <input type="text" placeholder="e.g. SE160123" defaultValue="SE170999" required />
          </div>
          <div className="form-group">
            <label>Campus</label>
            <select required defaultValue="Hanoi" className="fpt-select" style={{ width: '100%', padding: '12px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
              <option value="" style={{ color: 'black' }}>Select Campus</option>
              <option value="Hanoi" style={{ color: 'black' }}>Hanoi (Hoa Lac)</option>
              <option value="Ho Chi Minh" style={{ color: 'black' }}>Ho Chi Minh</option>
              <option value="Da Nang" style={{ color: 'black' }}>Da Nang</option>
              <option value="Can Tho" style={{ color: 'black' }}>Can Tho</option>
              <option value="Quy Nhon" style={{ color: 'black' }}>Quy Nhon</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Verification Proof (Student ID or FAP Screenshot)</label>
          <div style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-subtle)', textAlign: 'center' }}>
            <input type="file" id="proof" accept="image/*,.pdf" required style={{ display: 'none' }} />
            <label htmlFor="proof" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', display: 'inline-block' }}>
              Click to upload file
            </label>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Accepted formats: JPG, PNG, PDF (Max 5MB)</div>
          </div>
        </div>
        <button type="submit" className="btn btn-primary full-width mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account? <Link to="/login" className="text-primary">Log in</Link>
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default Register;
