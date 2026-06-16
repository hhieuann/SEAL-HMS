import React, { useState } from 'react';
import { Shield, Filter } from 'lucide-react';
import { useParams } from 'react-router-dom';

const eventAuditLog = [
  { action: 'Score Modified', user: 'Judge Alan Turing', target: 'NullPointerException', detail: 'Impact score changed: 40 → 45', time: 'May 19, 2026 — 14:32:18', severity: 'medium' },
  { action: 'Team Disqualified', user: 'Coordinator', target: 'ByteStrike', detail: 'Reason: Plagiarism (AI similarity 92%)', time: 'May 17, 2026 — 09:10:05', severity: 'high' },
  { action: 'Account Approved', user: 'Coordinator', target: 'Dr. Pham Hung', detail: 'Guest Judge account activated', time: 'May 16, 2026 — 11:00:00', severity: 'low' },
  { action: 'Results Published', user: 'Coordinator', target: 'Qualifying Round', detail: 'Scores made visible to all participants', time: 'May 16, 2026 — 08:00:00', severity: 'low' },
  { action: 'Penalty Applied', user: 'Coordinator', target: 'DataSculpt', detail: '-5 pts. Late submission (12 min)', time: 'May 18, 2026 — 14:30:00', severity: 'medium' },
  { action: 'Score Submitted', user: 'Judge Ada Lovelace', target: 'Byte Me', detail: 'Final score submitted: 88.0/100', time: 'May 15, 2026 — 22:15:44', severity: 'low' },
];

const globalAuditLog = [
  { action: 'Event Created', user: 'Coordinator', target: 'Summer DevFest 2026', detail: 'New hackathon initialized with 3 tracks', time: '10 min ago', severity: 'low' },
  { action: 'System Backup', user: 'System', target: 'Database Snapshot #4091', detail: 'Automated full database snapshot completed', time: '1 hour ago', severity: 'low' },
  { action: 'Accounts Invited', user: 'Coordinator', target: 'Spring Innovation 2026', detail: '15 new judges invited via email', time: '3 hours ago', severity: 'medium' },
  { action: 'Global Setting Changed', user: 'SuperAdmin', target: 'SMTP Config', detail: 'Updated outbound email server credentials', time: 'Yesterday', severity: 'high' },
  { action: 'Account Suspended', user: 'System', target: 'Ada Lovelace', detail: 'Suspended due to anomalous login attempts', time: 'May 12, 2026', severity: 'high' }
];

const AnalyticsLog = () => {
  const { eventId } = useParams();
  const [filter, setFilter] = useState('all');
  
  const currentLog = eventId ? eventAuditLog : globalAuditLog;
  const filtered = filter === 'all' ? currentLog : currentLog.filter(l => l.severity === filter);
  const severityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
  const severityBg = { high: 'rgba(239,68,68,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{eventId ? `Audit Log: ${eventId.toUpperCase()}` : 'Global System Audit Log'}</h1>
          <p className="subtitle">{eventId ? 'Track every action taken within this specific event.' : 'Track platform-wide actions, configurations, and system health.'}</p>
        </div>
        <button className="btn btn-secondary">Export Audit Log</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Audit Log */}
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} color="var(--accent-3)" /> {eventId ? 'Event Audit Trail' : 'System Audit Log'}</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Filter size={14} color="var(--text-secondary)" />
              {['all', 'high', 'medium', 'low'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 10px', borderRadius: '8px', border: `1px solid ${filter === f ? severityColor[f] || 'var(--primary)' : 'var(--border-color)'}`, background: filter === f ? (severityBg[f] || 'rgba(59,130,246,0.1)') : 'transparent', color: filter === f ? (severityColor[f] || 'var(--primary)') : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize', fontWeight: '600' }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px' }}>
            {filtered.map((entry, i) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: severityColor[entry.severity], flexShrink: 0, marginTop: '6px' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{entry.action}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: severityBg[entry.severity], color: severityColor[entry.severity], fontWeight: '600', textTransform: 'uppercase' }}>{entry.severity}</span>
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}><span style={{ color: 'var(--primary)' }}>{entry.user}</span> → <span style={{ color: 'var(--text-secondary)' }}>{entry.target}</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{entry.detail}</div>
                  <div style={{ fontSize: '11px', color: 'var(--bg-active)' }}>{entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsLog;
