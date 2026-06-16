import React, { useState } from 'react';
import { AlertTriangle, Ban, Minus, Plus, RefreshCw, Scale, AlertCircle, CheckCircle } from 'lucide-react';

const Courtroom = () => {
  const [selectedTeam, setSelectedTeam] = useState('NullPointerException');
  const [action, setAction] = useState('penalty');
  const [points, setPoints] = useState(5);
  const [reason, setReason] = useState('Using unauthorized third-party API during the offline phase.');
  const [errorMsg, setErrorMsg] = useState('');
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState('');
  const [log, setLog] = useState([
    { team: 'DataSculpt', type: 'penalty', points: -5, reason: 'Late submission (12 min past deadline)', by: 'Admin', time: 'May 18, 14:30' },
    { team: 'ByteStrike', type: 'disqualified', points: null, reason: 'Code plagiarism detected — AI similarity 92%', by: 'Admin', time: 'May 17, 09:10' },
  ]);

  const teams = ['NullPointerException', 'BeaconAnalytics', 'CircuitCare', 'DataSculpt', 'Byte Me', '404 Brain Not Found'];

  const handleApply = () => {
    setErrorMsg('');

    if (action !== 'disqualified' && points === 0) {
      setErrorMsg(`Please specify the number of ${action} points.`);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Reason / Evidence is mandatory for this action.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    const entry = { team: selectedTeam, type: action, points: action === 'penalty' ? -points : action === 'bonus' ? +points : null, reason, by: 'Coordinator', time: 'Just now' };
    setLog([entry, ...log]);
    setReason('');
    setPoints(0);
    
    setToast(`Action applied successfully for ${selectedTeam}`);
    setTimeout(() => setToast(''), 3000);
  };

  const typeColor = { penalty: 'var(--danger)', bonus: 'var(--success)', disqualified: '#ff4500' };
  const typeLabel = { penalty: 'Penalty', bonus: 'Bonus', disqualified: 'Disqualified' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={24} color="var(--danger)" />
          </div>
          <div>
            <h1>The Courtroom</h1>
            <p className="subtitle">Issue penalties, bonuses, or disqualifications. Triggers automatic leaderboard recalculation.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' }}>
        {/* Left: Action Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--danger)" /> Issue Ruling
            </h3>

            {/* Error Message UI */}
            {errorMsg && (
              <div
                className={shaking ? 'shake' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', marginBottom: '20px',
                  animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
                }}
              >
                <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Team</label>
              <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Action Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['penalty', 'bonus', 'disqualified'].map(a => (
                  <button key={a} onClick={() => setAction(a)} style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${action === a ? typeColor[a] : 'var(--border-color)'}`, background: action === a ? `rgba(${a === 'penalty' ? '239,68,68' : a === 'bonus' ? '16,185,129' : '255,69,0'},0.1)` : 'transparent', color: action === a ? typeColor[a] : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', transition: 'var(--transition)' }}>
                    {typeLabel[a]}
                  </button>
                ))}
              </div>
            </div>

            {action !== 'disqualified' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Points</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setPoints(Math.max(0, points - 1))} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: '32px', fontWeight: '800', color: action === 'penalty' ? 'var(--danger)' : 'var(--success)' }}>
                    {action === 'penalty' ? '-' : '+'}{points}
                  </div>
                  <button onClick={() => setPoints(points + 1)} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Reason / Evidence *</label>
              <textarea value={reason} onChange={e => { setReason(e.target.value); setErrorMsg(''); }} placeholder="Describe the violation or reason for this ruling..." rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', borderColor: errorMsg && !reason.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)' }} />
            </div>

            <button onClick={handleApply} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: action === 'disqualified' ? 'linear-gradient(135deg, #ff4500, #dc2626)' : action === 'bonus' ? 'linear-gradient(135deg, var(--success), #059669)' : 'linear-gradient(135deg, var(--danger), #dc2626)', boxShadow: 'none' }}>
              {action === 'disqualified' ? <Ban size={16} /> : action === 'bonus' ? <Plus size={16} /> : <Minus size={16} />}
              {action === 'disqualified' ? 'Disqualify Team' : `Apply ${typeLabel[action]} & Recalculate`}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={16} color="var(--warning)" />
            After applying any ruling, the global leaderboard is automatically recalculated and results are updated in real-time.
          </div>
        </div>

        {/* Right: Ruling Log */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '18px' }}>Ruling History</h3>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
            {log.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>No rulings issued yet.</div>
            ) : log.map((entry, i) => (
              <div key={i} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `rgba(${entry.type === 'penalty' ? '239,68,68' : entry.type === 'bonus' ? '16,185,129' : '255,69,0'},0.15)`, border: `1px solid rgba(${entry.type === 'penalty' ? '239,68,68' : entry.type === 'bonus' ? '16,185,129' : '255,69,0'},0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {entry.type === 'disqualified' ? <Ban size={18} color="#ff4500" /> : entry.type === 'bonus' ? <Plus size={18} color="var(--success)" /> : <Minus size={18} color="var(--danger)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{entry.team}</span>
                    {entry.points !== null && <span style={{ fontWeight: '800', fontSize: '18px', color: typeColor[entry.type] }}>{entry.points > 0 ? '+' : ''}{entry.points}</span>}
                    {entry.type === 'disqualified' && <span style={{ color: '#ff4500', fontWeight: '700', fontSize: '13px', background: 'rgba(255,69,0,0.1)', padding: '4px 10px', borderRadius: '8px' }}>DISQUALIFIED</span>}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>{entry.reason}</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>By {entry.by} • {entry.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--bg-glass)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Success</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{toast}</div>
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
    </div>
  );
};

export default Courtroom;
