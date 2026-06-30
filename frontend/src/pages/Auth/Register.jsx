import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/auth';

const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '4px 8px', fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
      <AlertCircle size={13} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
};

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const errBorder = { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 2px rgba(239,68,68,0.15)' };

  const validate = () => {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const fptEmail = document.getElementById('fptEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const studentId = document.getElementById('studentId').value.trim();
    const campus = document.getElementById('campus').value;

    const errs = {};

    if (!firstName) errs.firstName = 'First Name is required.';
    if (!lastName) errs.lastName = 'Last Name is required.';

    if (!fptEmail) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fptEmail)) {
      errs.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!studentId) {
      errs.studentId = 'Student ID is required.';
    } else if (!/^SE\d{6}$/i.test(studentId)) {
      errs.studentId = 'Must follow format SEXXXXXX (e.g. SE204911).';
    }

    if (!campus) errs.campus = 'Please select a campus.';

    if (!proofFile) errs.proof = 'Please upload your Student ID or FAP Screenshot.';

    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const fptEmail = document.getElementById('fptEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const studentId = document.getElementById('studentId').value.trim();
    const campus = document.getElementById('campus').value;

    setIsSubmitting(true);
    try {
      await authApi.register(fptEmail, password, 'STUDENT', studentId, firstName, lastName, campus);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => { navigate('/login'); }, 1500);
    } catch (err) {
      console.error('Registration Error:', err);
      const errorDetail = err.response?.data?.message || err.message || JSON.stringify(err);
      setError(`Registration failed: ${errorDetail}`);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      setFieldErrors(prev => { const n = { ...prev }; delete n.proof; return n; });
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => setProofPreview(event.target.result);
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  return (
    <div className="auth-card glass-panel animate-fade-in">
      <h2>Registration</h2>
      <p className="auth-subtitle">Join the internal SEAL ecosystem</p>
      
      {/* Global Error (from server) */}
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
      
      <form onSubmit={handleRegister} className="auth-form" noValidate>
        <div className="form-row">
          <div style={{ flex: 1 }}>
            <div className="form-floating">
              <input type="text" id="firstName" placeholder=" " style={fieldErrors.firstName ? errBorder : {}} onChange={() => setFieldErrors(p => { const n={...p}; delete n.firstName; return n; })} />
              <label htmlFor="firstName">First Name *</label>
            </div>
            <FieldError message={fieldErrors.firstName} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-floating">
              <input type="text" id="lastName" placeholder=" " style={fieldErrors.lastName ? errBorder : {}} onChange={() => setFieldErrors(p => { const n={...p}; delete n.lastName; return n; })} />
              <label htmlFor="lastName">Last Name *</label>
            </div>
            <FieldError message={fieldErrors.lastName} />
          </div>
        </div>

        <div>
          <div className="form-floating">
            <input type="text" id="fptEmail" placeholder=" " style={fieldErrors.email ? errBorder : {}} onChange={() => setFieldErrors(p => { const n={...p}; delete n.email; return n; })} />
            <label htmlFor="fptEmail">Email Address *</label>
          </div>
          <FieldError message={fieldErrors.email} />
        </div>

        <div>
          <div className="form-floating">
            <input type="password" id="regPassword" placeholder=" " style={fieldErrors.password ? errBorder : {}} onChange={() => setFieldErrors(p => { const n={...p}; delete n.password; return n; })} />
            <label htmlFor="regPassword">Password (Min 6 chars) *</label>
          </div>
          <FieldError message={fieldErrors.password} />
        </div>

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="form-floating">
              <input type="text" id="studentId" placeholder=" " style={fieldErrors.studentId ? errBorder : {}} onChange={() => setFieldErrors(p => { const n={...p}; delete n.studentId; return n; })} />
              <label htmlFor="studentId">Student ID *</label>
            </div>
            <FieldError message={fieldErrors.studentId} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-floating">
              <select id="campus" defaultValue="" className="form-select" style={{ width: '100%', padding: '20px 16px 8px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer', ...(fieldErrors.campus ? errBorder : {}) }} onChange={() => setFieldErrors(p => { const n={...p}; delete n.campus; return n; })}>
                <option value="" disabled style={{ color: 'black' }}></option>
                <option value="Hanoi" style={{ color: 'black' }}>Hanoi (Hoa Lac)</option>
                <option value="Ho Chi Minh" style={{ color: 'black' }}>Ho Chi Minh</option>
                <option value="Da Nang" style={{ color: 'black' }}>Da Nang</option>
                <option value="Can Tho" style={{ color: 'black' }}>Can Tho</option>
                <option value="Quy Nhon" style={{ color: 'black' }}>Quy Nhon</option>
              </select>
              <label htmlFor="campus">Campus *</label>
            </div>
            <FieldError message={fieldErrors.campus} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Verification Proof (Student ID or FAP Screenshot) *</label>
          <div style={{ padding: proofPreview ? '10px' : '20px', border: `1px dashed ${fieldErrors.proof ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '8px', background: fieldErrors.proof ? 'rgba(239,68,68,0.03)' : 'var(--bg-subtle)', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, background 0.2s' }}>
            <input type="file" id="proof" accept="image/*,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            
            {proofPreview ? (
              <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                <img src={proofPreview} alt="Proof preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                <label htmlFor="proof" style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  Change File
                </label>
              </div>
            ) : proofFile ? (
               <div style={{ padding: '20px' }}>
                 <div style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>{proofFile.name}</div>
                 <label htmlFor="proof" style={{ cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Change File</label>
               </div>
            ) : (
              <>
                <label htmlFor="proof" style={{ cursor: 'pointer', color: fieldErrors.proof ? '#ef4444' : 'var(--primary)', fontWeight: '600', display: 'inline-block' }}>
                  Click to upload file
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Accepted formats: JPG, PNG, PDF (Max 5MB)</div>
              </>
            )}
          </div>
          <FieldError message={fieldErrors.proof} />
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
