import { Outlet, Link } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import './Auth.css';

const AuthLayout = () => {
  return (
    <div className="auth-container">
      <header className="fpt-topbar">
        <Link to="/" className="logo" style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)' }}><Anchor size={24} /></div>
          <span className="logo-text" style={{ color: 'white' }}>SEAL<span style={{ color: 'white' }}>.</span></span>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }}></div>
          <img src="/src/assets/FptLogo.png" alt="FPT" style={{ height: '90px', objectFit: 'contain' }} />
        </Link>
        <div className="topbar-actions" style={{ paddingRight: '24px' }}>
          <Link to="/#about" style={{ color: 'white', fontWeight: 500, marginRight: '16px' }}>About</Link>
          <Link to="/#events" style={{ color: 'white', fontWeight: 500, marginRight: '16px' }}>Events</Link>
          <Link to="/login" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>Login</Link>
          <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: 'var(--primary)' }}>Sign Up</Link>
        </div>
      </header>
      <div className="auth-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
