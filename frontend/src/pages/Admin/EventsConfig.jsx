import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Settings, Target, Check } from 'lucide-react';

const EventsConfig = () => {
  const navigate = useNavigate();
  const [expandedEvent, setExpandedEvent] = useState(0);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    import('../../api/eventService.js').then(({ eventService }) => {
      import('../../api/trackService.js').then(({ trackService }) => {
        eventService.getEvents().then(async res => {
          const eventList = res.data || [];
          if (eventList.length > 0) {
            
            // Concurrently fetch rounds and topics for every event
            const enrichedEvents = await Promise.all(eventList.map(async rawEvent => {
              try {
                // Fetch rounds
                const roundsRes = await eventService.getEventRounds(rawEvent.id);
                const fetchedRounds = roundsRes.data || [];
                
                // Fetch tracks and their topics
                const tracksRes = await trackService.getTracksByEvent(rawEvent.id);
                const tracks = tracksRes.data || [];
                const topicsPromises = tracks.map(t => trackService.getTopicsByTrack(t.id).then(r => r.data || []));
                const allTopicsArrays = await Promise.all(topicsPromises);
                const fetchedTopics = allTopicsArrays.flat();

                return {
                  ...rawEvent,
                  subTopics: fetchedTopics,
                  rounds: fetchedRounds.map(r => {
                    let startStr = r.startTime;
                    if (Array.isArray(startStr)) {
                      const [y, m, d, h, min, s] = startStr;
                      startStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h || 0).padStart(2, '0')}:${String(min || 0).padStart(2, '0')}`;
                    }
                    return { ...r, start: startStr, durationHours: r.durationHours };
                  })
                };
              } catch (e) {
                console.error("Failed to enrich event data", e);
                return { ...rawEvent, subTopics: [], rounds: [] };
              }
            }));

            // Backend already returns events newest-first (ORDER BY createdAt DESC).
            setEvents(enrichedEvents);
            setExpandedEvent(enrichedEvents[0].id);
          }
        }).catch(err => console.error("Failed to load real events:", err));
      });
    });
  }, []);

  const statusColor = { ongoing: 'var(--success)', upcoming: 'var(--primary)', completed: 'var(--text-secondary)', cancelled: 'var(--danger)' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Events & Round Configuration</h1>
          <p className="subtitle">Create and configure hackathon events, rounds, and scoring criteria.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/events/create')}><Plus size={18} /> New Event</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {events.map((event) => (
          <div key={event.id} className="glass-panel" style={{ overflow: 'hidden' }}>
            {/* Event Header */}
            <div onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
              style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandedEvent === event.id ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{event.name || event.description || 'Unnamed Event'}</h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{event.subTopics ? event.subTopics.length : 0} Topics</span>
                    <span>•</span>
                    <span>{event.rounds ? event.rounds.length : 0} Rounds</span>
                    <span>•</span>
                    <span style={{ color: statusColor[event.status] || 'var(--primary)', textTransform: 'capitalize', fontWeight: '600' }}>{event.status || 'planned'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/event/${event.id}/edit`); }}><Edit2 size={14} /> Edit</button>
                {expandedEvent === event.id ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
              </div>
            </div>

            {expandedEvent === event.id && (
              <div style={{ padding: '24px' }}>
                {/* Sub Topics */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Sub-topics Allocation</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {event.subTopics && event.subTopics.length > 0 ? event.subTopics.map((st, i) => (
                      <div key={st.id || i} style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warning)' }}>Topic:</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{st.name}</span>
                      </div>
                    )) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No sub-topics configured.</span>
                    )}
                  </div>
                </div>


                {/* Rounds */}
                <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Rounds & Scoring Criteria</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.rounds && event.rounds.map((round, ri) => (
                    <div key={ri} style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${round.status === 'active' ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`, background: round.status === 'active' ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '16px' }}>{round.name}</h4>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: round.status === 'active' ? 'rgba(59,130,246,0.2)' : round.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'var(--bg-hover)', color: round.status === 'active' ? 'var(--primary)' : round.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)', fontWeight: '600', textTransform: 'capitalize' }}>{round.status || 'planned'}</span>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{round.start} {round.durationHours ? `(+${round.durationHours}h)` : ''} • {round.teams || 0} teams</span>
                        </div>
                        <button className="btn-icon" style={{ padding: '6px', border: '1px solid var(--border-color)', borderRadius: '8px' }}><Settings size={16} /></button>
                      </div>

                      {/* Criteria */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {round.criteria && round.criteria.map((c, ci) => (
                          <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Target size={13} color="var(--primary)" /> <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.name}</span></div>
                              <div style={{ height: '4px', background: 'var(--bg-active)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.round((c.weight || 0) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                              </div>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginLeft: '12px' }}>{Math.round((c.weight || 0) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsConfig;
