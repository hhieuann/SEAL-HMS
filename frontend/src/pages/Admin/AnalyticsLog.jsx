import React, { useState, useEffect } from 'react';
import { Shield, Filter, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const getSeverity = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('suspend') || a.includes('disqualif') || a.includes('delete') || a.includes('ban') || a.includes('reject')) return 'high';
  if (a.includes('modify') || a.includes('update') || a.includes('change') || a.includes('penalty') || a.includes('warn')) return 'medium';
  return 'low';
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return dateStr; }
};

const AnalyticsLog = () => {
  const { eventId } = useParams();
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (eventId && eventId !== 'seal-sp26') params.eventId = eventId;
      const res = await apiClient.get('/api/v1/audit-logs', { params });
      const raw = res.data?.data || res.data || [];
      const mapped = raw.map(entry => ({
        action: entry.action || 'Unknown Action',
        user: entry.actorEmail || 'System',
        target: entry.entityType
          ? `${entry.entityType}${entry.entityId ? ` #${entry.entityId}` : ''}`
          : '—',
        detail: entry.detail || '',
        time: formatTime(entry.createdAt),
        severity: getSeverity(entry.action),
      }));
      setLogs(mapped);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
      setError('Could not load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventId]);

  const severityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
  const severityBg   = { high: 'rgba(239,68,68,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)' };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.severity === filter);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{eventId ? `Audit Log: ${eventId.toUpperCase()}` : 'Global System Audit Log'}</h1>
          <p className="subtitle">
            {eventId
              ? 'Track every action taken within this specific event.'
              : 'Track platform-wide actions, configurations, and system health.'}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchLogs}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header + Filter */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--accent-3)" />
              {eventId ? 'Event Audit Trail' : 'System Audit Log'}
            </h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={14} color="var(--text-secondary)" />
              {['all', 'high', 'medium', 'low'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${filter === f ? (severityColor[f] || 'var(--primary)') : 'var(--border-color)'}`,
                    background: filter === f ? (severityBg[f] || 'rgba(59,130,246,0.1)') : 'transparent',
                    color: filter === f ? (severityColor[f] || 'var(--primary)') : 'var(--text-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: '600',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '520px' }}>
            {loading && (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
                <p>Loading audit logs...</p>
              </div>
            )}

            {!loading && error && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                <AlertTriangle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p>{error}</p>
                <button className="btn btn-secondary" onClick={fetchLogs} style={{ marginTop: '12px' }}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Shield size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p>No audit log entries found{filter !== 'all' ? ` for severity "${filter}"` : ''}.</p>
              </div>
            )}

            {!loading && !error && filtered.map((entry, i) => (
              <div
                key={i}
                style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: severityColor[entry.severity], flexShrink: 0, marginTop: '6px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{entry.action}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: severityBg[entry.severity], color: severityColor[entry.severity], fontWeight: '600', textTransform: 'uppercase' }}>
                      {entry.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--primary)' }}>{entry.user}</span>
                    {' → '}
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.target}</span>
                  </div>
                  {entry.detail && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{entry.detail}</div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{entry.time}</div>
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
