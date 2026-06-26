import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Target, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { criterionService } from '../../api/scoreService';
import { eventService } from '../../api/eventService';

const CriteriaManager = () => {
  const [event, setEvent] = useState(null);
  const [criteria, setCriteria] = useState({});  // roundId -> criteria[]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Form state per round
  const [newCriterion, setNewCriterion] = useState({}); // roundId -> { name, maxScore, weight }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventService.getEvents();
        const evt = res?.data?.[0] || null;
        setEvent(evt);

        if (evt?.rounds) {
          const criteriaMap = {};
          for (const round of evt.rounds) {
            try {
              const cRes = await criterionService.getCriteria(round.id);
              criteriaMap[round.id] = cRes?.data || [];
            } catch {
              criteriaMap[round.id] = [];
            }
          }
          setCriteria(criteriaMap);
        }
      } catch (e) {
        setError('Failed to load event data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNewChange = (roundId, field, value) => {
    setNewCriterion(prev => ({
      ...prev,
      [roundId]: { ...(prev[roundId] || { name: '', maxScore: 10, weight: 1 }), [field]: value }
    }));
  };

  const handleAdd = async (roundId) => {
    const form = newCriterion[roundId];
    if (!form?.name?.trim()) { setError('Criterion name is required.'); return; }
    setSaving(prev => ({ ...prev, [roundId]: true }));
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        maxScore: parseFloat(form.maxScore) || 10,
        weight: (parseFloat(form.weight) || 50) / 100, // convert % input to 0-1 decimal for BE
      };
      const res = await criterionService.createCriterion(roundId, payload);
      setCriteria(prev => ({
        ...prev,
        [roundId]: [...(prev[roundId] || []), res.data]
      }));
      setNewCriterion(prev => ({ ...prev, [roundId]: { name: '', maxScore: 10, weight: 50 } }));
      setToast('Criterion added!');
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      setError('Failed to add criterion: ' + (e?.response?.data?.message || e.message));
    } finally {
      setSaving(prev => ({ ...prev, [roundId]: false }));
    }
  };

  const handleDelete = async (roundId, criterionId) => {
    if (!window.confirm('Delete this criterion?')) return;
    try {
      await criterionService.deleteCriterion(criterionId);
      setCriteria(prev => ({
        ...prev,
        [roundId]: (prev[roundId] || []).filter(c => c.id !== criterionId)
      }));
      setToast('Criterion deleted.');
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      setError('Failed to delete criterion.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <p>Loading criteria...</p>
      </div>
    );
  }

  const rounds = event?.rounds || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Criteria Manager</h1>
          <p className="subtitle">Define scoring criteria for each round. Judges will use these to grade submissions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>
          <Target size={15} /> {rounds.length} Rounds
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', color: '#ef4444', fontSize: '13px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {rounds.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No rounds found. Create an event with rounds first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {rounds.map((round) => {
            const roundCriteria = criteria[round.id] || [];
            const form = newCriterion[round.id] || { name: '', maxScore: 10, weight: 50 };
            const totalMax = roundCriteria.reduce((s, c) => s + (parseFloat(c.maxScore) || 0), 0);

            return (
              <div key={round.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{round.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {roundCriteria.length} criteria · Total max: <strong>{totalMax} pts</strong>
                    </p>
                  </div>
                </div>

                {/* Existing Criteria */}
                {roundCriteria.length > 0 ? (
                  <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {roundCriteria.map((c) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <Target size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>{c.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Max: <strong style={{ color: 'var(--primary)' }}>{c.maxScore}</strong></span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Weight: <strong style={{ color: 'var(--primary)' }}>{Math.round((c.weight || 0) * 100)}%</strong></span>
                        </div>
                        <button
                          onClick={() => handleDelete(round.id, c.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderRadius: '10px', marginBottom: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No criteria yet for this round. Add one below.
                  </div>
                )}

                {/* Add new criterion */}
                <div style={{ padding: '16px', background: 'var(--bg-hover)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Criterion</div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Criterion Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => handleNewChange(round.id, 'name', e.target.value)}
                        placeholder="e.g. Innovation, Technical Depth..."
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                        onKeyDown={e => e.key === 'Enter' && handleAdd(round.id)}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Max Score</label>
                      <input
                        type="number" min="1" max="100" step="0.5"
                        value={form.maxScore}
                        onChange={e => handleNewChange(round.id, 'maxScore', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Weight (%)</label>
                       <input
                         type="number" min="1" max="100" step="1"
                         value={form.weight}
                         onChange={e => handleNewChange(round.id, 'weight', e.target.value)}
                         placeholder="e.g. 50"
                         style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', fontSize: '13px' }}
                       />
                    </div>
                    <button
                      onClick={() => handleAdd(round.id)}
                      disabled={saving[round.id]}
                      className="btn btn-primary"
                      style={{ padding: '10px 20px', flexShrink: 0, gap: '6px' }}
                    >
                      {saving[round.id] ? <RefreshCw size={15} /> : <Plus size={15} />}
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <CheckCircle size={18} color="var(--success)" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default CriteriaManager;
