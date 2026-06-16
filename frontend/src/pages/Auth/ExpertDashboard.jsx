import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code, Shield, BookOpen, Clock, AlertCircle, CheckCircle2, ArrowRight, LogOut, Anchor } from 'lucide-react';
import fptLogo from '../../assets/fptLogo.png';

const ExpertDashboard = () => {
  const navigate = useNavigate();

  const handleEnterWorkspace = (ctx) => {
    const contextData = { event: ctx.event, role: ctx.role, track: ctx.track, path: ctx.path };
    localStorage.setItem('expertContext', JSON.stringify(contextData));
    navigate(ctx.path);
  };

  const assignments = [
    {
      id: 1,
      event: 'SEAL Hackathon Spring 2026',
      role: 'Judge',
      track: 'Track B - Medical Knowledge RAG',
      path: '/judge/panel',
      stats: { pending: 1, flagged: 0, completed: 1 },
      status: 'active'
    },
    {
      id: 2,
      event: 'SEAL Hackathon Spring 2026',
      role: 'Mentor',
      track: 'Track B - Medical Knowledge RAG',
      path: '/mentor/tickets',
      stats: { openTickets: 3, urgentTickets: 1, resolved: 18 },
      status: 'active'
    }
  ];

  const [currentUser, setCurrentUser] = React.useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : { name: 'Sarah Nguyen', roles: ['Judge', 'Mentor'], avatar: 'https://ui-avatars.com/api/?name=Sarah+Nguyen&background=14b8a6&color=fff' };
  });

  const hasJudge = currentUser.roles.includes('Judge');
  const hasMentor = currentUser.roles.includes('Mentor');

  return (
    <div className="expert-dashboard-container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      

      {/* Top Navbar Area */}
      <header className="fpt-topbar" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'var(--primary)', boxShadow: '0 4px 12px rgba(242, 111, 33, 0.2)', color: 'white', marginBottom: '60px' }}>
        <Link to="/" className="logo" style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Anchor size={24} /></div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="logo-text" style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>SEAL<span style={{ color: 'white' }}>.</span></span>
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
        
        <div className="topbar-actions" style={{ paddingRight: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{currentUser.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Senior Expert</div>
          </div>
          <img src={currentUser.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
          <button 
            className="btn-icon" 
            onClick={() => navigate('/login')} 
            title="Logout" 
            style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'var(--transition)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <LogOut size={18} color="white" />
          </button>
        </div>
      </header>

      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome back, {currentUser.name.split(' ')[0]}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '40px' }}>Here is an overview of your current assignments and pending tasks.</p>

        {/* JUDGE SECTION */}
        {hasJudge && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
            <Shield size={24} /> Judge Assignments
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {assignments.filter(item => item.role === 'Judge').map(item => (
              <div key={item.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>


                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--warning)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(245,158,11,0.1)', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                    <Shield size={16} /> Judge
                  </div>
                  {item.status === 'upcoming' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>Upcoming</span>
                  )}
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>{item.event}</h2>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Track: <strong style={{ color: 'var(--text-primary)' }}>{item.track}</strong></div>

                <div style={{ flex: 1 }}>
                  {item.status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Clock size={16} /> Pending</span>
                        <span style={{ fontWeight: '600' }}>{item.stats.pending}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}><AlertCircle size={16} /> Flagged</span>
                        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{item.stats.flagged}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}><CheckCircle2 size={16} /> Completed</span>
                        <span style={{ fontWeight: '600', color: 'var(--success)' }}>{item.stats.completed}</span>
                      </div>
                    </div>
                  )}

                  {item.status === 'upcoming' && (
                    <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Starts in {item.startsIn}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleEnterWorkspace(item)}
                  className={item.status === 'active' ? 'btn btn-primary' : 'btn btn-secondary'} 
                  style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  disabled={item.status === 'upcoming'}
                >
                  Enter Workspace <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* MENTOR SECTION */}
        {hasMentor && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#14b8a6' }}>
            <BookOpen size={24} /> Mentor Assignments
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {assignments.filter(item => item.role === 'Mentor').map(item => (
              <div key={item.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-3)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(20,184,166,0.1)', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#14b8a6', fontSize: '13px', fontWeight: '600' }}>
                    <BookOpen size={16} /> Mentor
                  </div>
                  {item.status === 'upcoming' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>Upcoming</span>
                  )}
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>{item.event}</h2>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Track: <strong style={{ color: 'var(--text-primary)' }}>{item.track}</strong></div>

                <div style={{ flex: 1 }}>
                  {item.status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Clock size={16} /> Open Tickets</span>
                        <span style={{ fontWeight: '600' }}>{item.stats.openTickets}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}><AlertCircle size={16} /> Urgent</span>
                        <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{item.stats.urgentTickets}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}><CheckCircle2 size={16} /> Resolved</span>
                        <span style={{ fontWeight: '600', color: 'var(--success)' }}>{item.stats.resolved}</span>
                      </div>
                    </div>
                  )}

                  {item.status === 'upcoming' && (
                    <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Starts in {item.startsIn}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleEnterWorkspace(item)}
                  className={item.status === 'active' ? 'btn btn-primary' : 'btn btn-secondary'} 
                  style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                  disabled={item.status === 'upcoming'}
                >
                  Enter Workspace <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default ExpertDashboard;
