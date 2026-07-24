import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Code, LayoutGrid, Calendar, Users, GitMerge, ArrowRightLeft, BarChart2, Bell, Plus, LogOut, Megaphone, AlertTriangle, UserCheck, X, ArrowLeft, Terminal, Shuffle, Edit2, Award } from 'lucide-react';
import { authApi } from '../api/auth';
import apiClient from '../api/apiClient';

import './AdminLayout.css';

const calculateTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const eventMatch = location.pathname.match(/\/admin\/event\/([^\/]+)/);
  const eventId = eventMatch ? eventMatch[1] : null;

  const [bellOpen, setBellOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const unreadCount = alerts.filter(a => a.unread).length;
  
  const [eventName, setEventName] = useState(null);
  
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('Administrator');
  
  React.useEffect(() => {
    try {
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Administrator';
      if (role) setUserRole(role);
      setUserName(name);
    } catch(e) {}
  }, []);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      if (localStorage.getItem('userRole') === 'STAFF') return;
      try {
        const res = await apiClient.get('/api/v1/audit-logs?limit=5');
        const logs = res.data?.data || res.data || [];
        const formattedAlerts = logs.map(log => {
          let icon = <Bell size={15} />;
          let color = 'var(--primary)';
          let bg = 'rgba(59,130,246,0.12)';
          let title = log.action;
          
          if (log.action.includes('CREATED') || log.action.includes('SUBMITTED')) {
            color = 'var(--success)';
            bg = 'rgba(16,185,129,0.12)';
            icon = <Plus size={15} />;
          } else if (log.action.includes('DELETED') || log.action.includes('LATE') || log.action.includes('VIOLATION')) {
            color = 'var(--danger)';
            bg = 'rgba(239,68,68,0.12)';
            icon = <AlertTriangle size={15} />;
          } else if (log.action.includes('UPDATED') || log.action.includes('CHANGED')) {
            color = 'var(--warning)';
            bg = 'rgba(245,158,11,0.12)';
            icon = <Edit2 size={15} />;
          }

          return {
            id: log.id,
            icon, color, bg,
            title: log.action.replace(/_/g, ' '),
            sub: log.detail || `${log.entityType} ${log.entityId || ''}`,
            time: calculateTimeAgo(log.createdAt),
            link: '/admin/activity-log',
            unread: true,
            ts: new Date(log.createdAt).getTime()
          };
        });

        const annRes = await apiClient.get('/api/v1/announcements');
        const anns = annRes.data?.data || annRes.data || [];
        const formattedAnns = anns.slice(0, 5).map(ann => ({
          id: `ann_${ann.id}`,
          icon: <Megaphone size={15} />,
          color: 'var(--primary)',
          bg: 'rgba(59,130,246,0.12)',
          title: `Announcement: ${ann.title}`,
          sub: ann.eventName || 'Global',
          time: calculateTimeAgo(ann.createdAt),
          link: ann.eventId ? `/admin/event/${ann.eventId}/broadcast` : '/admin/dashboard',
          unread: true,
          ts: new Date(ann.createdAt).getTime()
        }));

        const merged = [...formattedAlerts, ...formattedAnns].sort((a, b) => b.ts - a.ts).slice(0, 8);
        setAlerts(merged);
      } catch (err) {
        console.error('Failed to fetch system alerts', err);
      }
    };
    fetchAlerts();
  }, []);

  React.useEffect(() => {
    if (eventId) {
      // Dynamically load eventService to avoid top-level import issues if any
      import('../api/eventService.js').then(({ eventService }) => {
        eventService.getEventDetails(eventId).then(res => {
          if (res.data && res.data.name) {
            setEventName(res.data.name);
          }
        }).catch(err => console.error('Failed to load event name for layout', err));
      });
    } else {
      setEventName(null);
    }
  }, [eventId, location.pathname]); // Re-fetch if pathname changes (e.g. after edit save)

  const markRead = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, unread: false } : a));
  const dismiss = (id, e) => { e.stopPropagation(); setAlerts(prev => prev.filter(a => a.id !== id)); };

  // Breadcrumbs generation
  const pathnames = location.pathname.split('/').filter(x => x);
  const currentPath = pathnames[pathnames.length - 1] || 'Dashboard';
  
  const displayEventName = eventName || (eventId ? `Event: ${eventId.toUpperCase()}` : '');

  return (
    <div className="app-container">
      <header className="fpt-topbar">
        <div className="logo" style={{ color: 'white', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)' }}><Code size={24} /></div>
          <span className="logo-text">SEAL<span style={{ color: 'white' }}>.</span></span>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }}></div>
          <img src="/src/assets/FptLogo.png" alt="FPT" style={{ height: '90px', objectFit: 'contain' }} />
        </div>

        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginLeft: '40px', flex: 1 }}>
          <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white' }}>SEAL Admin</span>
          <span>/</span>
          {eventId ? (
            <>
              <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', color: 'white', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayEventName}</span>
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
          {userRole !== 'STAFF' && (
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
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', marginLeft: '8px', color: 'white' }}>
            <img src={(() => {
              try {
                const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
                if (u.avatarUrl) return u.avatarUrl.startsWith('http') ? u.avatarUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}`;
              } catch(e) {}
              return "https://ui-avatars.com/api/?name=Admin+SEAL&background=fff&color=F26F21";
            })()} alt="Admin" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
            <div style={{ textAlign: 'left', minWidth: '90px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{userRole === 'STAFF' ? 'Event Staff' : 'Administrator'}</div>
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
          {!eventId && userRole !== 'STAFF' && (
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
                <NavLink to="/admin/chapters" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Award size={20} /><span>Chapter Management</span>
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
                  onClick={() => navigate(userRole === 'STAFF' ? '/expert/dashboard' : '/admin/dashboard')} 
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
                  <ArrowLeft size={16} /> {userRole === 'STAFF' ? 'Back to Portal' : 'Back to Global'}
                </button>
              </div>

              <div className="nav-section">
                <p className="nav-section-title" style={{ color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayEventName.toUpperCase()}
                </p>
                <NavLink to={`/admin/event/${eventId}/dashboard`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                  <BarChart2 size={20} /><span>Event Dashboard</span>
                </NavLink>
                {userRole === 'ADMIN' && (
                  <NavLink to={`/admin/event/${eventId}/staff`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserCheck size={20} /><span>Staff Management</span>
                  </NavLink>
                )}
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
                {userRole === 'ADMIN' && (
                  <NavLink to={`/admin/event/${eventId}/edit`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Edit2 size={20} /><span>Edit Event</span>
                  </NavLink>
                )}

                <NavLink to={`/admin/event/${eventId}/transition`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <ArrowRightLeft size={20} /><span>Round Transition</span>
                </NavLink>
                <NavLink to={`/admin/event/${eventId}/analytics`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <BarChart2 size={20} /><span>System Audit Log</span>
                </NavLink>
              </div>


              <div className="nav-section">
                <p className="nav-section-title">COMMUNICATION</p>
                {userRole === 'STAFF' && (
                  <NavLink to={`/admin/event/${eventId}/notifications`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Bell size={20} /><span>Inbox</span>
                  </NavLink>
                )}
                <NavLink to={`/admin/event/${eventId}/broadcast`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Megaphone size={20} /><span>Broadcast Center</span>
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
