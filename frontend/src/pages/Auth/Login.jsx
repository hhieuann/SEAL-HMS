import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authApi, clearAuthSession } from '../../api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear stale session data from previous login (any role)
  useEffect(() => {
    clearAuthSession();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Đọc trực tiếp từ DOM (chống lỗi Autofill không kích hoạt onChange của React)
    // Và trim() khoảng trắng thừa (rất hay gặp khi lưu nhầm pass có dấu cách ở đuôi vào trình duyệt)
    const form = e.target;
    const cleanEmail = form.email?.value?.trim() || email.trim();
    const cleanPassword = form.password?.value?.trim() || password.trim();

    setIsSubmitting(true);

    try {
      // Call real backend API
      const { role, name: backendName, avatarUrl: backendAvatarUrl } = await authApi.login(cleanEmail, cleanPassword);
      
      // Build currentUser from real data only — no mock identities.
      const type = (role === 'ADMIN' || role === 'STAFF') ? 'admin'
        : (role === 'STUDENT') ? 'participant' : 'expert';
      const name = backendName || localStorage.getItem('userName') || cleanEmail;
      const avatarUrl = backendAvatarUrl || localStorage.getItem('avatarUrl')
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1F4E79&color=fff`;
      localStorage.setItem('currentUser', JSON.stringify({ name, type, avatarUrl, avatar: avatarUrl }));

      // Navigate based on actual role returned from Spring Boot
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'STAFF' || role === 'JUDGE' || role === 'MENTOR' || role === 'GUEST_JUDGE' || role === 'LECTURER') navigate('/expert/dashboard');
      else if (role === 'STUDENT') navigate('/participant/events');
      else navigate('/');
      
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;

      console.error('Login failed', {
        status,
        code: err.code,
        message: err.message,
        hasResponse: Boolean(err.response),
      });

      const fallbackMessage = status === 401
        ? 'Invalid email or password.'
        : status === 403
          ? 'Login request was blocked by the server configuration.'
          : 'Unable to sign in. Please try again.';
      setError(backendMessage || fallbackMessage);
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
          <input 
            type="email" 
            id="email" 
            name="email" 
            autoComplete="username" 
            placeholder=" " 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={error ? { borderColor: 'rgba(239,68,68,0.5)' } : {}} 
          />
          <label htmlFor="email">Email Address</label>
        </div>
        <div className="form-floating">
          <input 
            type="password" 
            id="password" 
            name="password" 
            autoComplete="current-password" 
            placeholder=" " 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
