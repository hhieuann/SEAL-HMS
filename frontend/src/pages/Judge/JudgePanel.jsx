import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Play, FileText, Code, LayoutGrid, AlertTriangle, CheckCircle, AlertCircle, Shield, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './JudgePanel.css';

const DEFAULT_RUBRICS = {
  qualifying: {
    label: 'Qualifying Round',
    labelEn: 'Qualifying Round',
    color: 'var(--primary)',
    criteria: [
      { key: 'domainAccuracy', label: 'Domain Accuracy & Relevance', labelVi: 'Domain Accuracy & Relevance', weight: '30%', max: 30, placeholder: 'Evaluate accuracy and relevance to the specific domain...' },
      { key: 'ragArch', label: 'Agentic RAG Architecture', labelVi: 'Agentic RAG Architecture', weight: '30%', max: 30, placeholder: 'Comment on RAG system architecture and algorithms...' },
      { key: 'ideaPresentation', label: 'Idea & Presentation', labelVi: 'Idea & Presentation', weight: '15%', max: 15, placeholder: 'Evaluate creativity and presentation quality...' },
      { key: 'execution', label: 'Execution & Creativity', labelVi: 'Execution & Creativity', weight: '15%', max: 15, placeholder: 'Comment on feasibility and creativity of the solution...' },
      { key: 'ux', label: 'UX & Interactive Interface', labelVi: 'UX & Interactive Interface', weight: '10%', max: 10, placeholder: 'Evaluate UX and interactive interface...' },
    ]
  },
  finals: {
    label: 'Finals',
    labelEn: 'Finals',
    color: 'var(--warning)',
    criteria: [
      { key: 'dataQuality', label: 'Data Processing & Retrieval Quality', labelVi: 'Data Processing & Retrieval Quality', weight: '30%', max: 30, placeholder: 'Evaluate data processing and retrieval pipeline quality...' },
      { key: 'reliability', label: 'Reliability & Anti-hallucination', labelVi: 'Reliability & Anti-hallucination', weight: '20%', max: 20, placeholder: 'Comment on accuracy and anti-hallucination mechanisms...' },
      { key: 'agentThinking', label: 'Agent Thinking & Multi-layer', labelVi: 'Agent Thinking & Multi-layer', weight: '20%', max: 20, placeholder: 'Evaluate reasoning and multi-layer processing capability...' },
      { key: 'practicality', label: 'Practicality & Operational Efficiency', labelVi: 'Practicality & Operational Efficiency', weight: '20%', max: 20, placeholder: 'Comment on practicality and operational efficiency...' },
      { key: 'scalability', label: 'Scalability & Creativity', labelVi: 'Scalability & Creativity', weight: '10%', max: 10, placeholder: 'Evaluate scalability potential and breakthrough creativity...' },
    ]
  }
};

const initScores = (rubric) => Object.fromEntries(rubric.criteria.map(c => [c.key, Math.floor(c.max * 0.7)]));

const submissions = [
  { id: 1, name: 'NullPointerException', track: 'Track B', subTopic: 'Medical Knowledge RAG', status: 'pending', letter: 'N', color: '#8b5cf6' },
  { id: 2, name: 'BeaconAnalytics', track: 'Track B', subTopic: 'Medical Knowledge RAG', status: 'scored', score: 92, letter: 'B', color: '#3b82f6' },
  { id: 3, name: 'CircuitCare', track: 'Track B', subTopic: 'Medical Knowledge RAG', status: 'in-review', letter: 'C', color: '#10b981' },
  { id: 4, name: 'DataSculpt', track: 'Track B', subTopic: 'Medical Knowledge RAG', status: 'flagged', letter: 'D', color: '#ef4444' },
];

const JudgePanel = () => {
  const navigate = useNavigate();
  const [rubrics, setRubrics] = useState(DEFAULT_RUBRICS);
  const [activeProject, setActiveProject] = useState(1);
  const [round, setRound] = useState('qualifying');
  const [scores, setScores] = useState({ qualifying: initScores(DEFAULT_RUBRICS.qualifying), finals: initScores(DEFAULT_RUBRICS.finals) });
  const [submitError, setSubmitError] = useState('');
  const [submitShaking, setSubmitShaking] = useState(false);
  const [submitToast, setSubmitToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('event_settings_seal_sp26');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.rounds && parsed.rounds.length > 0) {
          const loadedRubrics = {};
          
          if (parsed.rounds[0]) {
            loadedRubrics.qualifying = {
              label: parsed.rounds[0].name || 'Qualifying Round',
              labelEn: 'Qualifying Round',
              color: 'var(--primary)',
              criteria: parsed.rounds[0].criteria.map((c, i) => ({
                key: `q_crit_${i}`, label: c.name, labelVi: c.name, weight: `${c.weight}%`, max: c.weight, placeholder: `Evaluate ${c.name}...`
              }))
            };
          }
          
          if (parsed.rounds[1]) {
            loadedRubrics.finals = {
              label: parsed.rounds[1].name || 'Finals',
              labelEn: 'Finals',
              color: 'var(--warning)',
              criteria: parsed.rounds[1].criteria.map((c, i) => ({
                key: `f_crit_${i}`, label: c.name, labelVi: c.name, weight: `${c.weight}%`, max: c.weight, placeholder: `Evaluate ${c.name}...`
              }))
            };
          } else if (parsed.rounds[0]) {
            loadedRubrics.finals = { ...loadedRubrics.qualifying, label: 'Finals (Backup)' };
          }
          
          setRubrics(loadedRubrics);
          setScores({
            qualifying: initScores(loadedRubrics.qualifying),
            finals: initScores(loadedRubrics.finals)
          });
        }
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const rubric = rubrics[round];
  const currentScores = scores[round] || {};
  const total = Object.values(currentScores).reduce((a, b) => a + (Number(b) || 0), 0);
  const maxTotal = rubric ? rubric.criteria.reduce((a, c) => a + c.max, 0) : 100;

  const setScore = (key, val) => {
    setScores(prev => ({ ...prev, [round]: { ...prev[round], [key]: val } }));
  };

  const handleSubmitScore = () => {
    setSubmitError('');
    if (total === 0) {
      setSubmitError('No scores assigned. Please adjust the sliders before submitting.');
      setSubmitShaking(true); setTimeout(() => setSubmitShaking(false), 500); return;
    }
    if (total < 10) {
      setSubmitError(`Total score is only ${total}/${maxTotal}. Please review all criteria.`);
      setSubmitShaking(true); setTimeout(() => setSubmitShaking(false), 500); return;
    }
    setIsSubmitting(true);
    setTimeout(() => { setIsSubmitting(false); setSubmitToast(true); setTimeout(() => setSubmitToast(false), 3000); }, 1500);
  };

  return (
    <>
      <div className="judge-panel-container animate-fade-in">

        {/* Column 1: Submission List */}
        <div className="judge-col-left glass-panel">
          <div className="jp-header">
            <h3>Submissions</h3>
            <button className="btn btn-secondary btn-sm">Refresh</button>
          </div>
          <div className="jp-search">
            <Search size={16} color="var(--text-secondary)" />
            <input type="text" placeholder="Search teams..." />
          </div>

          {/* Round Toggle */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Scoring Round</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setRound('qualifying')} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: round === 'qualifying' ? '700' : '400', background: round === 'qualifying' ? 'rgba(59,130,246,0.15)' : 'transparent', borderColor: round === 'qualifying' ? 'rgba(59,130,246,0.5)' : 'var(--border-color)', color: round === 'qualifying' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />Qualifying
              </button>
              <button onClick={() => setRound('finals')} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: round === 'finals' ? '700' : '400', background: round === 'finals' ? 'rgba(245,158,11,0.15)' : 'transparent', borderColor: round === 'finals' ? 'rgba(245,158,11,0.5)' : 'var(--border-color)', color: round === 'finals' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                <BookOpen size={12} style={{ display: 'inline', marginRight: '4px' }} />Finals
              </button>
            </div>
          </div>

          <div className="submission-list">
            {submissions.map(sub => (
              <div key={sub.id} className={`sub-item ${activeProject === sub.id ? 'active' : ''}`} onClick={() => setActiveProject(sub.id)}>
                <div className="sub-avatar" style={{ background: sub.color }}>{sub.letter}</div>
                <div className="sub-info">
                  <h4>{sub.name}</h4>
                  <p>{sub.track} • {sub.subTopic}</p>
                </div>
                <div className="sub-status">
                  {sub.status === 'scored' && <span className="text-success fw-bold">{sub.score}</span>}
                  {sub.status === 'pending' && <span className="text-primary fw-bold">Pending</span>}
                  {sub.status === 'in-review' && <span className="text-warning fw-bold">In Review</span>}
                  {sub.status === 'flagged' && <span className="text-danger fw-bold">Flagged</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="session-notes">
            <h4>Session Notes</h4>
            <textarea placeholder="Quick notes for this session..." className="notes-input" />
          </div>
        </div>

        {/* Column 2: Project Details */}
        <div className="judge-col-mid glass-panel">
          <div className="project-header">
            <div className="ph-left">
              <h2>NullPointerException — Medical Knowledge RAG</h2>
              <div className="ph-meta">
                <span className="track-tag" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-1)', border: '1px solid rgba(139,92,246,0.3)' }}>Track B</span>
                <span style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--accent-3)', border: '1px solid rgba(20,184,166,0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '12px' }}>📋 Medical Knowledge RAG</span>
                <span>Submitted: Apr 12, 2026 • 13:48</span>
              </div>
            </div>
            <a href="https://github.com/nullpointer/medical-rag" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Play size={16} /> View Submission
            </a>
          </div>

          <div className="project-grid">
            <div className="pg-left">
              <div className="project-img-wrapper">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80" alt="Medical RAG System" className="project-preview" />
                <div className="img-overlay"><Play size={24} /></div>
              </div>
            </div>
            <div className="pg-right">
              <div className="meta-box"><label>Tech Stack</label><span>LangGraph · OpenAI SDK · Pinecone · FastAPI · React</span></div>
              <div className="meta-box"><label>Framework</label><span>Agentic RAG + Ragas Evaluation</span></div>
              <div className="meta-box"><label>Contact</label><a href="mailto:team@null.ai" className="text-primary">team@null.ai</a></div>
            </div>
          </div>

          <div className="project-section">
            <h3>Project Description</h3>
            <p className="project-desc">
              A domain-specific RAG system for medical literature that enables healthcare professionals to query complex medical knowledge bases with high accuracy. The system integrates hallucination detection using Ragas evaluation framework, multi-hop reasoning for complex medical queries, and real-time retrieval from PubMed and custom clinical databases. Built with LangGraph for agent orchestration and Pinecone for vector storage.
            </p>
          </div>
          <div className="project-section">
            <h3>Project Links</h3>
            <div className="attachments-grid">
              <a href="https://github.com/nullpointer/medical-rag" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="attachment-card" style={{ cursor: 'pointer' }}>
                  <div className="att-icon doc"><Code size={24} /></div>
                  <span className="att-name">GitHub Repo</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>github.com/nullpointer/medical-rag</span>
                </div>
              </a>
              <a href="https://www.canva.com/design/abc123/view" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="attachment-card" style={{ cursor: 'pointer' }}>
                  <div className="att-icon pdf"><FileText size={24} /></div>
                  <span className="att-name">Presentation Slide</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>canva.com/design/abc123</span>
                </div>
              </a>
              <a href="https://medical-rag-demo.vercel.app" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="attachment-card" style={{ cursor: 'pointer' }}>
                  <div className="att-icon img"><LayoutGrid size={24} /></div>
                  <span className="att-name">Live Demo</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>medical-rag-demo.vercel.app</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Column 3: Scoring Rubric */}
        <div className="judge-col-right glass-panel">
          <div className="rubric-header">
            <div>
              <h3>Scoring Rubric</h3>
              <span className="sub-text" style={{ color: rubric.color }}>{rubric.label} • SEAL SP26</span>
            </div>
            <div className="total-score-box" style={{ borderColor: rubric.color, background: `${rubric.color}15` }}>
              <span className="total-label">Total</span>
              <span className="total-value" style={{ color: total >= maxTotal * 0.8 ? 'var(--success)' : total >= maxTotal * 0.5 ? 'var(--warning)' : 'var(--danger)' }}>{total}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>/{maxTotal}</span>
            </div>
          </div>

          <div className="rubric-body">
            {rubric.criteria.map(c => (
              <div key={c.key} className="score-item">
                <div className="score-header">
                  <div>
                    <h4 style={{ fontSize: '13px' }}>{c.labelVi}</h4>
                    <span className="weight-tag" style={{ background: `${rubric.color}15`, color: rubric.color, border: `1px solid ${rubric.color}40` }}>Weight: {c.weight}</span>
                  </div>
                  <span className="range-text">0 – {c.max}</span>
                </div>
                <div className="slider-container">
                  <input type="number" className="score-input" value={currentScores[c.key]} onChange={e => setScore(c.key, Math.min(c.max, Math.max(0, Number(e.target.value))))} min="0" max={c.max} />
                  <input type="range" className="score-slider" value={currentScores[c.key]} onChange={e => setScore(c.key, Number(e.target.value))} min="0" max={c.max}
                    style={{ accentColor: rubric.color }} />
                  <span className="current-score" style={{ color: rubric.color }}>{currentScores[c.key]}</span>
                </div>
                <input type="text" className="comment-input" placeholder={c.placeholder} />
              </div>
            ))}
          </div>

          <div className="rubric-footer">
            {submitError && (
              <div className={submitShaking ? 'shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '12px', animation: submitShaking ? 'shake 0.4s ease-in-out' : 'none' }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>{submitError}</span>
              </div>
            )}
            <div className="action-buttons">
              <button className="btn btn-secondary flex-1">Save Draft</button>
              <button className="btn btn-primary flex-1" onClick={handleSubmitScore} disabled={isSubmitting}
                style={{ 
                  background: round === 'finals' ? 'linear-gradient(135deg, var(--warning), var(--danger))' : 'var(--primary)',
                  boxShadow: '0 0 20px rgba(59,130,246,0.4)'
                }}>
                {isSubmitting ? 'Submitting...' : 'Submit Score'}
              </button>
            </div>
            <div className="footer-meta">
              <button className="btn-text text-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                <AlertTriangle size={14} /> Flag for review
              </button>
              <span className="auto-save">Auto-saved 2 min ago</span>
            </div>
          </div>
        </div>
      </div>

      {submitToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Score Submitted!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rubric.label} • {total}/{maxTotal} — NullPointerException</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
      `}</style>
    </>
  );
};

export default JudgePanel;
