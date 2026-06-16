import React, { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Search, ChevronDown, ChevronUp, Star, Filter } from 'lucide-react';

const scoredSubmissions = [
  {
    id: 1, team: 'BeaconAnalytics', track: 'Track B - Medical RAG', project: 'Clinical Decision Support RAG',
    submittedAt: 'Apr 12, 2026 • 14:12',
    scores: { impact: 48, tech: 28, design: 17, presentation: 9 }, total: 102,
    comment: 'Excellent integration with medical literature databases. Impressive retrieval accuracy.',
    status: 'final'
  },
  {
    id: 2, team: 'CircuitCare', track: 'Track B - Medical RAG', project: 'PharmaRAG Assistant',
    submittedAt: 'Apr 12, 2026 • 15:30',
    scores: { impact: 42, tech: 25, design: 15, presentation: 8 }, total: 90,
    comment: 'Creative approach to pharmaceutical knowledge retrieval but hallucination detection needs improvement.',
    status: 'final'
  },
  {
    id: 3, team: 'NullPointerException', track: 'Track B - Medical RAG', project: 'Medical Knowledge RAG System',
    submittedAt: 'Apr 12, 2026 • 16:05',
    scores: { impact: 45, tech: 26, design: 18, presentation: 9 }, total: 98,
    comment: 'Strong technical depth. Multi-hop reasoning and Ragas evaluation were standout features.',
    status: 'draft'
  },
  {
    id: 4, team: 'DataSculpt', track: 'Track B - Medical RAG', project: 'MedSearch Engine',
    submittedAt: 'Apr 12, 2026 • 17:22',
    scores: { impact: 35, tech: 20, design: 14, presentation: 7 }, total: 76,
    comment: 'Solid RAG pipeline, but limited domain coverage and weak anti-hallucination mechanisms.',
    status: 'flagged'
  },
];

const statusConfig = {
  final:   { label: 'Submitted',  color: 'var(--success)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  icon: <CheckCircle size={14} /> },
  draft:   { label: 'Draft',      color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  icon: <Clock size={14} /> },
  flagged: { label: 'Flagged',    color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   icon: <AlertTriangle size={14} /> },
};

const criteria = [
  { key: 'impact',       label: 'Impact',               max: 50, color: 'var(--primary)' },
  { key: 'tech',         label: 'Technical',             max: 30, color: 'var(--accent-1)' },
  { key: 'design',       label: 'Design & UX',           max: 20, color: 'var(--accent-3)' },
  { key: 'presentation', label: 'Presentation',          max: 10, color: 'var(--warning)' },
];

const ScoringHistory = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filtered = scoredSubmissions.filter(s => {
    const matchSearch = s.team.toLowerCase().includes(search.toLowerCase()) || s.project.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const totalFinal = scoredSubmissions.filter(s => s.status === 'final').length;
  const avgScore = Math.round(scoredSubmissions.filter(s => s.status === 'final').reduce((sum, s) => sum + s.total, 0) / totalFinal);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Scoring History</h1>
          <p className="subtitle">Review and manage all your scored submissions.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Assigned',  value: scoredSubmissions.length,  color: 'var(--primary)' },
          { label: 'Submitted',       value: totalFinal,                 color: 'var(--success)' },
          { label: 'Drafts',          value: scoredSubmissions.filter(s => s.status === 'draft').length,   color: 'var(--warning)' },
          { label: 'Avg. Score',      value: `${avgScore}/100`,          color: 'var(--accent-1)' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="var(--text-secondary)" />
          <input
            type="text" placeholder="Search team or project..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Filter size={15} color="var(--text-secondary)" style={{ alignSelf: 'center' }} />
          {['all', 'final', 'draft', 'flagged'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid', fontSize: '13px', cursor: 'pointer', fontWeight: filter === f ? '600' : '400',
                background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderColor: filter === f ? 'rgba(59,130,246,0.5)' : 'var(--border-color)',
                color: filter === f ? 'var(--primary)' : 'var(--text-secondary)'
              }}>
              {f === 'all' ? 'All' : statusConfig[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Submission List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No submissions found.</div>
        )}
        {filtered.map(sub => {
          const st = statusConfig[sub.status];
          const isOpen = expanded === sub.id;
          return (
            <div key={sub.id} className="glass-panel" style={{ overflow: 'hidden', border: isOpen ? '1px solid rgba(59,130,246,0.3)' : undefined }}>
              {/* Header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : sub.id)}
                style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--accent-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                  {sub.team[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '3px' }}>{sub.team}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{sub.project} • <span style={{ color: 'var(--primary)' }}>{sub.track}</span></div>
                </div>

                {/* Score bar preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                  <Star size={15} color="var(--warning)" />
                  <span style={{ fontSize: '20px', fontWeight: '800', color: sub.total >= 95 ? 'var(--success)' : sub.total >= 80 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                    {sub.total}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/100</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '12px', fontWeight: '600', marginRight: '8px' }}>
                  {st.icon} {st.label}
                </div>
                {isOpen ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-color)', padding: '24px', background: 'rgba(0,0,0,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Score breakdown */}
                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score Breakdown</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {criteria.map(c => {
                          const val = sub.scores[c.key];
                          const pct = (val / c.max) * 100;
                          return (
                            <div key={c.key}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                                <span style={{ fontWeight: '700', color: c.color }}>{val} / {c.max}</span>
                              </div>
                              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-active)' }}>
                                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: c.color, transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment & meta */}
                    <div>
                      <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Judge Comment</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7', background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        {sub.comment || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No comment added.</span>}
                      </p>
                      <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Submitted: {sub.submittedAt}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoringHistory;
