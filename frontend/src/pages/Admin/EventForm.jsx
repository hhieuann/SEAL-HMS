import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Calendar, Target, Plus, X, AlertTriangle, Save, AlertCircle } from 'lucide-react';

const EventForm = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditMode = !!eventId;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'SEAL NextGen Hackathon 2026',
    type: 'Hackathon',
    status: 'planned',
    startDate: '',
    endDate: '',
    description: '',
    subTopics: [],
    rounds: []
  });

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load mock data if edit mode
  useEffect(() => {
    if (isEditMode) {
      // Mock data for editing SEAL SP26
      setFormData({
        name: 'SEAL Hackathon Spring 2026',
        type: 'Hackathon',
        status: 'ongoing',
        startDate: '2026-04-11',
        endDate: '2026-04-12',
        description: 'Mastering Domain-Specific AI RAG Systems',
        subTopics: [
          { id: 1, name: 'Legal Document RAG System', desc: 'Build a specialized RAG system for legal documents, contracts, and regulations.' },
          { id: 2, name: 'Medical Knowledge RAG', desc: 'Medical knowledge retrieval system from specialized documents, assisting diagnosis.' },
          { id: 3, name: 'E-commerce Product RAG', desc: 'RAG for product data, reviews, and smart shopping consultation.' },
          { id: 4, name: 'Educational Content RAG', desc: 'Learning support system with in-depth educational content retrieval.' },
          { id: 5, name: 'Financial Report RAG', desc: 'Analyze and retrieve financial reports, stocks, and market data.' },
          { id: 6, name: 'Technical Documentation RAG', desc: 'RAG for technical docs, API docs, and software development guides.' }
        ],
        rounds: [
          { 
            id: 1, name: 'Qualifying Round', status: 'planned', start: '2026-04-12', end: '2026-04-12', 
            criteria: [
              { id: 1, name: 'Domain Accuracy and Relevance', weight: 30 },
              { id: 2, name: 'Agentic RAG Architecture & Algorithms', weight: 30 },
              { id: 3, name: 'Idea & Presentation', weight: 15 },
              { id: 4, name: 'Execution & Creativity', weight: 15 },
              { id: 5, name: 'UX & Interactive Interface', weight: 10 }
            ] 
          },
          { 
            id: 2, name: 'Finals', status: 'planned', start: '2026-04-12', end: '2026-04-12', 
            criteria: [
              { id: 6, name: 'Data Processing & Retrieval Quality', weight: 30 },
              { id: 7, name: 'Reliability & Anti-hallucination', weight: 20 },
              { id: 8, name: 'Agent Thinking & Multi-layer Processing', weight: 20 },
              { id: 9, name: 'Practicality & Operational Efficiency', weight: 20 },
              { id: 10, name: 'Scalability & Creativity', weight: 10 }
            ] 
          }
        ]
      });
    }
  }, [eventId, isEditMode]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleSave = () => {
    setError('');
    
    // Unhappy Case Simulation
    if (!formData.name) {
      setError('Event Name is required.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Save logic
      localStorage.setItem('event_settings_seal_sp26', JSON.stringify(formData));
      console.log("Saving data to localStorage:", formData);
      navigate(`/admin/event/${eventId || 'seal-sp26'}/dashboard`);
    }, 1500);
  };

  const addSubTopic = () => {
    if (newTopicName.trim() && newTopicDesc.trim()) {
      setFormData(prev => ({
        ...prev,
        subTopics: [...(prev.subTopics || []), { id: Date.now(), name: newTopicName.trim(), desc: newTopicDesc.trim() }]
      }));
      setNewTopicName('');
      setNewTopicDesc('');
    }
  };

  const removeSubTopic = (id) => {
    setFormData(prev => ({ ...prev, subTopics: prev.subTopics.filter(t => t.id !== id) }));
  };

  const addRound = () => {
    setFormData(prev => ({
      ...prev,
      rounds: [...prev.rounds, { id: Date.now(), name: 'New Round', status: 'planned', start: '', end: '', criteria: [] }]
    }));
  };

  const updateRound = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const removeRound = (id) => {
    setFormData(prev => ({ ...prev, rounds: prev.rounds.filter(r => r.id !== id) }));
  };

  const addCriterion = (roundId) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => r.id === roundId ? { ...r, criteria: [...r.criteria, { id: Date.now(), name: 'New Criterion', weight: 0 }] } : r)
    }));
  };

  const updateCriterion = (roundId, cId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => r.id === roundId ? {
        ...r,
        criteria: r.criteria.map(c => c.id === cId ? { ...c, [field]: field === 'weight' ? Number(value) : value } : c)
      } : r)
    }));
  };

  const removeCriterion = (roundId, cId) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.map(r => r.id === roundId ? { ...r, criteria: r.criteria.filter(c => c.id !== cId) } : r)
    }));
  };

  const formInputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '14px',
    fontFamily: 'inherit'
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => navigate('/admin/events')} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
            <p className="subtitle">{isEditMode ? 'Modify event configurations and rules' : 'Set up a new hackathon or code camp'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/events')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ background: 'var(--success)', color: '#000' }} disabled={isSubmitting}>
            <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </div>
      
      {/* Error Message UI */}
      {error && (
        <div
          className={shaking ? 'shake' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', marginBottom: '24px',
            animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
          }}
        >
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { num: 1, title: 'Basic Info', icon: <Calendar size={16} /> },
          { num: 2, title: 'Sub-topics Pool', icon: <Target size={16} /> },
          { num: 3, title: 'Rounds & Scoring', icon: <Check size={16} /> }
        ].map(tab => (
          <button
            key={tab.num}
            onClick={() => setCurrentStep(tab.num)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: currentStep === tab.num ? '2px solid var(--primary)' : '2px solid transparent',
              color: currentStep === tab.num ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition)'
            }}
          >
            {tab.icon} {tab.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="panel glass-panel" style={{ padding: '32px' }}>
        {currentStep === 1 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Event Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" style={{ ...formInputStyle, borderColor: error ? 'rgba(239,68,68,0.5)' : 'var(--border-color)' }} placeholder="e.g. Winter Hackathon 2026" value={formData.name} onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Event Type</label>
                <select style={formInputStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Code Camp">Code Camp</option>
                  <option value="Datathon">Datathon</option>
                  <option value="Ideathon">Ideathon</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Start Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="date" style={formInputStyle} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="date" style={formInputStyle} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Initial Status</label>
                <select style={formInputStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="planned">Planned (Draft)</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Live / Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Event Description</label>
              <textarea style={{ ...formInputStyle, resize: 'vertical' }} rows="4" placeholder="Brief description of the event..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Sub-topics Section */}
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18} color="var(--warning)" /> Sub-topics Pool</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>These topics will be used for randomized drawing and automated Track assignment.</p>
              
              <div style={{ background: 'rgba(245,158,11,0.05)', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(245,158,11,0.3)', display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--warning)', marginBottom: '6px' }}>Topic Name</label>
                    <input type="text" style={{ ...formInputStyle, background: '#F8FAFC' }} placeholder="e.g. Legal Document RAG System" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--warning)', marginBottom: '6px' }}>Detailed Description</label>
                    <textarea style={{ ...formInputStyle, background: '#F8FAFC', resize: 'vertical' }} rows="2" placeholder="Detailed requirements description for this topic..." value={newTopicDesc} onChange={e => setNewTopicDesc(e.target.value)}></textarea>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={addSubTopic} disabled={!newTopicName.trim() || !newTopicDesc.trim()} style={{ background: 'var(--warning)', color: '#000', marginTop: '26px' }}><Plus size={18} /> Add Topic</button>
              </div>

              {(!formData.subTopics || formData.subTopics.length === 0) ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  No topics available. Please add a topic.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {formData.subTopics.map((topic) => (
                    <div key={topic.id} style={{ padding: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '12px', position: 'relative' }}>
                      <button onClick={() => removeSubTopic(topic.id)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                        <X size={14} />
                      </button>
                      <h4 style={{ fontSize: '14px', marginBottom: '8px', paddingRight: '24px', color: 'var(--text-primary)' }}>{topic.name}</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{topic.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px' }}>Competition Rounds</h3>
              <button className="btn btn-secondary" onClick={addRound}><Plus size={16} /> Add Round</button>
            </div>

            {formData.rounds.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                Please add at least one round (e.g. Qualifying Round).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {formData.rounds.map((round, rIdx) => {
                  const totalWeight = round.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
                  const isWeightError = round.criteria.length > 0 && totalWeight !== 100;
                  
                  return (
                    <div key={round.id} style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', flex: 1, marginRight: '24px' }}>
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Round Name</label>
                            <input type="text" style={formInputStyle} value={round.name} onChange={e => updateRound(round.id, 'name', e.target.value)} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Start Date</label>
                            <input type="date" style={formInputStyle} value={round.start} onChange={e => updateRound(round.id, 'start', e.target.value)} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>End Date</label>
                            <input type="date" style={formInputStyle} value={round.end} onChange={e => updateRound(round.id, 'end', e.target.value)} />
                          </div>
                        </div>
                        <button className="btn-icon" onClick={() => removeRound(round.id)} style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}><Trash2Icon /></button>
                      </div>

                      {/* Criteria Section */}
                      <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '12px', border: `1px solid ${isWeightError ? 'var(--danger)' : 'var(--bg-hover)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Scoring Criteria
                            {isWeightError && <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '20px' }}><AlertTriangle size={12} /> Total weight must be 100% (Current: {totalWeight}%)</span>}
                            {!isWeightError && round.criteria.length > 0 && <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}><Check size={12} /> Total: 100%</span>}
                          </h4>
                          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => addCriterion(round.id)}><Plus size={14} /> Add Criterion</button>
                        </div>
                        
                        {round.criteria.length === 0 ? (
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No criteria defined. Add criteria for judges to evaluate.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {round.criteria.map((c, cIdx) => (
                              <div key={c.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <input type="text" style={formInputStyle} placeholder="Criterion Name (e.g. Technical Complexity)" value={c.name} onChange={e => updateCriterion(round.id, c.id, 'name', e.target.value)} />
                                </div>
                                <div style={{ width: '120px', position: 'relative' }}>
                                  <input type="number" style={{ ...formInputStyle, paddingRight: '28px' }} placeholder="Weight" value={c.weight || ''} onChange={e => updateCriterion(round.id, c.id, 'weight', e.target.value)} />
                                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px', pointerEvents: 'none' }}>%</span>
                                </div>
                                <button className="btn-icon" onClick={() => removeCriterion(round.id, c.id)} style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

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

// Trash icon missing from imports above
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

export default EventForm;
