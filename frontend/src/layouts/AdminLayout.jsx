import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Code, LayoutGrid, Calendar, Users, GitMerge, Scale, ArrowRightLeft, BarChart2, Search, Bell, Plus, LogOut, Megaphone, AlertTriangle, UserCheck, GitPullRequest, X, ArrowLeft, Terminal, Shuffle, Target } from 'lucide-react';
import { authApi } from '../api/auth';

import './AdminLayout.css';

const systemAlerts = [
  { id: 1, icon: <UserCheck size={15} />, color: 'var(--primary)', bg: 'rgba(59,130,246,0.12)', title: '4 accounts pending approval', sub: 'Including 1 Guest Judge request', time: '10 min ago', link: '/admin/accounts', unread: true },
  { id: 2, icon: <GitPullRequest size={15} />, color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', title: 'Tie-breaker needed at Round 1', sub: 'NullPointerException & CircuitCare — 89.5 pts', time: '30 min ago', link: '/admin/transition', unread: true },
  { id: 3, icon: <AlertTriangle size={15} />, color: 'var(--danger)', bg: 'rgba(239,68,68,0.12)', title: 'Violation report submitted', sub: 'DataSculpt — plagiarism flag by Judge Sarah', time: '2 hours ago', link: '/admin/courtroom', unread: true },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const eventMatch = location.pathname.match(/\/admin\/event\/([^\/]+)/);
  const eventId = eventMatch ? eventMatch[1] : null;

  const [bellOpen, setBellOpen] = useState(false);
  const [alerts, setAlerts] = useState(systemAlerts);
  const unreadCount = alerts.filter(a => a.unread).length;

  const markRead = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, unread: false } : a));
  const dismiss = (id, e) => { e.stopPropagation(); setAlerts(prev => prev.filter(a => a.id !== id)); };

  // Breadcrumbs generation
  const pathnames = location.pathname.split('/').filter(x => x);
  const currentPath = pathnames[pathnames.length - 1] || 'Dashboard';

  return (
    <div className="app-container">
      <header className="fpt-topbar">
        <div className="logo" style={{ color: 'white', paddingLeft: '24px' }}>
          <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)' }}><Code size={24} /></div>
          <span className="logo-text">SEAL<span style={{ color: 'white' }}>.</span></span>
        </div>

        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginLeft: '40px', flex: 1 }}>
          <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white' }}>SEAL Admin</span>
          <span>/</span>
          {eventId ? (
            <>
              <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white' }}>Event: {eventId.toUpperCase()}</span>
              <span>/</span>
              <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '6px', textTransform: 'capitalize', color: 'white' }}>{currentPath}</span>
            </>
          ) : (
            <>
              <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white' }}>Global Config</span>
              <span>/</span>
              <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.25)', borderRadius: '6px', textTransform: 'capitalize', color: 'white' }}>{currentPath}</span>
            </>
          )}
        </div>

        <div className="topbar-actions" style={{ paddingRight: '24px' }}>
          {/* Bell with dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="action-btn notification-btn"
              onClick={() => setBellOpen(o => !o)}
              style={{ color: 'white', background: bellOpen ? 'rgba(255,255,255,0.2)' : 'transparent', padding: '8px', borderRadius: '50%' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge" style={{ background: 'var(--danger)' }}>{unreadCount}</span>}
            </button>

            {bellOpen && (
              <>
                <div onClick={() => setBellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '360px', zIndex: 100, background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>System Alerts</span>
                    {unreadCount > 0 && (
                      <button onClick={() => setAlerts(prev => prev.map(a => ({ ...a, unread: false })))} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {alerts.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      🎉 No pending alerts
                    </div>
                  ) : alerts.map(alert => (
                    <div key={alert.id}
                      onClick={() => { markRead(alert.id); setBellOpen(false); navigate(alert.link); }}
                      style={{ padding: '14px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', background: alert.unread ? 'var(--bg-subtle)' : 'transparent', borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)', position: 'relative' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = alert.unread ? 'var(--bg-subtle)' : 'transparent'}
                    >
                      {alert.unread && <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
                      <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px', background: alert.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: alert.color }}>
                        {alert.icon}
                      </div>
                      <div style={{ flex: 1, color: 'var(--text-primary)' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{alert.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{alert.sub}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{alert.time}</div>
                      </div>
                      <button onClick={(e) => dismiss(alert.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px', display: 'flex' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  <div style={{ padding: '12px 20px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                    <button onClick={() => { setBellOpen(false); navigate('/admin/analytics'); }} style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View full audit log →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', marginLeft: '8px', color: 'white' }}>
            <img src="https://ui-avatars.com/api/?name=Admin+SEAL&background=fff&color=F26F21" alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
            <div style={{ textAlign: 'left', minWidth: '90px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>Coordinator</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Administrator</div>
            </div>
            <button className="btn-icon" onClick={() => authApi.logout()} title="Logout" style={{ marginLeft: '8px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">


        <nav className="sidebar-nav">
          {!eventId && (
            <>
              <div className="nav-section">
                <p className="nav-section-title">GLOBAL</p>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive && !eventId ? 'active' : ''}`}>
                  <LayoutGrid size={20} /><span>Global Dashboard</span>
                </NavLink>
              </div>

              <div className="nav-section">
                <p className="nav-section-title">PLATFORM CONFIG</p>
                <NavLink to="/admin/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Calendar size={20} /><span>Events & Rounds</span>
                </NavLink>
                <NavLink to="/admin/accounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <UserCheck size={20} /><span>Account Management</span>
                </NavLink>
                <NavLink to="/admin/activity-log" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Terminal size={20} /><span>System Audit Log</span>
                </NavLink>
              </div>
            </>
          )}

          {eventId && (
            <>
              <div className="nav-section" style={{ marginBottom: '12px' }}>
                <button 
                  onClick={() => navigate('/admin/dashboard')} 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'var(--bg-hover)', 
                    border: '1px solid var(--border-color)', 
                    padding: '8px 12px', 
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-active)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                >
                  <ArrowLeft size={16} /> Back to Global
                </button>
              </div>

              <div className="nav-section">
                <p className="nav-section-title" style={{ color: 'var(--primary)' }}>EVENT: {eventId.toUpperCase()}</p>
                <NavLink to={`/admin/event/${eventId}/dashboard`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                  <BarChart2 size={20} /><span>Event Dashboard</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/teams`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={20} /><span>Performing Teams</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/assignments`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <GitMerge size={20} /><span>Mentor & Judge Assign</span>
                </NavLink>
              </div>

              <div className="nav-section">
                <p className="nav-section-title">TOURNAMENT OPS</p>
                <NavLink to={`/admin/event/${eventId}/track-draw`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Shuffle size={20} /><span>Track Draw</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/criteria`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Target size={20} /><span>Criteria Manager</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/courtroom`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Scale size={20} /><span>The Courtroom</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/transition`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <ArrowRightLeft size={20} /><span>Round Transition</span>
                  <span style={{ marginLeft: 'auto', background: 'var(--warning)', color: '#000', fontSize: '10px', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>2</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/analytics`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <BarChart2 size={20} /><span>System Audit Log</span>
                </NavLink>
              </div>


              <div className="nav-section">
                <p className="nav-section-title">COMMUNICATION</p>
                <NavLink to={`/admin/event/${eventId}/broadcast`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Megaphone size={20} /><span>Announcements</span>
                </NavLink>
              </div>
            </>
          )}
        </nav>


        </aside>

        <main className="main-content">
          <div className="page-content" style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
