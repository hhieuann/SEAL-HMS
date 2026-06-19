import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Code, LogOut, Bell, Shield, BookOpen, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/auth';
import './JudgeLayout.css';

const JudgeLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authApi.logout();
  };

  const [activeContext, setActiveContext] = React.useState(() => {
    const saved = localStorage.getItem('expertContext');
    return saved ? JSON.parse(saved) : { event: 'SEAL Hackathon Spring 2026', role: 'Judge', track: 'Track B - Medical Knowledge RAG' };
  });

  const [currentUser] = React.useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : { name: 'Alan Turing', avatar: 'https://ui-avatars.com/api/?name=Alan+Turing&background=10b981&color=fff' };
  });

  return (
    <div className="judge-app-container">
      <header className="judge-topbar fpt-topbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="judge-logo" onClick={() => navigate('/expert/dashboard')} title="Back to Dashboard">
            <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)' }}><Code size={20} /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="logo-text" style={{ fontSize: '18px', lineHeight: '1', color: 'white' }}>SEAL<span className="highlight" style={{ color: 'white' }}>.</span></span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Hackathon</span>
            </div>
            <div style={{ paddingLeft: '16px', marginLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
              Judge Panel
            </div>
          </div>

          <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/expert/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
            >
              <ArrowLeft size={16} />
              <span style={{ fontSize: '13px' }}>Dashboard</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Context</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{activeContext.event}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', color: 'white' }}>
                {activeContext.track}
              </div>
            </div>
          </div>
        </div>

        <nav className="judge-nav">
          <NavLink to="/judge/panel" className={({ isActive }) => `judge-nav-link ${isActive ? 'active' : ''}`} end>
            <Shield size={18} /> Evaluation
          </NavLink>
          <NavLink to="/judge/history" className={({ isActive }) => `judge-nav-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={18} /> Scoring History
          </NavLink>
          <NavLink to="/judge/announcements" className={({ isActive }) => `judge-nav-link ${isActive ? 'active' : ''}`}>
            <Bell size={18} /> Announcements
            <span style={{ background: 'var(--danger)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>1</span>
          </NavLink>
        </nav>

        <div className="judge-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginRight: '16px' }}>
            <span>Keyboard:</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'white' }}>←/→</span> Next/Prev
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: 'white' }}>S</span> Submit
          </div>
          
          <div className="judge-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '24px', color: 'white' }}>
            <img src={currentUser.avatar} alt="Avatar" className="avatar" style={{ width: '32px', height: '32px', border: 'none' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.name}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Expert Judge</div>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Logout" style={{ marginLeft: '8px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="judge-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default JudgeLayout;
