import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shuffle, CheckCircle, AlertCircle, ChevronRight, Users, Tag, Lock, Unlock, RefreshCw, ArrowRight, Target } from 'lucide-react';
import { eventService } from '../../api/eventService';
import { teamService } from '../../api/teamService';
import { trackService } from '../../api/trackService';

const TrackDraw = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [isConfigured, setIsConfigured] = useState(true);
  const [subTopics, setSubTopics] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [step, setStep] = useState(1); // 1 = sub-topic draw, 2 = team assignment
  const [unassignedTeams, setUnassignedTeams] = useState([]);
  const [activeTeamsList, setActiveTeamsList] = useState([]);
  const [topicDrawn, setTopicDrawn] = useState(false);
  const [teamsAssigned, setTeamsAssigned] = useState(false);
  const parsedInitEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
  const [confirmed, setConfirmed] = useState(() => localStorage.getItem(`trackDrawConfirmed_${parsedInitEventId}`) === 'true');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
        const eventRes = await eventService.getEventDetails(parsedEventId);
        const teamsRes = await teamService.getTeamsByEvent(parsedEventId);
        
        let activeEvent = eventRes.data;
        if (!activeEvent) {
          setIsConfigured(false);
          return;
        }

        let realSubTopics = [];
        try {
           const tracksRes = await trackService.getTracksByEvent(parsedEventId);
           const tracks = tracksRes.data || [];
           const topicsPromises = tracks.map(t => trackService.getTopicsByTrack(t.id).then(res => res.data || []));
           const allTopics = await Promise.all(topicsPromises);
           realSubTopics = allTopics.flat();
        } catch (e) {
           console.error("Failed to load tracks/topics", e);
        }

        if (realSubTopics.length === 0) {
          setIsConfigured(false);
          return;
        }

        setSubTopics(realSubTopics);

        const validTeams = (teamsRes.data || []).filter(t => ['CREATED', 'REGISTERED', 'APPROVED', 'CONFIRMED'].includes(t.status));
        const realTeams = validTeams.map(t => ({ id: t.id, name: t.name })); // Keep objects for ID usage
        setActiveTeamsList(realTeams);
        setIsConfigured(true);

        const drawResStr = localStorage.getItem(`trackDraw_${parsedEventId}`);
        if (drawResStr && localStorage.getItem(`trackDrawConfirmed_${parsedEventId}`) === 'true') {
          const savedTracks = JSON.parse(drawResStr);
          // Cross-check: only restore if the saved teams actually exist in DB
          const savedTeamIds = savedTracks.flatMap(t => t.teams.map(tm => tm.id)).filter(Boolean);
          const realTeamIds = realTeams.map(t => t.id);
          const isStale = savedTeamIds.length > 0 && !savedTeamIds.some(id => realTeamIds.includes(id));
          
          if (isStale) {
            // Stale cache from a different event — clear it
            localStorage.removeItem(`trackDraw_${parsedEventId}`);
            localStorage.removeItem(`trackDrawConfirmed_${parsedEventId}`);
          } else {
            setTracks(savedTracks);
            setConfirmed(true);
            setTopicDrawn(true);
            setTeamsAssigned(true);
            setUnassignedTeams([]);
            return;
          }
        }
        
        const trackColors = [
          { color: 'var(--primary)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
          { color: 'var(--accent-1)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
          { color: 'var(--accent-3)', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.3)' },
          { color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
        ];

        const initTracks = realSubTopics.map((st, i) => ({
          id: `T${i}`, 
          name: `Track ${String.fromCharCode(65 + i)}`, 
          ...trackColors[i % trackColors.length], 
          subTopic: null, 
          teams: [] 
        }));
        setTracks(initTracks);
        setUnassignedTeams(realTeams);

      } catch (err) {
        console.error(err);
        setIsConfigured(false);
      }
    };
    fetchData();
  }, []);

  const triggerError = (msg) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleDrawTopics = () => {
    setDrawing(true);
    setError('');
    setTimeout(() => {
      // Shuffle subTopics
      let shuffled = [...subTopics].sort(() => 0.5 - Math.random());
      setTracks(prev => prev.map((t, i) => ({ ...t, subTopic: shuffled[i % shuffled.length] })));
      setTopicDrawn(true);
      setDrawing(false);
    }, 1200);
  };

  const handleRedrawTopics = () => {
    setTopicDrawn(false);
    setTracks(prev => prev.map(t => ({ ...t, subTopic: null })));
  };

  // Step 2: Random assign teams to tracks
  const handleAssignTeams = () => {
    setDrawing(true);
    setError('');
    
    setTimeout(() => {
      // Shuffle teams randomly
      let shuffledTeams = [...unassignedTeams].sort(() => 0.5 - Math.random());
      const numTracks = tracks.length;
      if (numTracks === 0) return;
      
      const updated = tracks.map((t, i) => {
        // Distribute teams evenly
        const teamsForThisTrack = shuffledTeams.filter((_, idx) => idx % numTracks === i);
        return { ...t, teams: teamsForThisTrack };
      });
      
      setTracks(updated);
      setUnassignedTeams([]);
      setTeamsAssigned(true);
      setDrawing(false);
    }, 1500);
  };

  const handleResetTeams = () => {
    setTeamsAssigned(false);
    setTracks(prev => prev.map(t => ({ ...t, teams: [] })));
    setUnassignedTeams(activeTeamsList);
  };

  // Final confirm
  const handleConfirm = async () => {
    if (!topicDrawn) { triggerError('Sub-topics have not been drawn for Tracks.'); return; }
    if (!teamsAssigned || unassignedTeams.length > 0) { triggerError('There are teams not assigned to a Track.'); return; }
    
    setDrawing(true);
    try {
      const targetEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
      for (const track of tracks) {
        // 1. Create track in DB
        const trackPayload = { trackName: track.name };
        let dbTrack;
        try {
          const created = await trackService.createTrack(targetEventId, trackPayload);
          dbTrack = created.data;
        } catch (e) {
          // If already exists or error, try fetching or skip gracefully for demo
          const existing = await trackService.getTracksByEvent(eventId);
          dbTrack = existing.data?.find(t => t.name === track.name);
          if (!dbTrack) throw e;
        }

        // 2. Assign teams to track in DB
        if (dbTrack && dbTrack.id) {
          track.id = dbTrack.id; // update client id
          for (const team of track.teams) {
            if (team.id) {
              await teamService.assignTrack(team.id, dbTrack.id);
            }
          }
        }
      }

      setConfirmed(true);
      localStorage.setItem(`trackDrawConfirmed_${targetEventId}`, 'true');
      localStorage.setItem(`trackDraw_${targetEventId}`, JSON.stringify(tracks));
      
      // Backend automatically persists the track assignments now
      setToast('Draw results have been confirmed and published to the Database!');
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      triggerError('Failed to save to database: ' + (e?.response?.data?.message || e.message));
      setDrawing(false);
    }
  };

  const handleResetDraw = () => {
    if (!window.confirm('Reset the draw? This will clear all track assignments and allow a new draw.')) return;
    const targetEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
    localStorage.removeItem(`trackDraw_${targetEventId}`);
    localStorage.removeItem(`trackDrawConfirmed_${targetEventId}`);
    setConfirmed(false);
    setTopicDrawn(false);
    setTeamsAssigned(false);
    setTracks(prev => prev.map(t => ({ ...t, subTopic: null, teams: [] })));
    setUnassignedTeams(activeTeamsList);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Track Draw</h1>
          <p className="subtitle">SEAL Hackathon Spring 2026</p>
        </div>
        {confirmed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: 'var(--success)', fontWeight: '600', fontSize: '14px' }}>
              <Lock size={16} /> Confirmed & Published
            </div>
            <button onClick={handleResetDraw} className="btn btn-secondary" style={{ padding: '8px 16px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              Reset Draw
            </button>
          </div>
        )}
      </div>

      {!isConfigured ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px' }}>
          <AlertCircle size={48} color="var(--warning)" style={{ marginBottom: '16px', opacity: 0.8 }} />
          <h2 style={{ fontSize: '20px', color: 'var(--warning)', marginBottom: '8px' }}>Event Not Configured</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            You must configure the Track list and Sub-topics Bank before conducting the draw.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/events/edit/seal-sp26')} style={{ background: 'var(--warning)', color: '#000' }}>
            <Target size={18} /> Go to Event Settings
          </button>
        </div>
      ) : (
        <>
          {/* Step indicator */}
          {!confirmed && (
            <div style={{ display: 'flex', gap: '0', marginBottom: '32px' }}>
              {[
                { n: 1, label: 'Sub-topic Draw' },
                { n: 2, label: 'Team Assignment' },
                { n: 3, label: 'Confirm & Publish' },
              ].map((s, i) => (
                <React.Fragment key={s.n}>
                  <div
                    onClick={() => !confirmed && setStep(s.n)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: step === s.n ? 'rgba(59,130,246,0.15)' : 'var(--bg-subtle)', border: `1px solid ${step === s.n ? 'rgba(59,130,246,0.4)' : 'var(--border-color)'}`, borderRadius: i === 0 ? '10px 0 0 10px' : i === 2 ? '0 10px 10px 0' : '0', cursor: confirmed ? 'default' : 'pointer', flex: 1, transition: 'var(--transition)' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step > s.n || (s.n === 1 && topicDrawn) || (s.n === 2 && teamsAssigned) || (s.n === 3 && confirmed) ? 'var(--success)' : step === s.n ? 'var(--primary)' : 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                      {(s.n === 1 && topicDrawn) || (s.n === 2 && teamsAssigned) || (s.n === 3 && confirmed) ? <CheckCircle size={16} color="white" /> : s.n}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: step === s.n ? '600' : '400', color: step === s.n ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</span>
                  </div>
                  {i < 2 && <div style={{ width: '1px', background: 'var(--border-color)' }} />}
                </React.Fragment>
              ))}
            </div>
          )}

      {/* ── STEP 1: Sub-topic Draw ── */}
      {!confirmed && step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left: available sub-topics */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>Available Sub-topics</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>All are within "Domain-Specific AI RAG Systems"</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subTopics.map(topic => (
                <div key={topic.id} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{topic.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{topic.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: draw result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Sub-topic Draw Results</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {tracks.map(track => (
                  <div key={track.id} style={{ padding: '16px', background: track.bg, border: `1px solid ${track.border}`, borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: track.color, fontSize: '15px' }}>{track.name}</span>
                      {track.subTopic
                        ? <span style={{ background: track.bg, border: `1px solid ${track.border}`, color: track.color, fontSize: '11px', padding: '2px 8px', borderRadius: '8px' }}>Topic assigned</span>
                        : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Awaiting draw...</span>
                      }
                    </div>
                    {track.subTopic && (
                      <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: '600' }}>{track.subTopic.name}</div>
                    )}
                    {!track.subTopic && drawing && (
                      <div style={{ marginTop: '10px', height: '20px', background: 'var(--bg-hover)', borderRadius: '4px', animation: 'pulse 1s infinite' }} />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {topicDrawn ? (
                  <>
                    <button onClick={handleRedrawTopics} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                      <RefreshCw size={15} /> Redraw
                    </button>
                    <button onClick={() => setStep(2)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: '6px' }}>
                      Next Step <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <button onClick={handleDrawTopics} disabled={drawing} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', gap: '8px', background: 'var(--primary)' }}>
                    <Shuffle size={16} /> {drawing ? 'Drawing...' : 'Random Draw'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Team Assignment ── */}
      {!confirmed && step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Unassigned teams */}
          {!teamsAssigned && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Unassigned Teams</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{unassignedTeams.length} teams • Max 8 teams/track</p>
                </div>
                <button onClick={handleAssignTeams} disabled={drawing} className="btn btn-primary" style={{ gap: '8px', background: 'var(--primary)' }}>
                  <Shuffle size={16} /> {drawing ? 'Assigning...' : 'Auto Assign Teams'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {unassignedTeams.map(team => (
                  <div key={team.id || team.name} style={{ padding: '6px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} color="var(--text-secondary)" /> {team.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Track results */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {tracks.map(track => (
              <div key={track.id} className="glass-panel" style={{ padding: '20px', border: `1px solid ${track.border}` }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '18px', color: track.color }}>{track.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '8px' }}>
                      {track.teams.length}/8
                    </span>
                  </div>
                  {track.subTopic && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 10px', background: track.bg, borderRadius: '6px' }}>
                      📋 {track.subTopic.name}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {track.teams.length === 0 && !drawing && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>No teams</div>
                  )}
                  {drawing && track.teams.length === 0 && (
                    [...Array(3)].map((_, i) => (
                      <div key={i} style={{ height: '32px', background: 'var(--bg-hover)', borderRadius: '6px', animation: 'pulse 0.8s infinite', animationDelay: `${i * 0.15}s` }} />
                    ))
                  )}
                  {track.teams.map((team, i) => (
                    <div key={team.id || team.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: track.bg, border: `1px solid ${track.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: track.color, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{team.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {teamsAssigned && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleResetTeams} className="btn btn-secondary" style={{ gap: '6px' }}>
                <RefreshCw size={15} /> Reassign
              </button>
              <button onClick={() => setStep(3)} className="btn btn-primary" style={{ gap: '6px' }}>
                Next Step <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Confirm ── */}
      {(confirmed || step === 3) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', border: confirmed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)', background: confirmed ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.04)' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>
              {confirmed ? 'Track Draw Results' : 'Confirm Draw Results'}
            </h3>
            {!confirmed && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.7' }}>
                Once confirmed, the results will be <strong>published to all participants</strong>. Teams will see their assigned Track and Sub-topic in their accounts.
              </p>
            )}

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', marginTop: confirmed ? '24px' : '0' }}>
              {tracks.map(track => (
                <div key={track.id} style={{ padding: '16px', background: track.bg, border: `1px solid ${track.border}`, borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', color: track.color, fontSize: '16px', marginBottom: '4px' }}>{track.name}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>{track.subTopic?.name ?? '—'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> {track.teams.length} teams
                  </div>
                  {confirmed && track.teams.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {track.teams.map((t, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>• {t.name || t}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && !confirmed && (
              <div className={shaking ? 'shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', animation: shaking ? 'shake 0.4s ease-in-out' : 'none' }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {!confirmed && (
              <button onClick={handleConfirm} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px', gap: '8px', background: 'var(--primary)', boxShadow: '0 4px 20px rgba(245,158,11,0.4)' }}>
                <Lock size={16} /> Confirm & Publish Results
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <CheckCircle size={20} color="var(--success)" />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Draw Completed!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{toast}</div>
          </div>
        </div>
      )}
      </>
      )}

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default TrackDraw;
