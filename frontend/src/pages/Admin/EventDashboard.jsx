import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, FileCode2, CheckSquare, AlertTriangle, ArrowUp, ArrowRight, Activity, UserPlus, MessageSquare, Ban, Calendar, Target, Lock, Unlock, PlayCircle, CheckCircle2, GraduationCap, X, Plus, UserCheck, Loader2 } from 'lucide-react';
import './EventDashboard.css';

const EventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { eventService } = await import('../../api/eventService.js');
        const { trackService } = await import('../../api/trackService.js');
        const { teamService } = await import('../../api/teamService.js');

        let rawEvent = null;
        let parsedId = eventId && eventId !== 'seal-sp26' ? parseInt(eventId) : null;

        if (parsedId) {
          const eventRes = await eventService.getEventDetails(parsedId);
          rawEvent = eventRes.data;
        } else {
          const eventsRes = await eventService.getEvents();
          if (eventsRes.data && eventsRes.data.length > 0) {
            rawEvent = eventsRes.data[0];
            parsedId = rawEvent.id;
          }
        }

        if (!rawEvent) return;

        // Fetch Rounds
        const roundsRes = await eventService.getEventRounds(parsedId);
        const rawRounds = roundsRes.data || [];

        // Fetch Topics
        const tracksRes = await trackService.getTracksByEvent(parsedId);
        const tracks = tracksRes.data || [];
        const topicsPromises = tracks.map(t => trackService.getTopicsByTrack(t.id).then(r => r.data || []));
        const allTopics = await Promise.all(topicsPromises);
        const subTopics = allTopics.flat();

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
            let endStr = r.endTime;
            if (startStr && startStr.length > 16) startStr = startStr.slice(0, 16);
            if (endStr && endStr.length > 16) endStr = endStr.slice(0, 16);
            return { ...r, start: startStr, end: endStr };
          })
        };

        setEvent(enrichedEvent);
        // Store raw tracks if needed
        setTracks(tracks);

      } catch (err) {
        console.error("Failed to load event dashboard data", err);
      }
    };
    fetchData();
  }, [eventId]);

  const handleUpdateEvent = async (updates) => {
    try {
      const { eventService } = await import('../../api/eventService.js');
      if (updates.status) {
        setStatusActionLoading(true);
        const res = await eventService.updateEventStatus(event.id, updates.status);
        setEvent(prev => ({ ...prev, status: res.data.status }));
      }
    } catch (err) {
      console.error(err);
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
      {showRegBanner && (
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
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{event.registrationStartDate} → {event.registrationEndDate || 'TBD'}</div>
            </div>
          )}
          {event.startDate && (
            <div style={{ marginLeft: '24px', paddingLeft: '24px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Event Dates</div>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{event.startDate} → {event.endDate || 'TBD'}</div>
            </div>
          )}
        </div>
        {sc.nextStatus && (
          <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={statusActionLoading} onClick={() => setConfirmAction({ status: sc.nextStatus, label: sc.nextLabel })}>
            {sc.icon} {statusActionLoading ? 'Updating…' : sc.nextLabel}
          </button>
        )}
      </div>


      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon gradient-1"><Users size={24} /></div>
          <div className="stat-details">
            <h3>Total Teams</h3>
            <p className="stat-value">{totalTeams}</p>
            <p className="stat-trend neutral">{totalTeams === 0 ? 'No teams yet' : `${totalTeams} team(s) registered`}</p>
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
                      {round.start && round.end ? `${round.start} — ${round.end}` : 'Dates TBD'}
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
                      ({round.start} → {round.end})
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
    </div>
  );
};

export default EventDashboard;
