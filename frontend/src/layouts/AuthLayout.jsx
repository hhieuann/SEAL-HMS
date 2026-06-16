import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import './Auth.css';
import fptLogo from '../assets/fptLogo.png';

const AuthLayout = () => {
  return (
    <div className="auth-container">
      <header className="fpt-topbar">
        <Link to="/" className="logo" style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Anchor size={24} /></div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="logo-text" style={{ color: 'white' }}>SEAL<span style={{ color: 'white' }}>.</span></span>
            <img
                src={fptLogo}
                alt="FPT Logo"
                style={{
                  height: '100px',
                  objectFit: 'contain',
                  marginLeft: '12px',
                  marginTop: '-30px',
                  marginBottom: '-30px'
                }}
              />
          </div>
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
