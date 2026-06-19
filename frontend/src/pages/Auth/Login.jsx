import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authApi } from '../../api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('sarah');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = {
    admin: { name: 'System Admin', type: 'admin' },
    participant: { name: 'Participant (Team Null)', type: 'participant' },
    sarah: { name: 'Sarah Nguyen', type: 'expert', roles: ['Judge', 'Mentor'], avatar: 'https://ui-avatars.com/api/?name=Sarah+Nguyen&background=14b8a6&color=fff' },
    alan: { name: 'Alan Turing', type: 'expert', roles: ['Judge'], avatar: 'https://ui-avatars.com/api/?name=Alan+Turing&background=10b981&color=fff' },
    david: { name: 'David Kim', type: 'expert', roles: ['Mentor'], avatar: 'https://ui-avatars.com/api/?name=David+Kim&background=8b5cf6&color=fff' },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const email = e.target[0].value;
    const password = e.target[1].value;

    setIsSubmitting(true);

    try {
      // Call real backend API
      const { role } = await authApi.login(email, password);
      
      // Giả lập lưu currentUser để tương thích giao diện cũ
      const user = accounts[accountId] || accounts['participant'];
      localStorage.setItem('currentUser', JSON.stringify(user));

      // Navigate based on actual role returned from Spring Boot
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'JUDGE' || role === 'MENTOR') navigate('/expert/dashboard');
      else navigate('/participant');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card glass-panel animate-fade-in">
      <h2>Welcome Back</h2>
      <p className="auth-subtitle">Login to your SEAL Hackathon account</p>

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
      
      <form onSubmit={handleLogin} className="auth-form">
        <div className="form-floating">
          <input type="email" id="email" placeholder=" " style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
          <label htmlFor="email">Email Address</label>
        </div>
        <div className="form-floating">
          <input type="password" id="password" placeholder=" " />
          <label htmlFor="password">Password</label>
        </div>
        <button type="submit" className="btn btn-primary full-width mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Authenticating...' : 'Login'}
        </button>
      </form>

      <p className="auth-footer-text">
        Don't have an account? <Link to="/register" className="text-primary">Sign up</Link>
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

export default Login;
