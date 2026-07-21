import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Shield, BookOpen, Clock, AlertCircle, CheckCircle2, ArrowRight, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { eventService } from '../../api/eventService';
import { teamService } from '../../api/teamService';
import { submissionService, scoreService } from '../../api/scoreService';
import Settings from '../Shared/Settings';

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('judge');

  const handleEnterWorkspace = (ctx) => {
    const contextData = { event: ctx.event, role: ctx.role, track: ctx.track, trackId: ctx.trackId, path: ctx.path, eventId: ctx.eventId };
    localStorage.setItem('expertContext', JSON.stringify(contextData));
    navigate(ctx.path);
  };

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(() => {
    const email = localStorage.getItem('userEmail') || 'Expert';
    const userName = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole') || 'JUDGE';
    const userId = parseInt(localStorage.getItem('userId') || '1');
    
    const roles = [];
    if (role === 'JUDGE' || role === 'LECTURER' || role === 'GUEST_JUDGE') roles.push('Judge');
    if (role === 'MENTOR' || role === 'LECTURER') roles.push('Mentor');
    if (role === 'STAFF') roles.push('Staff');
    
    const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    return { 
      name: userName || email.split('@')[0], 
      roles,
      userId,
      avatar: u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || email.split('@')[0])}&background=14b8a6&color=fff` 
    };
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (u.name || u.avatarUrl) {
          setCurrentUser(prev => ({
            ...prev,
            name: u.name || prev.name,
            avatar: u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || prev.name)}&background=14b8a6&color=fff`
          }));
        }
      } catch(e) {}
    };
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('participant_state_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('participant_state_updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, assignmentsRes] = await Promise.all([
          eventService.getAssignedEvents(),
          apiClient.get('/api/v1/users/me/assignments').catch(() => ({ data: { data: [] } }))
        ]);
        const events = eventsRes.data || [];
        const myAssignments = assignmentsRes.data?.data || [];
        
        const dynamicAssignments = [];
        
        for (const evt of events) {
          // Find all tracks for this event that the user is assigned to.
          // Wait, we don't have all tracks fetched here... But we do know the event.
          // We can fetch tracks for the event to map trackId to trackName.
          let eventTracks = [];
          try {
             const { trackService } = await import('../../api/trackService.js');
             const tr = await trackService.getTracksByEvent(evt.id);
             eventTracks = tr.data || [];
          } catch(e) {}
          
          let teamsList = [];
          if (evt.status !== 'CREATED') {
            try {
              const teamsData = await teamService.getTeamsByEvent(evt.id);
              teamsList = teamsData?.data || teamsData || [];
            } catch(e) {}
          }
          
          // Filter my assignments that match this event's tracks
          const eventTrackIds = eventTracks.map(t => t.id);
          const myAssignmentsForEvent = myAssignments.filter(a => eventTrackIds.includes(a.trackId));
          const judgeAssignments = myAssignmentsForEvent.filter(a => a.role === 'JUDGE');
          
          if (currentUser.roles.includes('Judge')) {
            if (judgeAssignments.length > 0) {
              for (const assignment of judgeAssignments) {
                const trackObj = eventTracks.find(t => t.id === assignment.trackId);
                const trackName = trackObj ? trackObj.name : 'All Tracks';
                const trackId = trackObj ? trackObj.id : null;
                
                // Calculate Judge Stats if applicable
                let pending = '-', completed = '-';
                if (evt.status !== 'CREATED') {
                  try {
                    let p = 0, c = 0;
                    const roundsRes = await eventService.getEventRounds(evt.id);
                    const rounds = roundsRes.data || [];
                    let activeRoundIdx = -1;
                    for (let i = rounds.length - 1; i >= 0; i--) {
                      if (rounds[i].status !== 'CREATED' && rounds[i].status?.toLowerCase() !== 'planned') {
                        activeRoundIdx = i; break;
                      }
                    }
                    const activeRound = rounds[activeRoundIdx !== -1 ? activeRoundIdx : 0];
                    
                    if (activeRound) {
                      await Promise.all(teamsList.map(async (t) => {
                      if (trackId && t.trackId !== trackId) return;
                      if (['REGISTERED', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(t.status)) {
                        try {
                          const subRes = await submissionService.getSubmission(activeRound.id, t.id);
                          if (subRes?.data?.id) {
                            const scoresRes = await scoreService.getScoresByJudge(subRes.data.id, currentUser.userId);
                            if (scoresRes?.data?.length > 0) c++; else p++;
                          }
                        } catch (e) {
                          // No submission yet
                        }
                      }
                    }));
                  }
                  pending = p;
                  completed = c;
                } catch (e) { console.error(e); }
              }

              dynamicAssignments.push({
                id: `judge-${evt.id}-${trackId || 'any'}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Judge',
                track: trackName,
                trackId: trackId,
                path: '/judge/panel',
                stats: { pending, flagged: 0, completed },
                status: evt.status === 'CREATED' ? 'upcoming' : 'active'
              });
            }
          } else {
            dynamicAssignments.push({
                id: `judge-none-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Judge',
                track: 'No judge assignments',
                trackId: null,
                path: null,
                stats: { pending: '-', flagged: '-', completed: '-' },
                status: 'upcoming'
              });
            }
          }

          if (currentUser.roles.includes('Mentor')) {
            const userEmail = localStorage.getItem('userEmail');
            const isMentor = teamsList.some(t => t.mentor && (t.mentor.email === userEmail || t.mentor.id === currentUser.userId));
            
            if (isMentor) {
              const mentoredTeams = teamsList.filter(t => t.mentor && (t.mentor.email === userEmail || t.mentor.id === currentUser.userId));
              const mentoredTrackIds = [...new Set(mentoredTeams.map(t => t.trackId).filter(Boolean))];
              const mentoredTrackNames = mentoredTrackIds.map(tid => {
                const tr = eventTracks.find(t => t.id === tid);
                return tr ? tr.name : null;
              }).filter(Boolean);
              const trackLabel = mentoredTrackNames.length > 0 ? mentoredTrackNames.join(', ') : 'All Tracks';

              dynamicAssignments.push({
                id: `mentor-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Mentor',
                track: trackLabel,
                trackId: mentoredTrackIds[0] || null,
                path: '/mentor/tickets',
                stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
                status: evt.status === 'CREATED' ? 'upcoming' : 'active'
              });
            } else {
              dynamicAssignments.push({
                id: `mentor-none-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Mentor',
                track: 'No mentor assignments',
                trackId: null,
                path: null,
                stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
                status: 'upcoming'
              });
            }
          }

          if (currentUser.roles.includes('Staff')) {
            dynamicAssignments.push({
              id: `staff-${evt.id}`,
              eventId: evt.id,
              event: evt.name,
              role: 'Event Staff',
              track: 'Global Management',
              trackId: null,
              path: `/admin/event/${evt.id}/dashboard`,
              stats: { managed: true },
              status: evt.status === 'CREATED' ? 'upcoming' : 'active'
            });
          }
        }
        
        setAssignments(dynamicAssignments);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentUser.roles, currentUser.userId]);

  const hasJudge = currentUser.roles.includes('Judge');
  const hasMentor = currentUser.roles.includes('Mentor');
  const hasStaff = currentUser.roles.includes('Staff');
  const roleCount = [hasJudge, hasMentor, hasStaff].filter(Boolean).length;

  useEffect(() => {
    if (hasJudge) setActiveTab('judge');
    else if (hasMentor) setActiveTab('mentor');
    else if (hasStaff) setActiveTab('staff');
  }, [hasJudge, hasMentor, hasStaff]);

  return (
    <div className="expert-dashboard-container animate-fade-in" style={{ minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Navbar Area */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code size={24} color="white" /></div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1' }}>SEAL<span className="highlight">.</span></div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {localStorage.getItem('userRole') === 'STAFF' ? 'Staff Portal' : 'Expert Portal'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn-icon" 
            title="My Settings" 
            onClick={() => setShowSettings(!showSettings)} 
            style={{ background: showSettings ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
          >
            <SettingsIcon size={20} />
          </button>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>{currentUser.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {{
                'STAFF': 'Event Staff',
                'JUDGE': 'Judge',
                'MENTOR': 'Mentor',
                'GUEST_JUDGE': 'Guest Judge',
                'LECTURER': 'Lecturer',
                'ADMIN': 'System Admin'
              }[localStorage.getItem('userRole')] || 'Expert User'}
            </div>
          </div>
          
          <img 
            src={currentUser.avatar} 
            alt="Avatar" 
            style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
          />
          
          <button 
            className="btn-icon" 
            title="Logout" 
            onClick={() => {
              import('../../api/auth').then(({ authApi }) => {
                authApi.logout();
              });
            }} 
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '50%', marginLeft: '8px' }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '1000px' }}>
        {showSettings ? (
          <div>
            <button 
              onClick={() => setShowSettings(false)}
              className="btn btn-secondary"
              style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              &larr; Back to Dashboard
            </button>
            <Settings />
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome back, {currentUser.name.split(' ')[0]}! 👋</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '40px' }}>Here is an overview of your current assignments and pending tasks.</p>

            {roleCount > 1 && (
              <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid var(--border-color)', marginBottom: '32px' }}>
                {hasJudge && (
                  <button 
                    onClick={() => setActiveTab('judge')}
                    style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: 'none', padding: '12px 16px', fontSize: '16px', fontWeight: activeTab === 'judge' ? '700' : '500', color: activeTab === 'judge' ? '#f59e0b' : 'var(--text-secondary)', borderBottom: activeTab === 'judge' ? '2px solid #f59e0b' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-in-out' }}
                  >
                    <Shield size={18} /> Judge Assignments
                  </button>
                )}
                {hasMentor && (
                  <button 
                    onClick={() => setActiveTab('mentor')}
                    style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: 'none', padding: '12px 16px', fontSize: '16px', fontWeight: activeTab === 'mentor' ? '700' : '500', color: activeTab === 'mentor' ? '#14b8a6' : 'var(--text-secondary)', borderBottom: activeTab === 'mentor' ? '2px solid #14b8a6' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-in-out' }}
                  >
                    <BookOpen size={18} /> Mentor Assignments
                  </button>
                )}
                {hasStaff && (
                  <button 
                    onClick={() => setActiveTab('staff')}
                    style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: 'none', padding: '12px 16px', fontSize: '16px', fontWeight: activeTab === 'staff' ? '700' : '500', color: activeTab === 'staff' ? '#8b5cf6' : 'var(--text-secondary)', borderBottom: activeTab === 'staff' ? '2px solid #8b5cf6' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease-in-out' }}
                  >
                    <User size={18} /> Staff Assignments
                  </button>
                )}
              </div>
            )}

        {/* JUDGE SECTION */}
        {hasJudge && activeTab === 'judge' && (
        <div style={{ marginBottom: '40px' }}>
          {assignments.filter(item => item.role === 'Judge').length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No Judge assignments at the moment.
            </div>
          ) : (
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
                    {item.path ? (
                      item.status === 'active' ? (
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
                      ) : (
                        <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Starts in {item.startsIn || 'soon'}
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        No {item.role} work assigned.
                      </div>
                    )}
                  </div>

                  {item.path ? (
                    <button 
                      onClick={() => handleEnterWorkspace(item)}
                      className={item.status === 'active' ? 'btn btn-primary' : 'btn btn-secondary'} 
                      style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                      disabled={item.status === 'upcoming'}
                    >
                      Enter Workspace <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div style={{ marginTop: '24px', padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', textAlign: 'center', borderRadius: '8px', fontSize: '14px' }}>
                      Not Assigned
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* MENTOR SECTION */}
        {hasMentor && activeTab === 'mentor' && (
        <div>
          {assignments.filter(item => item.role === 'Mentor').length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No Mentor assignments at the moment.
            </div>
          ) : (
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
                    {item.path ? (
                      item.status === 'active' ? (
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
                      ) : (
                        <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Starts in {item.startsIn || 'soon'}
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        No {item.role} work assigned.
                      </div>
                    )}
                  </div>

                  {item.path ? (
                    <button 
                      onClick={() => handleEnterWorkspace(item)}
                      className={item.status === 'active' ? 'btn btn-primary' : 'btn btn-secondary'} 
                      style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                      disabled={item.status === 'upcoming'}
                    >
                      Enter Workspace <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div style={{ marginTop: '24px', padding: '12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', textAlign: 'center', borderRadius: '8px', fontSize: '14px' }}>
                      Not Assigned
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* STAFF SECTION */}
        {hasStaff && activeTab === 'staff' && (
        <div style={{ marginBottom: '40px' }}>
          {assignments.filter(item => item.role === 'Event Staff').length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No Staff assignments at the moment.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {assignments.filter(item => item.role === 'Event Staff').map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#8b5cf6' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(139,92,246,0.1)', padding: '8px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontSize: '13px', fontWeight: '600' }}>
                      <User size={16} /> Event Staff
                    </div>
                    {item.status === 'upcoming' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>Upcoming</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>{item.event}</h2>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Scope: <strong style={{ color: 'var(--text-primary)' }}>Entire Event</strong></div>

                  <div style={{ flex: 1 }}>
                    {item.status === 'active' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><CheckCircle2 size={16} /> Management Access</span>
                          <span style={{ fontWeight: '600', color: 'var(--success)' }}>Active</span>
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
          )}
        </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpertDashboard;
