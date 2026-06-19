import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, FileCode2, CheckSquare, AlertTriangle, ArrowUp, ArrowRight, Activity, UserPlus, MessageSquare, Ban, Lock, Calendar, Target } from 'lucide-react';
import './EventDashboard.css';

const EventDashboard = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);

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

        const enrichedEvent = {
          ...rawEvent,
          subTopics: subTopics,
          rounds: rawRounds.map(r => {
            let startStr = r.startTime;
            if (Array.isArray(startStr)) startStr = `${startStr[0]}-${String(startStr[1]).padStart(2, '0')}-${String(startStr[2]).padStart(2, '0')}T${String(startStr[3] || 0).padStart(2, '0')}:${String(startStr[4] || 0).padStart(2, '0')}`;
            let endStr = r.endTime;
            if (Array.isArray(endStr)) endStr = `${endStr[0]}-${String(endStr[1]).padStart(2, '0')}-${String(endStr[2]).padStart(2, '0')}T${String(endStr[3] || 0).padStart(2, '0')}:${String(endStr[4] || 0).padStart(2, '0')}`;
            return { ...r, start: startStr, end: endStr };
          })
        };

        setEvent(enrichedEvent);

        // Fetch Teams
        teamService.getTeamsByEvent(parsedId)
          .then(res => setTeams(res.data || []))
          .catch(err => console.error(err));

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
        const res = await eventService.updateEventStatus(event.id, updates.status);
        setEvent(prev => ({ ...prev, status: res.data.status }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoundDateChange = (roundId, field, value) => {
    const updatedRounds = event.rounds.map(r => 
      r.id === roundId ? { ...r, [field]: value } : r
    );
    setEvent({ ...event, rounds: updatedRounds });
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

      {/* Event Management Controls */}
      <div className="glass-panel" style={{ marginTop: '24px', marginBottom: '24px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={20} color="var(--primary)" /> Event Management Controls
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Round Time Management */}
          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--text-primary)' }}>Round Time Management</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', maxHeight: '200px', overflowY: 'auto' }}>
              {event.rounds && event.rounds.length > 0 ? event.rounds.map((round) => (
                <div key={round.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>{round.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="time" 
                      value={round.start || ''} 
                      onChange={e => handleRoundDateChange(round.id, 'start', e.target.value)}
                      title="Start Time"
                      style={{ background: 'var(--bg-active)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', width: '110px' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    <input 
                      type="time" 
                      value={round.end || ''} 
                      onChange={e => handleRoundDateChange(round.id, 'end', e.target.value)}
                      title="End Time"
                      style={{ background: 'var(--bg-active)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', width: '110px' }}
                    />
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No rounds configured</div>
              )}
            </div>
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
                      <td><div className="rank-badge" style={{ background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'var(--bg-active)', color: 'white' }}>{i + 1}</div></td>
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
                      {round.start && round.end ? `${round.start} → ${round.end}` : 'Dates TBD'}
                      {round.criteria && round.criteria.length > 0 ? ` · ${round.criteria.length} criteria` : ''}
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
                            <div style={{ width: `${c.weight}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                          </div>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginLeft: '12px' }}>{c.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;
