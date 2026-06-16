import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Settings, Target, Check } from 'lucide-react';

const EventsConfig = () => {
  const navigate = useNavigate();
  const [expandedEvent, setExpandedEvent] = useState(0);
  const [events, setEvents] = useState([
    {
      id: 0, // Used as index 0 for SEAL event
      name: 'SEAL Hackathon Spring 2026',
      status: 'ongoing',
      tracks: [], // Will load from localStorage
      rounds: [
        { name: 'Qualifying Round', status: 'completed', start: 'Apr 11', end: 'Apr 12', teams: 24, criteria: [{ name: 'Accuracy', weight: 30 }, { name: 'RAG Arch', weight: 30 }, { name: 'Idea', weight: 15 }] },
        { name: 'Finals', status: 'active', start: 'Apr 12', end: 'Apr 12', teams: 6, criteria: [{ name: 'Data Quality', weight: 30 }, { name: 'Reliability', weight: 20 }, { name: 'Agent', weight: 20 }] },
      ]
    },
    {
      id: 1,
      name: 'Summer DevFest 2026',
      status: 'upcoming',
      tracks: ['Cloud & DevOps', 'Mobile Development'], // String format for other events
      rounds: [
        { name: 'Open Round', status: 'planned', start: 'Jul 1', end: 'Jul 7', teams: 0, criteria: [{ name: 'Innovation', weight: 50 }, { name: 'Technical', weight: 50 }] }
      ]
    }
  ]);

  useEffect(() => {
    // Load SEAL event config and track draw results
    const sealSettingsStr = localStorage.getItem('event_settings_seal_sp26');
    const trackDrawStr = localStorage.getItem('trackDraw');
    
    let loadedTracks = [];
    
    if (trackDrawStr) {
      // If tracks are already drawn, show the Track -> Topic mapping
      const trackDraw = JSON.parse(trackDrawStr);
      loadedTracks = trackDraw.map(t => ({ name: t.name, topic: t.subTopic ? t.subTopic.name : 'No Topic' }));
    } else if (sealSettingsStr) {
      // If not drawn, just show the subtopics pool as tracks for info
      const settings = JSON.parse(sealSettingsStr);
      if (settings.subTopics && settings.subTopics.length > 0) {
        loadedTracks = settings.subTopics.map(st => ({ name: 'Sub-topic', topic: st.name }));
      }
    } else {
      // Fallback
      loadedTracks = [{ name: 'Not Configured', topic: 'Please configure the event' }];
    }

    setEvents(prev => {
      const newEvents = [...prev];
      newEvents[0].tracks = loadedTracks;
      
      // Update event name and rounds if settings exist
      if (sealSettingsStr) {
        const settings = JSON.parse(sealSettingsStr);
        if (settings.name) newEvents[0].name = settings.name;
        if (settings.rounds && settings.rounds.length > 0) {
          newEvents[0].rounds = settings.rounds;
        }
      }
      return newEvents;
    });
  }, []);

  const statusColor = { ongoing: 'var(--success)', upcoming: 'var(--primary)', completed: 'var(--text-secondary)' };

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
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{event.name}</h3>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{event.tracks.length} {event.id === 0 ? 'Topics/Tracks' : 'Tracks'}</span>
                    <span>•</span>
                    <span>{event.rounds.length} Rounds</span>
                    <span>•</span>
                    <span style={{ color: statusColor[event.status] || 'var(--primary)', textTransform: 'capitalize', fontWeight: '600' }}>{event.status || 'planned'}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); navigate(event.id === 0 ? '/admin/events/edit/seal-sp26' : `/admin/events/edit/${event.id}`); }}><Edit2 size={14} /> Edit</button>
                {expandedEvent === event.id ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
              </div>
            </div>

            {expandedEvent === event.id && (
              <div style={{ padding: '24px' }}>
                {/* Tracks */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>{event.id === 0 ? 'Track & Sub-topic Allocation' : 'Tracks'}</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {event.tracks.map((t, i) => {
                      if (typeof t === 'string') {
                        return <span key={i} style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', fontSize: '13px', color: 'var(--primary)' }}>{t}</span>;
                      } else {
                        // Render object {name: 'Track A', topic: 'Topic name'}
                        return (
                          <div key={i} style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warning)' }}>{t.name}:</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t.topic}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>

                {/* Rounds */}
                <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Rounds & Scoring Criteria</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {event.rounds.map((round, ri) => (
                    <div key={ri} style={{ padding: '20px', borderRadius: '12px', border: `1px solid ${round.status === 'active' ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`, background: round.status === 'active' ? 'rgba(59,130,246,0.04)' : 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '16px' }}>{round.name}</h4>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: round.status === 'active' ? 'rgba(59,130,246,0.2)' : round.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'var(--bg-hover)', color: round.status === 'active' ? 'var(--primary)' : round.status === 'completed' ? 'var(--success)' : 'var(--text-secondary)', fontWeight: '600', textTransform: 'capitalize' }}>{round.status}</span>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{round.start} → {round.end} • {round.teams} teams</span>
                        </div>
                        <button className="btn-icon" style={{ padding: '6px', border: '1px solid var(--border-color)', borderRadius: '8px' }}><Settings size={16} /></button>
                      </div>

                      {/* Criteria */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {round.criteria.map((c, ci) => (
                          <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Target size={13} color="var(--primary)" /> <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.name}</span></div>
                              <div style={{ height: '4px', background: 'var(--bg-active)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: `${c.weight}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                              </div>
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginLeft: '12px' }}>{c.weight}%</span>
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
