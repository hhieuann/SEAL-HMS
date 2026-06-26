import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/auth';

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Nếu chưa chọn file ảnh (bỏ qua cho dễ test)
    // if (!proofFile) {
    //   setError('Please upload your Student ID or FAP Screenshot.');
    //   setShaking(true);
    //   setTimeout(() => setShaking(false), 500);
    //   return;
    // }

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const fptEmail = document.getElementById('fptEmail').value;
    const password = document.getElementById('regPassword').value;
    const studentId = document.getElementById('studentId').value;
    const campus = document.getElementById('campus').value;

    setIsSubmitting(true);
    try {
      // 1. Create account (needs studentCode)
      await authApi.register(fptEmail, password, 'STUDENT', studentId);
      
      // 2. Login to get token for profile creation
      await authApi.login(fptEmail, password);
      
      // 3. Create student profile
      const { default: apiClient } = await import('../../api/apiClient');
      await apiClient.post('/api/v1/students', { firstName, lastName, campus });
      
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        authApi.logout(); // Clears state and redirects to /login
      }, 1500);
    } catch (err) {
      console.error('Registration Error:', err);
      const errorDetail = err.response?.data?.message || err.message || JSON.stringify(err);
      const debugUrl = err.config ? `${err.config.baseURL || ''}${err.config.url}` : 'unknown url';
      setError(`Registration failed: ${errorDetail} (${debugUrl})`);
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
          <div className="form-floating">
            <input type="text" id="firstName" placeholder=" " required />
            <label htmlFor="firstName">First Name</label>
          </div>
          <div className="form-floating">
            <input type="text" id="lastName" placeholder=" " required />
            <label htmlFor="lastName">Last Name</label>
          </div>
        </div>
        <div className="form-floating">
          <input type="email" id="fptEmail" placeholder=" " required style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
          <label htmlFor="fptEmail">Email Address</label>
        </div>
        <div className="form-floating">
          <input type="password" id="regPassword" placeholder=" " required minLength="6" />
          <label htmlFor="regPassword">Password (Min 6 chars)</label>
        </div>
        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-floating">
            <input type="text" id="studentId" placeholder=" " required />
            <label htmlFor="studentId">Student ID</label>
          </div>
          <div className="form-floating">
            <select id="campus" required defaultValue="" className="form-select" style={{ width: '100%', padding: '20px 16px 8px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
              <option value="" disabled style={{ color: 'black' }}></option>
              <option value="Hanoi" style={{ color: 'black' }}>Hanoi (Hoa Lac)</option>
              <option value="Ho Chi Minh" style={{ color: 'black' }}>Ho Chi Minh</option>
              <option value="Da Nang" style={{ color: 'black' }}>Da Nang</option>
              <option value="Can Tho" style={{ color: 'black' }}>Can Tho</option>
              <option value="Quy Nhon" style={{ color: 'black' }}>Quy Nhon</option>
            </select>
            <label htmlFor="campus">Campus</label>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Verification Proof (Student ID or FAP Screenshot)</label>
          <div style={{ padding: proofPreview ? '10px' : '20px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-subtle)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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
                <label htmlFor="proof" style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', display: 'inline-block' }}>
                  Click to upload file
                </label>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>Accepted formats: JPG, PNG, PDF (Max 5MB)</div>
              </>
            )}
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
