import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, CheckSquare, AlertTriangle, ArrowRight, Activity, Ban, Calendar, Target, Lock, Unlock, PlayCircle, CheckCircle2, X } from 'lucide-react';
import './EventDashboard.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

const EventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [statusError, setStatusError] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    try {
      setUserRole(localStorage.getItem('userRole') || '');
    } catch { /* ignored on purpose */ }
    const fetchData = async () => {
      try {
        const { eventService } = await import('../../api/eventService.js');
        const { trackService } = await import('../../api/trackService.js');
        const { teamService } = await import('../../api/teamService.js');

        let rawEvent = null;
        let parsedId = eventId && eventId !== 'seal-sp26' ? parseInt(eventId) : null;

        if (parsedId) {
          const eventRes = await eventService.getEventDetails(parsedId);
          // getEventDetails returns ApiResponse { success, data: EventResponse }
          rawEvent = eventRes?.data || eventRes;
        } else {
          const eventsRes = await eventService.getEvents();
          // getEvents returns ApiResponse { success, data: EventResponse[] }
          const eventList = eventsRes?.data || eventsRes || [];
          if (Array.isArray(eventList) && eventList.length > 0) {
            rawEvent = eventList[eventList.length - 1];
            parsedId = rawEvent.id;
          }
        }

        if (!rawEvent) return;

        // Fetch Rounds
        const roundsRes = await eventService.getEventRounds(parsedId);
        // getEventRounds returns ApiResponse { success, data: Round[] }
        const rawRounds = roundsRes?.data || [];

        // Fetch Topics
        const topicsRes = await trackService.getTopicsByEvent(parsedId);
        // getTopicsByEvent returns ApiResponse { success, data: Topic[] }
        const subTopics = topicsRes?.data || [];

        // Fetch Teams
        try {
          const teamsData = await teamService.getTeamsByEvent(parsedId);
          setTeams(teamsData?.data || teamsData || []);
        } catch (e) {
          console.error("Failed to load teams", e);
        }

        // Fetch Criteria
        const { criterionService } = await import('../../api/scoreService.js');
        const roundsWithCriteriaPromises = rawRounds.map(async r => {
          try {
             const critRes = await criterionService.getCriteria(r.id);
             return { ...r, criteria: critRes?.data || [] };
          } catch {
             return { ...r, criteria: [] };
          }
        });
        const roundsWithCriteria = await Promise.all(roundsWithCriteriaPromises);

        const enrichedEvent = {
          ...rawEvent,
          subTopics: subTopics,
          rounds: roundsWithCriteria.map(r => {
            let startStr = r.startTime;
            if (startStr && startStr.length > 16) startStr = startStr.slice(0, 16);
            return { ...r, start: startStr, durationHours: r.durationHours };
          })
        };

        setEvent(enrichedEvent);

      } catch (err) {
        console.error("Failed to load event dashboard data", err);
      }
    };
    fetchData();
  }, [eventId]);

  const handleUpdateEvent = async (updates) => {
    try {
      setStatusError('');
      const { eventService } = await import('../../api/eventService.js');
      if (updates.status) {
        setStatusActionLoading(true);
        const res = await eventService.updateEventStatus(event.id, updates.status);
        setEvent(prev => ({ ...prev, status: res.data.status }));
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to update event status.';
      setStatusError(msg);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const executeConfirmAction = () => {
    if (confirmAction) {
      handleUpdateEvent(confirmAction);
      setConfirmAction(null);
    }
  };

  const handleCancelEvent = async () => {
    try {
      setStatusError('');
      setStatusActionLoading(true);
      const { eventService } = await import('../../api/eventService.js');
      const res = await eventService.cancelEvent(event.id);
      setEvent(prev => ({ ...prev, status: res.data.status }));
      setConfirmCancel(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to cancel event.';
      setStatusError(msg);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (deleteConfirmText !== event.name) {
      setStatusError('Event name does not match. Deletion cancelled.');
      setConfirmDelete(false);
      setDeleteConfirmText('');
      return;
    }
    
    try {
      setStatusError('');
      setStatusActionLoading(true);
      const { eventService } = await import('../../api/eventService.js');
      await eventService.deleteEvent(event.id);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Failed to permanently delete event.';
      setStatusError(msg);
      setStatusActionLoading(false);
      setConfirmDelete(false);
      setDeleteConfirmText('');
    }
  };


  if (!event) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <h2 style={{ marginBottom: '8px' }}>No Event Found</h2>
        <p style={{ marginBottom: '24px' }}>Create an event first to view the dashboard.</p>
        <button className="btn btn-primary" onClick={() => navigate('/admin/events/create')}>Create Event</button>
      </div>
    );
  }

  const currentRound = event.rounds && event.rounds.length > 0 ? event.rounds[0] : null;
  const totalTeams = teams.length;
  const totalTopics = event.subTopics ? event.subTopics.length : 0;
  const totalRounds = event.rounds ? event.rounds.length : 0;

  const today = new Date().toISOString().split('T')[0];
  const statusUpper = (event.status || '').toUpperCase();
  const showRegBanner = statusUpper === 'PLANNED' && event.registrationStartDate && today >= event.registrationStartDate;

  const statusConfig = {
    PLANNED:   { label: 'Planning Phase',    color: 'var(--text-secondary)', bg: 'var(--bg-hover)',            nextLabel: 'Open Registration', nextStatus: 'UPCOMING', icon: <Unlock size={16}/> },
    UPCOMING:  { label: 'Registration Open', color: 'var(--primary)',        bg: 'rgba(59,130,246,0.1)',       nextLabel: 'Lock Registration', nextStatus: 'ONGOING',  icon: <Lock size={16}/> },
    ONGOING:   { label: 'Event Ongoing',     color: 'var(--success)',        bg: 'rgba(16,185,129,0.1)',       nextLabel: 'End Event',          nextStatus: 'COMPLETED',icon: <CheckCircle2 size={16}/> },
    COMPLETED: { label: 'Event Completed',   color: 'var(--warning)',        bg: 'rgba(245,158,11,0.1)',       nextLabel: null, nextStatus: null },
    CANCELLED: { label: 'Cancelled',         color: 'var(--danger)',         bg: 'rgba(239,68,68,0.1)',        nextLabel: null, nextStatus: null },
  };
  const sc = statusConfig[statusUpper] || statusConfig['PLANNED'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{event.name || 'System Overview'}</h1>
          <p className="subtitle">{event.description || `Track the status of your hackathon`}</p>
        </div>
        <div className="status-indicator">
          <span className="dot live"></span>
          {event.status || 'Ongoing'}{currentRound ? ` — ${currentRound.name}` : ''}
        </div>
      </div>

      {/* Auto-detect banner */}
      {userRole === 'ADMIN' && showRegBanner && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warning)' }}>Registration period has started</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>— the event is still in Planning status. Open registration so participants can sign up.</span>
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--warning)', color: '#000', padding: '8px 16px', fontSize: '13px' }}
            disabled={statusActionLoading} onClick={() => setConfirmAction({ status: 'UPCOMING', label: 'Open Registration' })}>
            <Unlock size={14} /> Open Registration
          </button>
        </div>
      )}

      {/* Status Action Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: sc.bg, border: `1px solid ${sc.color}33`, borderRadius: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PlayCircle size={20} color={sc.color} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Current Phase</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: sc.color }}>{sc.label}</div>
          </div>
          {event.registrationStartDate && (
            <div style={{ marginLeft: '24px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Registration</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{formatDate(event.registrationStartDate)} → {formatDate(event.registrationEndDate) || 'TBD'}</div>
            </div>
          )}
          {event.startDate && (
            <div style={{ marginLeft: '24px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Event Dates</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{formatDate(event.startDate)} → {formatDate(event.endDate) || 'TBD'}</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {userRole === 'ADMIN' && sc.nextStatus && (
            <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
              disabled={statusActionLoading} onClick={() => setConfirmAction({ status: sc.nextStatus, label: sc.nextLabel })}>
              {sc.icon} {statusActionLoading ? 'Updating…' : sc.nextLabel}
            </button>
          )}
          {userRole === 'ADMIN' && statusUpper === 'UPCOMING' && (
            <button style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px', cursor: 'pointer' }}
              disabled={statusActionLoading} onClick={() => setConfirmCancel(true)}>
              <Ban size={16} /> Cancel Event
            </button>
          )}
          {userRole === 'ADMIN' && statusUpper === 'CANCELLED' && (
            <button style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', background: 'var(--danger)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              disabled={statusActionLoading} onClick={() => setConfirmDelete(true)}>
              <X size={16} /> Delete Permanently
            </button>
          )}
        </div>
      </div>


      {/* Status Error Banner */}
      {statusError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '24px' }}>
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500', flex: 1 }}>{statusError}</span>
          <button onClick={() => setStatusError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={16} color="#ef4444" /></button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-1"><Users size={24} /></div>
          <div className="stat-details">
            <h3>Total Teams</h3>
            <p className="stat-value">{totalTeams} <span style={{fontSize: '14px', color: 'var(--text-secondary)'}}>/ {event.maxTeams || '∞'} max</span></p>
            <p className="stat-trend neutral">{event.minTeams ? `Min ${event.minTeams} teams required` : `${totalTeams} team(s) registered`}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-2"><Target size={24} /></div>
          <div className="stat-details">
            <h3>Sub-topics</h3>
            <p className="stat-value">{totalTopics}</p>
            <p className="stat-trend neutral">{totalTopics === 0 ? 'None configured' : `${totalTopics} topic(s)`}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-3"><CheckSquare size={24} /></div>
          <div className="stat-details">
            <h3>Rounds</h3>
            <p className="stat-value">{totalRounds}</p>
            <p className="stat-trend neutral">{totalRounds === 0 ? 'No rounds yet' : `${totalRounds} round(s) configured`}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-4"><AlertTriangle size={24} /></div>
          <div className="stat-details">
            <h3>Event Type</h3>
            <p className="stat-value" style={{ fontSize: '20px' }}>{event.type || 'Hackathon'}</p>
            <p className="stat-trend neutral">{event.startDate} → {event.endDate || 'TBD'}</p>
          </div>
        </div>
      </div>



      <div className="dashboard-bottom-grid">
        {/* Teams Panel */}
        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Registered Teams</h2>
            <button className="btn btn-text" onClick={() => navigate(`/admin/event/${eventId}/teams`)}>View all <ArrowRight size={16}/></button>
          </div>
          {teams.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No teams registered yet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>Members</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.slice(0, 5).map((team, i) => (
                    <tr key={team.id}>
                      <td><div style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '14px', textAlign: 'center', width: '24px' }}>{i + 1}</div></td>
                      <td><strong>{team.name}</strong><br/><small>{team.inviteCode}</small></td>
                      <td>{team.memberCount || 0} / 5</td>
                      <td><span className="status-tag status-success">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rounds & Timeline */}
        <div className="panel glass-panel">
          <div className="panel-header">
            <h2>Rounds Timeline</h2>
          </div>
          {event.rounds && event.rounds.length > 0 ? (
            <div className="timeline">
              {event.rounds.map((round, i) => (
                <div key={round.id || i} className={`timeline-item ${i === 0 ? 'active' : ''}`}>
                  <div className={`timeline-dot ${i === 0 ? 'pulse-dot' : ''}`}></div>
                  <div className="timeline-content">
                    <h4>{round.name}</h4>
                    <p>
                      {round.start && round.durationHours ? `${formatDate(round.start)} — (${round.durationHours} hours)` : 'Dates TBD'}
                      {round.criteria && round.criteria.length > 0 ? ` • ${round.criteria.length} criteria` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No rounds configured yet.</p>
              <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => navigate('/admin/events/create')}>
                Configure Rounds
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-topics Section */}
      {event.subTopics && event.subTopics.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '28px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target size={20} color="var(--warning)" /> Sub-topics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {event.subTopics.map((st, i) => (
              <div key={st.id || i} style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--warning)', marginBottom: '6px' }}>{st.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{st.description || 'No description.'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Criteria per Round */}
      {event.rounds && event.rounds.some(r => r.criteria && r.criteria.length > 0) && (
        <div className="glass-panel" style={{ marginTop: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-3)" /> Scoring Criteria by Round
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {event.rounds.map((round, ri) => (
              round.criteria && round.criteria.length > 0 && (
                <div key={round.id || ri}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    {round.name}
                    <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      ({formatDate(round.start)} → {round.durationHours ? `+${round.durationHours}h` : 'TBD'})
                    </span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {round.criteria.map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <Target size={13} color="var(--primary)" />
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.name}</span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-active)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((c.weight || 0) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginLeft: '12px' }}>{Math.round((c.weight || 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmAction(null)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>{confirmAction.label}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to proceed with this action? This will update the current phase of the event for all users.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={executeConfirmAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmCancel(false)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', borderTop: '4px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', flexShrink: 0 }}>
                <Ban size={24} color="var(--danger)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Cancel Event</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                  Are you sure you want to cancel this event? <strong style={{ color: 'var(--text-primary)' }}>All registered teams and event staff will be removed.</strong> This action will free up students to join other events.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmCancel(false)} disabled={statusActionLoading}>Keep Event</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleCancelEvent} disabled={statusActionLoading}>
                {statusActionLoading ? 'Cancelling...' : 'Yes, Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => { setConfirmDelete(false); setDeleteConfirmText(''); }} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-panel)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', borderTop: '4px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', flexShrink: 0 }}>
                <AlertTriangle size={24} color="var(--danger)" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Hard Delete Event</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                  You are about to permanently delete this event and all associated tracks, rounds, topics, teams, and data. <strong style={{ color: 'var(--text-primary)' }}>This action cannot be undone.</strong>
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Please type <strong>{event.name}</strong> to confirm.</label>
              <input 
                type="text" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'var(--bg-subtle)', 
                  border: `1px solid ${deleteConfirmText.length > 0 && deleteConfirmText !== event.name ? 'var(--danger)' : 'var(--border-color)'}`, 
                  borderRadius: '8px', 
                  color: 'var(--text-primary)' 
                }}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={event.name}
                autoFocus
              />
              {deleteConfirmText.length > 0 && deleteConfirmText !== event.name && (
                <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px', fontWeight: '500' }}>
                  Event name does not match. Please type exactly as shown.
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => { setConfirmDelete(false); setDeleteConfirmText(''); }} disabled={statusActionLoading}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} 
                onClick={handleDeleteEvent}
                disabled={deleteConfirmText !== event.name || statusActionLoading}
              >
                {statusActionLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;
