import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

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

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const email = e.target[0].value;
    const password = e.target[1].value;

    // Fail Case Simulation: Incorrect password for demo account
    if (email === 'demo@seal.vn' && password !== 'demo1234') {
      setError('Invalid email or password. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    // Unhappy Case Simulation: If user explicitly types 'error' in email
    if (email.includes('error')) {
      setError('Invalid email or password. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const user = accounts[accountId];
      localStorage.setItem('currentUser', JSON.stringify(user));

      if (user.type === 'admin') navigate('/admin/dashboard');
      else if (user.type === 'expert') navigate('/expert/dashboard');
      else navigate('/participant');
      
      setIsSubmitting(false);
    }, 1000);
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
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" placeholder="demo@seal.vn" defaultValue="demo@seal.vn" style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" defaultValue="demo1234" />
        </div>
        <div className="form-group">
          <label>Simulate Account (Demo)</label>
          <select className="form-select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="sarah">Sarah Nguyen (Dual Role: Judge & Mentor)</option>
            <option value="alan">Alan Turing (Judge Only)</option>
            <option value="david">David Kim (Mentor Only)</option>
            <option value="admin">System Admin</option>
            <option value="participant">Participant (Team)</option>
          </select>
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
