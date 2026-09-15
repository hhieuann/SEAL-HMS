import { useState, useEffect } from 'react';
import { Database, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import ConfirmModal from '../../components/ConfirmModal';

const STAGES = [
  { value: 'SETUP', label: 'Setup only', hint: 'Tracks, topics, rounds and criteria' },
  { value: 'TEAMS', label: 'With teams', hint: 'Adds teams and their student members' },
  { value: 'DRAWN', label: 'Drawn & assigned', hint: 'Adds the track draw, judges and mentors' },
  { value: 'SCORED', label: 'Scored', hint: 'Adds submissions and scores, ready to finalise' },
];

/**
 * Seeds a demo event so a walkthrough does not start with twenty minutes of form filling.
 *
 * Renders nothing unless the backend is running with demo mode on — the endpoints do not
 * exist otherwise, and a button that always fails is worse than no button.
 */
const DemoDataPanel = () => {
  const [available, setAvailable] = useState(false);
  const [checked, setChecked] = useState(false);
  const [form, setForm] = useState({ eventName: '', stage: 'SCORED', teams: 6, tracks: 2, membersPerTeam: 3 });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  useEffect(() => {
    adminApi.isDemoEnabled()
      .then(setAvailable)
      .finally(() => setChecked(true));
  }, []);

  if (!checked || !available) return null;

  const seed = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const created = await adminApi.seedDemoData({
        eventName: form.eventName.trim() || null,
        stage: form.stage,
        teams: Number(form.teams),
        tracks: Number(form.tracks),
        membersPerTeam: Number(form.membersPerTeam),
      });
      setResult({ kind: 'seed', ...created });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the demo data.');
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    setConfirmPurge(false);
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const removed = await adminApi.purgeDemoData();
      setResult({ kind: 'purge', ...removed });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove the demo data.');
    } finally {
      setBusy(false);
    }
  };

  const numberField = (label, field, min, max) => (
    <div style={{ flex: 1, minWidth: '80px' }}>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
    </div>
  );

  return (
    <div className="panel glass-panel">
      <div className="panel-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--primary)" /> Demo data
        </h2>
      </div>
      <div style={{ padding: '0 24px 24px 24px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
          Builds a complete event to demonstrate with. Everything it creates is marked
          <strong> [DEMO]</strong> and can be removed again in one click.
        </p>

        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Event name</label>
        <input
          type="text"
          value={form.eventName}
          onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
          placeholder="Hackathon 2026"
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' }}
        />

        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>How far along</label>
        <select
          value={form.stage}
          onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer' }}
        >
          {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '5px 0 12px' }}>
          {STAGES.find(s => s.value === form.stage)?.hint}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {numberField('Teams', 'teams', 2, 30)}
          {numberField('Tracks', 'tracks', 1, 6)}
          {numberField('Members', 'membersPerTeam', 1, 6)}
        </div>

        {error && (
          <div style={{ padding: '9px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {result?.kind === 'seed' && (
          <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', fontSize: '12px', marginBottom: '12px', lineHeight: '1.7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--success)' }}>
              <CheckCircle size={14} /> {result.eventName}
            </div>
            {result.teams > 0 && <div>{result.teams} teams · {result.students} students · {result.assignments} assignments</div>}
            <div style={{ color: 'var(--text-secondary)' }}>Demo accounts sign in with <strong>{result.demoPassword}</strong></div>
          </div>
        )}

        {result?.kind === 'purge' && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
            Removed {result.eventsRemoved} demo event{result.eventsRemoved === 1 ? '' : 's'} and {result.accountsRemoved} demo account{result.accountsRemoved === 1 ? '' : 's'}.
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={seed} disabled={busy}>
            {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Database size={15} />}
            {busy ? 'Working…' : 'Create demo event'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
            onClick={() => setConfirmPurge(true)}
            disabled={busy}
            title="Remove every demo event and demo account"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmPurge}
        title="Remove all demo data?"
        message="Every event marked [DEMO] and every demo account will be deleted, along with their teams, submissions and scores. Real events and real accounts are not touched."
        confirmText="Remove demo data"
        type="danger"
        onConfirm={purge}
        onClose={() => setConfirmPurge(false)}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DemoDataPanel;
