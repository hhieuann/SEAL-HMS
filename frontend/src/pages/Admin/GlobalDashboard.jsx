import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Users, FolderKanban, ShieldCheck, ArrowRight, Activity, Code, Calendar, Server, Settings, Mail, UserPlus, Database, PieChart, CheckCircle2 } from 'lucide-react';
import './EventDashboard.css';

const GlobalDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    import('../../api/eventService.js').then(({ eventService }) => {
      eventService.getEvents().then(res => {
        setEvents(res.data || []);
      }).catch(err => console.error("Failed to load global events:", err));
    });
  }, []);

  const totalEvents = events.length;
  const totalUsers = events.reduce((sum, evt) => sum + ((evt.teams || 0) * 4) + (evt.judges || 0), 0);
  const totalSubmissions = 0;
  const activeExperts = events.reduce((sum, evt) => sum + (evt.judges || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Global Overview</h1>
          <p className="subtitle">Platform-wide statistics and active events</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-1"><Globe size={24} /></div>
          <div className="stat-details">
            <h3>Total Events Hosted</h3>
            <p className="stat-value">{totalEvents}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-2"><Users size={24} /></div>
          <div className="stat-details">
            <h3>Total Platform Users</h3>
            <p className="stat-value">{totalUsers}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-3"><FolderKanban size={24} /></div>
          <div className="stat-details">
            <h3>Total Submissions</h3>
            <p className="stat-value">{totalSubmissions}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-4"><ShieldCheck size={24} /></div>
          <div className="stat-details">
            <h3>Active Experts</h3>
            <p className="stat-value">{activeExperts}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '32px', gap: '24px', display: 'grid' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--primary)" /> Manage Events
              </h2>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/events/new')}>Create New Event</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 24px 24px 24px' }}>
              {events.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  No active events right now. Click "Create New Event" to get started!
                </div>
              ) : events.map((evt) => (
                <div 
                  key={evt.id} 
                  onClick={() => navigate(`/admin/event/${evt.id}/dashboard`)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border-color)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                      <Code size={24} />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                      <h3 style={{ fontSize: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {evt.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        {evt.status?.toLowerCase() === 'live' || evt.status?.toLowerCase() === 'ongoing' ? <span className="status-tag status-success">Live</span> : null}
                        {evt.status?.toLowerCase() === 'upcoming' || evt.status?.toLowerCase() === 'planned' ? <span className="status-tag status-warning">Upcoming</span> : null}
                        {evt.status?.toLowerCase() === 'completed' ? <span className="status-tag" style={{ background: 'var(--bg-active)' }}>Completed</span> : null}
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{evt.type || 'Hackathon'}</span>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, margin: '0 24px', maxWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Progress</span>
                        <span>{evt.progress || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--bg-active)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${evt.progress || 0}%`, height: '100%', background: (evt.status?.toLowerCase() === 'live' || evt.status?.toLowerCase() === 'ongoing') ? 'var(--success)' : (evt.status?.toLowerCase() === 'upcoming' || evt.status?.toLowerCase() === 'planned') ? 'var(--warning)' : 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
                    <div style={{ textAlign: 'right', marginRight: '16px', fontSize: '12px' }}>
                      <div><strong style={{ color: 'var(--text-primary)' }}>{evt.teams}</strong> Teams</div>
                      <div><strong style={{ color: 'var(--text-primary)' }}>{evt.judges}</strong> Experts</div>
                    </div>
                    <ArrowRight size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--accent-3)" /> Global Activity Log
              </h2>
              <button className="btn btn-text">View Full Audit <ArrowRight size={16}/></button>
            </div>
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {events.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No recent activity.
                </div>
              ) : (
                [
                  { time: 'Just now', action: 'Coordinator created a new event:', target: events[events.length - 1]?.name || 'New Event', icon: <Calendar size={14}/>, color: 'var(--primary)' },
                  { time: '1 hour ago', action: 'System executed automated backup', target: 'Database Snapshot', icon: <Database size={14}/>, color: 'var(--success)' },
                ].map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `var(--bg-hover)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: log.color, flexShrink: 0 }}>
                      {log.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {log.action} <strong style={{ color: 'var(--text-primary)' }}>{log.target}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{log.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} color="var(--accent-1)" /> User Breakdown
              </h2>
            </div>
            <div style={{ padding: '0 24px 24px 24px' }}>
              {totalUsers === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No users onboarded yet.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ width: '75%', background: 'var(--primary)' }} title="Participants: 75%" />
                    <div style={{ width: '15%', background: 'var(--accent-1)' }} title="Mentors: 15%" />
                    <div style={{ width: '10%', background: 'var(--warning)' }} title="Judges: 10%" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} /> Participants</span>
                      <strong>{events.reduce((sum, evt) => sum + (evt.teams || 0) * 4, 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-1)' }} /> Mentors</span>
                      <strong>{Math.floor(activeExperts * 0.6)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} /> Judges</span>
                      <strong>{Math.ceil(activeExperts * 0.4)}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--success)" /> System Health
              </h2>
            </div>
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>API Services</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}><CheckCircle2 size={14} /> Operational</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Database cluster</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}><CheckCircle2 size={14} /> Operational</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email delivery</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}><CheckCircle2 size={14} /> Operational</span>
              </div>
              <div style={{ marginTop: '8px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Last backup: 1 hour ago
              </div>
            </div>
          </div>

          <div className="panel glass-panel">
            <div className="panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--text-secondary)" /> Quick Actions
              </h2>
            </div>
            <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', background: 'var(--bg-subtle)', border: '1px solid transparent' }}>
                <UserPlus size={16} /> Invite Administrators
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', background: 'var(--bg-subtle)', border: '1px solid transparent' }}>
                <Mail size={16} /> SMTP Settings
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', background: 'var(--bg-subtle)', border: '1px solid transparent' }}>
                <Globe size={16} /> Custom Domain
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalDashboard;
