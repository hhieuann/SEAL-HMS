import { useState, useEffect, useCallback } from 'react';
import { Server, CheckCircle2, XCircle, MinusCircle, RefreshCw, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

const formatBytes = (bytes) => {
  if (typeof bytes !== 'number') return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};

const tone = (status) => {
  if (status === 'UP') return 'var(--success)';
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return 'var(--danger)';
  return 'var(--text-secondary)';
};

const Icon = ({ status }) => {
  if (status === 'UP') return <CheckCircle2 size={14} />;
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return <XCircle size={14} />;
  return <MinusCircle size={14} />;
};

const Row = ({ label, status, title, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <span title={title} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tone(status), textAlign: 'right' }}>
      <Icon status={status} /> {children}
    </span>
  </div>
);

/**
 * Reads /actuator/health and shows it row by row. Every value comes from the backend on each
 * check — a service the system does not have (mail, backups) simply has no row.
 */
const SystemHealthPanel = () => {
  const [report, setReport] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const applyReport = useCallback((result) => {
    setReport(result);
    setCheckedAt(new Date());
  }, []);

  // getSystemHealth never rejects: an unreachable backend comes back as a report saying so.
  useEffect(() => {
    adminApi.getSystemHealth().then(applyReport);
  }, [applyReport]);

  const refresh = () => {
    setRefreshing(true);
    adminApi.getSystemHealth().then(applyReport).finally(() => setRefreshing(false));
  };

  const components = report?.components || {};
  const db = components.db;
  const disk = components.diskSpace;
  const schema = components.schema;

  // A component that answered DOWN carries its error; surface it on hover rather than in the row.
  const errorOf = (component) => component?.details?.error;
  const describe = (component, whenUp) => {
    if (!component) return 'Not reported';
    return component.status === 'UP' ? whenUp(component.details || {}) : 'Down';
  };

  return (
    <div className="panel glass-panel">
      <div className="panel-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color={report ? tone(report.status) : 'var(--text-secondary)'} /> System Health
        </h2>
        <button className="btn btn-text" onClick={refresh} disabled={refreshing || !report} title="Check again">
          <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
        </button>
      </div>
      <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
        {!report ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking…
          </div>
        ) : (
          <>
            <Row label="API" status={report.reachable ? 'UP' : 'DOWN'}>
              {report.reachable ? `Up · ${report.latencyMs} ms` : 'Unreachable'}
            </Row>
            <Row label="Database" status={db?.status} title={errorOf(db)}>
              {describe(db, d => `Up · ${d.database || 'PostgreSQL'}`)}
            </Row>
            <Row label="Disk space" status={disk?.status} title={errorOf(disk)}>
              {describe(disk, d => `${formatBytes(d.free) || '?'} free of ${formatBytes(d.total) || '?'}`)}
            </Row>
            <Row label="Schema" status={schema?.status} title={schema?.details?.description || errorOf(schema)}>
              {describe(schema, d => d.version || 'Up')}
            </Row>
          </>
        )}
        {checkedAt && (
          <div style={{ marginTop: '8px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Checked at {checkedAt.toLocaleTimeString('en-GB')}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SystemHealthPanel;
