import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, CheckCircle, AlertCircle, Lock, XCircle, Users } from 'lucide-react';

const RoundTransition = () => {
  const [confirmed, setConfirmed] = useState(false);
  const [lockError, setLockError] = useState(false);
  const [lockShaking, setLockShaking] = useState(false);
  const [lockToast, setLockToast] = useState(false);
  const [resolvedTies, setResolvedTies] = useState({});
  const [activeTrack, setActiveTrack] = useState('A');

  const trackStandings = [
    {
      id: 'A',
      name: 'Track A - AI Agent',
      color: 'var(--primary)',
      teams: [
        { rank: 1, team: 'DeepMind Innovators', score: 95.0, status: 'advance', tied: false },
        { rank: 2, team: 'CodeCraft', score: 91.0, status: 'advance', tied: false },
        { rank: 3, team: 'CyberShield', score: 88.0, status: 'eliminate', tied: false },
        { rank: 4, team: 'VectorDB', score: 82.0, status: 'eliminate', tied: false },
      ]
    },
    {
      id: 'B',
      name: 'Track B - Medical RAG',
      color: 'var(--accent-1)',
      teams: [
        { rank: 1, team: 'NullPointerException', score: 89.5, status: 'tiebreak', tied: true },
        { rank: 1, team: 'CircuitCare', score: 89.5, status: 'tiebreak', tied: true },
        { rank: 3, team: 'BeaconAnalytics', score: 88.0, status: 'eliminate', tied: false },
        { rank: 4, team: 'DataSculpt', score: 85.0, status: 'eliminate', tied: false },
      ]
    },
    {
      id: 'C',
      name: 'Track C - EduTech',
      color: 'var(--accent-3)',
      teams: [
        { rank: 1, team: 'EduNova', score: 96.0, status: 'advance', tied: false },
        { rank: 2, team: 'CloudNine', score: 90.0, status: 'advance', tied: false },
        { rank: 3, team: 'Byte Me', score: 86.5, status: 'eliminate', tied: false },
        { rank: 4, team: 'TechNova', score: 84.0, status: 'eliminate', tied: false },
      ]
    }
  ];

  const tiebreakerTeams = trackStandings.flatMap(track => track.teams.filter(t => t.status === 'tiebreak').map(t => ({ ...t, trackId: track.id, trackName: track.name })));
  const allTiesResolved = tiebreakerTeams.every(t => resolvedTies[t.team]);

  const handleLock = () => {
    if (!allTiesResolved) {
      setLockError(true);
      setLockShaking(true);
      setTimeout(() => setLockShaking(false), 500);
      return;
    }
    setLockError(false);
    setConfirmed(true);
    setLockToast(true);
    setTimeout(() => setLockToast(false), 3000);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Round Transition & Penalty</h1>
          <p className="subtitle">SEAL Hackathon Spring 2026 — Select Top 2 teams from each track for the Final Round.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary">Export Results CSV</button>
          <button onClick={handleLock} disabled={confirmed} className="btn btn-primary" style={{ background: confirmed ? 'rgba(16,185,129,0.3)' : lockError ? 'var(--danger)' : 'var(--primary)', cursor: confirmed ? 'not-allowed' : 'pointer', gap: '8px', animation: lockShaking ? 'shake 0.4s ease-in-out' : 'none', padding: '10px 24px' }}>
            {confirmed ? <><CheckCircle size={16} /> List Finalized</> : <><Lock size={16} /> Finalize & Advance to Final Round</>}
          </button>
        </div>
      </div>

      {/* Lock Error Banner */}
      {lockError && !allTiesResolved && (
        <div
          className={lockShaking ? 'shake' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '14px', marginBottom: '24px',
            animation: lockShaking ? 'shake 0.4s ease-in-out' : 'none',
          }}
        >
          <XCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#ef4444', marginBottom: '2px' }}>Cannot finalize the list!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>There are tied teams at the cutoff (Top 2). Please resolve via Penalty Evaluation first.</div>
          </div>
        </div>
      )}

      {/* Tiebreaker Alert */}
      {tiebreakerTeams.length > 0 && (
        <div style={{ padding: '24px', background: 'linear-gradient(to right, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', marginBottom: '28px', display: 'flex', gap: '20px' }}>
          <AlertTriangle size={28} color="var(--warning)" style={{ flexShrink: 0, marginTop: '4px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', color: 'var(--warning)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Tie-break / Penalty Required
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              According to Rulebook Section 7, the following teams have <strong>tied scores</strong> and are competing for the Top 2 cutoff. Judges must conduct a rapid evaluation via Q&A/mini-test (10 mins) to determine who advances before the system locks results.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {tiebreakerTeams.map((t, i) => (
                <div key={i} style={{ padding: '16px 20px', background: '#FFFFFF', borderRadius: '12px', border: `1px solid ${resolvedTies[t.team] === 'Advanced' ? 'rgba(16,185,129,0.5)' : resolvedTies[t.team] === 'Eliminated' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.4)'}`, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.trackName}</div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.team}</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }}>
                      {t.score} pt
                    </div>
                  </div>
                  
                  {resolvedTies[t.team] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: resolvedTies[t.team] === 'Advanced' ? 'var(--success)' : 'var(--danger)', fontWeight: '600', padding: '10px', background: resolvedTies[t.team] === 'Advanced' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                      {resolvedTies[t.team] === 'Advanced' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      Decision: {resolvedTies[t.team] === 'Advanced' ? 'Advance to Final' : 'Eliminated'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setResolvedTies(prev => ({ ...prev, [t.team]: 'Advanced' }))} style={{ flex: 1, padding: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: 'var(--success)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={15} /> Pass
                      </button>
                      <button onClick={() => setResolvedTies(prev => ({ ...prev, [t.team]: 'Eliminated' }))} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <XCircle size={15} /> Fail
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Track Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {trackStandings.map(track => (
          <button 
            key={track.id} 
            onClick={() => setActiveTrack(track.id)}
            className={`btn ${activeTrack === track.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              whiteSpace: 'nowrap',
              background: activeTrack === track.id ? track.color : 'var(--bg-hover)',
              border: activeTrack === track.id ? 'none' : '1px solid var(--border-color)',
              color: 'white',
              fontWeight: activeTrack === track.id ? '600' : '500'
            }}
          >
            {track.name}
            <div style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', fontSize: '12px' }}>
              {track.teams.length}
            </div>
          </button>
        ))}
      </div>

      {/* Standings Grid by Track */}
      <div>
        {trackStandings.filter(t => t.id === activeTrack).map(track => (
          <div key={track.id} className="glass-panel animate-fade-in" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'var(--bg-subtle)', borderBottom: `2px solid ${track.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', color: track.color }}>{track.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: '12px' }}>
                <Users size={14} /> {track.teams.length} Teams
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              {track.teams.map((s, i) => {
                const finalStatus = s.status === 'tiebreak' ? (resolvedTies[s.team] === 'Advanced' ? 'advance' : resolvedTies[s.team] === 'Eliminated' ? 'eliminate' : 'tiebreak') : s.status;
                
                return (
                  <React.Fragment key={i}>
                    {i === 2 && (
                      <div style={{ padding: '8px 24px', background: 'rgba(16,185,129,0.1)', borderTop: '1px dashed rgba(16,185,129,0.6)', borderBottom: '1px dashed rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronRight size={14} color="var(--success)" />
                        <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top 2 Cutoff</span>
                      </div>
                    )}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: finalStatus === 'advance' ? 'rgba(16,185,129,0.04)' : finalStatus === 'tiebreak' ? 'rgba(245,158,11,0.05)' : 'transparent', opacity: finalStatus === 'eliminate' ? 0.6 : 1 }}>
                      <span style={{ width: '24px', fontSize: '14px', fontWeight: '800', color: s.rank <= 2 ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center' }}>#{s.rank}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.team}</div>
                        {s.tied && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', borderRadius: '6px', fontWeight: '600' }}>TIED</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: finalStatus === 'advance' ? 'var(--success)' : finalStatus === 'tiebreak' ? 'var(--warning)' : 'var(--text-secondary)' }}>{s.score}</div>
                        {finalStatus === 'advance' && <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}><CheckCircle size={12} /> Advance</span>}
                        {finalStatus === 'tiebreak' && <span style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}><AlertCircle size={12} /> Review</span>}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {lockToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>List Finalized!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>The top 6 teams (Top 2 from each track) have been advanced to the Final Round.</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </>
  );
};

export default RoundTransition;
