import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Calendar, Target, Plus, X, AlertTriangle, Save, AlertCircle, Users } from 'lucide-react';

const EventForm = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditMode = !!eventId;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: 'SEAL NextGen Hackathon 2026',
    type: 'Hackathon',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    maxTeams: '',
    description: '',
    subTopics: [],
    rounds: []
  });

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialTopics, setInitialTopics] = useState([]);
  const [initialRounds, setInitialRounds] = useState([]);

  // ── Derived validation (live from formData) ──────────────────────────────
  const { registrationStartDate: regStart, registrationEndDate: regEnd, startDate: evtStart, endDate: evtEnd } = formData;
  const regEndBeforeStart   = !!(regStart && regEnd   && regEnd   <= regStart);
  const evtStartNotAfterReg = !!(regEnd   && evtStart && evtStart <= regEnd);
  const evtEndBeforeStart   = !!(evtStart && evtEnd   && evtEnd   <= evtStart);
  const hasDateErrors = regEndBeforeStart || evtStartNotAfterReg || evtEndBeforeStart;

  const datePart = (dt) => (dt ? dt.split('T')[0] : '');

  const getRoundErrors = (round, index) => {
    const errs = [];
    if (!round.start) errs.push('Start time is required');
    if (!round.end)   errs.push('End time is required');
    if (round.start && round.end && round.end <= round.start) errs.push('End time must be after start time');
    if (round.start && evtStart && datePart(round.start) < evtStart) errs.push('Start is before the event start date');
    if (round.end   && evtEnd   && datePart(round.end)   > evtEnd)   errs.push('End is after the event end date');
    if (index > 0) {
      const prev = formData.rounds[index - 1];
      if (prev.end && round.start && round.start < prev.end)
        errs.push(`Must start after "${prev.name || `Round ${index}`}" ends`);
    }
    return errs;
  };

  const allRoundErrors = formData.rounds.map((r, i) => getRoundErrors(r, i));
  const hasRoundErrors = allRoundErrors.some(e => e.length > 0);

  const maxTeamsNum = parseInt(formData.maxTeams) || 0;
  const trackCount = Math.max(1, formData.subTopics?.length || 1);
  const teamFlow = formData.rounds.reduce((acc, round, idx) => {
    const isFinal    = idx === formData.rounds.length - 1;
    const prevLeft   = acc.length > 0 ? acc[acc.length - 1].promotedTotal : maxTeamsNum;
    const promotedPerTrack = (!isFinal && round.promotionTopN) ? (parseInt(round.promotionTopN) || 0) : 0;
    const promotedTotal = promotedPerTrack * trackCount;
    const isInvalid = !isFinal && (promotedTotal < 1 || promotedTotal >= prevLeft);
    acc.push({ name: round.name || `Round ${idx + 1}`, isFinal, promotedPerTrack, promotedTotal, isInvalid });
    return acc;
  }, []);
  const hasTeamFlowError = teamFlow.some(r => r.isInvalid);

  // ── Load existing event in edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    const loadEvent = async () => {
      try {
        const { eventService } = await import('../../api/eventService.js');
        const { trackService }  = await import('../../api/trackService.js');
        const eventRes = await eventService.getEventDetails(eventId);
        const rawEvent = eventRes.data;
        if (!rawEvent) return;
        const roundsRes = await eventService.getEventRounds(eventId);
        const rawRounds = roundsRes.data || [];
        const tracksRes = await trackService.getTracksByEvent(eventId);
        const tracks    = tracksRes.data || [];
        const topicsRes = await trackService.getTopicsByEvent(eventId);
        const subTopics = (topicsRes.data || []).map((t, i) => ({ id: t.id || i, name: t.name, desc: t.description }));
        setInitialTopics(subTopics);
        const parseTime = (val) => {
          if (!val) return '';
          return val.length > 16 ? val.slice(0, 16) : val;
        };
        setFormData({
          name: rawEvent.name || '', type: rawEvent.type || 'Hackathon',
          startDate: rawEvent.startDate || '', endDate: rawEvent.endDate || '',
          registrationStartDate: rawEvent.registrationStartDate || '',
          registrationEndDate:   rawEvent.registrationEndDate   || '',
          maxTeams: rawEvent.maxTeams || '', description: rawEvent.description || '',
          subTopics,
          rounds: rawRounds.map(r => ({ id: r.id, name: r.name, status: r.status?.toLowerCase() || 'planned', start: parseTime(r.startTime), end: parseTime(r.endTime), promotionTopN: r.promotionTopN ?? '', criteria: [] }))
        });
        setInitialRounds(rawRounds.map(r => ({ id: r.id })));
      } catch (e) { console.error('Failed to load event:', e); }
    };
    loadEvent();
  }, [eventId, isEditMode]);

  // ── Save ─────────────────────────────────────────────────────────────────
  const triggerError = (msg, step) => {
    setError(msg); setShaking(true);
    if (step) setCurrentStep(step);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSave = async () => {
    setError('');
    if (!formData.name)                                         { triggerError('Event Name is required.', 1); return; }
    if (!formData.registrationStartDate || !formData.registrationEndDate) { triggerError('Registration open and close dates are required.', 1); return; }
    if (!formData.maxTeams || parseInt(formData.maxTeams, 10) < 1)        { triggerError('Max Teams is required and must be at least 1.', 1); return; }
    if (!formData.startDate || !formData.endDate)               { triggerError('Event start and end dates are required.', 1); return; }
    if (hasDateErrors)                                          { triggerError('Please fix the date errors on Step 1 before saving.', 1); return; }
    if (formData.rounds.length === 0)                           { triggerError('At least one round is required. Please add a round in Step 3.', 3); return; }
    if (hasRoundErrors)                                         { triggerError('Please fix the round time errors in Step 3 before saving.', 3); return; }
    if (hasTeamFlowError)                                       { triggerError('Promoted teams must be strictly less than the available pool from the previous round.', 3); return; }

    setIsSubmitting(true);
    try {
      const requestData = {
        name: formData.name, type: formData.type,
        startDate: formData.startDate || null, endDate: formData.endDate || null,
        registrationStartDate: formData.registrationStartDate || null,
        registrationEndDate:   formData.registrationEndDate   || null,
        maxTeams: formData.maxTeams ? parseInt(formData.maxTeams, 10) : null,
        description: formData.description,
        rounds: formData.rounds.map((r, index) => {
          const isFinalRound = index === formData.rounds.length - 1;
          return {
            name: r.name, startTime: r.start || null, endTime: r.end || null,
            promotionTopN: isFinalRound ? null : (r.promotionTopN ? parseInt(r.promotionTopN, 10) : null),
            criteria: r.criteria.map(c => ({ name: c.name, weight: c.weight, maxScore: 100 }))
          };
        }),
        tracks: [{ name: 'General Track', description: 'Default track for the event', topics: formData.subTopics.map(t => ({ name: t.name, description: t.desc })) }]
      };

      const { eventService } = await import('../../api/eventService.js');
      const { trackService }  = await import('../../api/trackService.js');
      let response;

      if (isEditMode) {
        response = await eventService.updateEvent(eventId, requestData);
        const currentRoundIds = formData.rounds.map(r => r.id);
        for (const ir of initialRounds) {
          if (!currentRoundIds.includes(ir.id)) { try { await eventService.deleteRound(ir.id); } catch(e) { console.error(e); } }
        }
        for (const fr of formData.rounds) {
          const rp = { name: fr.name, startTime: fr.start || null, endTime: fr.end || null, promotionTopN: fr.promotionTopN ? parseInt(fr.promotionTopN) : null };
          let sid = null;
          if (fr.id && fr.id < 1000000000) { try { await eventService.updateRound(fr.id, rp); sid = fr.id; } catch(e) { console.error(e); } }
          else { try { const nr = await eventService.createRound(eventId, rp); sid = nr.data?.id; } catch(e) { console.error(e); } }
          if (sid && fr.criteria?.length > 0) {
            try {
              const { criterionService } = await import('../../api/scoreService.js');
              for (const c of fr.criteria) { if (c.id > 1000000000) await criterionService.createCriterion(sid, { name: c.name, weight: (c.weight||0)/100, maxScore: 100 }); }
            } catch(e) { console.error(e); }
          }
        }
        const ctids = formData.subTopics.map(t => t.id);
        for (const it of initialTopics) { if (!ctids.includes(it.id)) { try { await trackService.deleteTopic(it.id); } catch(e) { console.error(e); } } }
        for (const ft of formData.subTopics) {
          if (ft.id && ft.id < 1000000000) { try { await trackService.updateTopic(ft.id, { name: ft.name, description: ft.desc }); } catch(e) { console.error(e); } }
          else { try { await trackService.createTopicByEvent(eventId, { name: ft.name, description: ft.desc }); } catch(e) { console.error(e); } }
        }
      } else {
        response = await eventService.createEventBatch(requestData);
        const savedId = response.data?.id || eventId;
        if (formData.subTopics?.length > 0) {
          try {
            for (const topic of formData.subTopics) await trackService.createTopicByEvent(savedId, { name: topic.name, description: topic.desc });
          } catch(e) { console.error(e); }
          try {
            const rr2 = await eventService.getEventRounds(savedId);
            const sr2 = rr2.data || [];
            const { criterionService } = await import('../../api/scoreService.js');
            for (const fr of formData.rounds) {
              const sr = sr2.find(s => s.name === fr.name);
              if (sr && fr.criteria?.length > 0) for (const c of fr.criteria) await criterionService.createCriterion(sr.id, { name: c.name, weight: (c.weight||0)/100, maxScore: 100 });
            }
          } catch(e) { console.error(e); }
        }
      }

      localStorage.setItem('event_settings_seal_sp26', JSON.stringify(formData));
      const finalId = isEditMode ? eventId : (response.data?.id || eventId);
      navigate(`/admin/event/${finalId}/dashboard`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save event. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  const addSubTopic    = () => { if (newTopicName.trim() && newTopicDesc.trim()) { setFormData(p => ({ ...p, subTopics: [...(p.subTopics||[]), { id: Date.now(), name: newTopicName.trim(), desc: newTopicDesc.trim() }] })); setNewTopicName(''); setNewTopicDesc(''); } };
  const removeSubTopic = id  => setFormData(p => ({ ...p, subTopics: p.subTopics.filter(t => t.id !== id) }));
  const addRound       = ()  => setFormData(p => ({ ...p, rounds: [...p.rounds, { id: Date.now(), name: `Round ${p.rounds.length+1}`, status: 'planned', start: '', end: '', promotionTopN: '', criteria: [] }] }));
  const updateRound    = (id,f,v) => setFormData(p => ({ ...p, rounds: p.rounds.map(r => r.id===id ? { ...r,[f]:v } : r) }));
  const removeRound    = id  => setFormData(p => ({ ...p, rounds: p.rounds.filter(r => r.id !== id) }));
  const addCriterion   = rid => setFormData(p => ({ ...p, rounds: p.rounds.map(r => r.id===rid ? { ...r, criteria: [...r.criteria, { id: Date.now(), name: 'New Criterion', weight: 0 }] } : r) }));
  const updateCriterion = (rid,cid,f,v) => setFormData(p => ({ ...p, rounds: p.rounds.map(r => r.id===rid ? { ...r, criteria: r.criteria.map(c => c.id===cid ? { ...c,[f]:f==='weight'?Number(v):v } : c) } : r) }));
  const removeCriterion = (rid,cid) => setFormData(p => ({ ...p, rounds: p.rounds.map(r => r.id===rid ? { ...r, criteria: r.criteria.filter(c => c.id!==cid) } : r) }));

  const inp = (extra={}) => ({ width:'100%',padding:'10px 14px',background:'var(--bg-hover)',border:'1px solid var(--border-color)',borderRadius:'8px',color:'var(--text-primary)',outline:'none',fontSize:'14px',fontFamily:'inherit',...extra });
  const errBorder = { borderColor:'rgba(239,68,68,0.5)' };
  const lbl = { display:'block',fontSize:'13px',fontWeight:'600',color:'var(--text-secondary)',marginBottom:'8px' };
  const req = <span style={{color:'var(--danger)'}}>*</span>;
  const InlineWarn = ({msg}) => <div style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'5px',color:'var(--danger)',fontSize:'12px'}}><AlertTriangle size={11}/> {msg}</div>;

  return (
    <div className="animate-fade-in" style={{paddingBottom:'40px'}}>

      <div className="page-header" style={{marginBottom:'32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button className="btn-icon" onClick={()=>navigate('/admin/events')} style={{background:'var(--bg-hover)',border:'1px solid var(--border-color)',borderRadius:'12px',padding:'10px'}}><ArrowLeft size={20}/></button>
          <div><h1>{isEditMode?'Edit Event':'Create New Event'}</h1><p className="subtitle">{isEditMode?'Modify event configurations':'Set up a new hackathon or code camp'}</p></div>
        </div>
        <div style={{display:'flex',gap:'12px'}}>
          <button className="btn btn-secondary" onClick={()=>navigate('/admin/events')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} style={{background:'var(--success)',color:'#000'}} disabled={isSubmitting}><Save size={18}/> {isSubmitting?'Saving…':'Save Event'}</button>
        </div>
      </div>

      {error && (
        <div className={shaking?'shake':''} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',marginBottom:'24px',animation:shaking?'shake 0.4s ease-in-out':'none'}}>
          <AlertCircle size={18} color="#ef4444" style={{flexShrink:0}}/><span style={{fontSize:'13px',color:'#ef4444',fontWeight:'500'}}>{error}</span>
        </div>
      )}

      <div style={{display:'flex',gap:'8px',marginBottom:'24px',borderBottom:'1px solid var(--border-color)'}}>
        {[{num:1,title:'Basic Info',icon:<Calendar size={16}/>},{num:2,title:'Sub-topics Pool',icon:<Target size={16}/>},{num:3,title:'Rounds & Scoring',icon:<Check size={16}/>}].map(tab=>(
          <button key={tab.num} onClick={()=>setCurrentStep(tab.num)} style={{padding:'12px 24px',background:'transparent',border:'none',borderBottom:currentStep===tab.num?'2px solid var(--primary)':'2px solid transparent',color:currentStep===tab.num?'var(--primary)':'var(--text-secondary)',fontSize:'14px',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',transition:'var(--transition)'}}>
            {tab.icon} {tab.title}
          </button>
        ))}
      </div>

      <div className="panel glass-panel" style={{padding:'32px'}}>

        {/* STEP 1 */}
        {currentStep===1 && (
          <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',gap:'28px'}}>

            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'24px'}}>
              <div>
                <label style={lbl}>Event Name {req}</label>
                <input type="text" style={inp()} placeholder="e.g. Winter Hackathon 2026" value={formData.name} onChange={e=>{setFormData({...formData,name:e.target.value});setError('');}} />
              </div>
              <div>
                <label style={lbl}>Event Type</label>
                <select style={inp()} value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}>
                  <option value="Hackathon">Hackathon</option><option value="Code Camp">Code Camp</option><option value="Datathon">Datathon</option><option value="Ideathon">Ideathon</option>
                </select>
              </div>
            </div>

            {/* 1 — Registration Phase */}
            <div style={{background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'12px',padding:'24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><Calendar size={16} color="var(--primary)"/></div>
                <div>
                  <h3 style={{fontSize:'15px',fontWeight:'700',margin:0}}>1 — Registration Phase {req}</h3>
                  <p style={{fontSize:'12px',color:'var(--text-secondary)',margin:0}}>Configure this <strong>before</strong> setting the main event dates.</p>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'24px'}}>
                <div>
                  <label style={lbl}>Registration Opens {req}</label>
                  <input type="date" style={inp()} min={isEditMode ? undefined : new Date().toISOString().split('T')[0]} value={formData.registrationStartDate} onChange={e=>setFormData({...formData,registrationStartDate:e.target.value})}/>
                </div>
                <div>
                  <label style={lbl}>Registration Closes {req}</label>
                  <input type="date" style={inp(regEndBeforeStart?errBorder:{})} value={formData.registrationEndDate} min={regStart || (isEditMode ? undefined : new Date().toISOString().split('T')[0])} onChange={e=>setFormData({...formData,registrationEndDate:e.target.value})}/>
                  {regEndBeforeStart && <InlineWarn msg="Must be after registration open date"/>}
                </div>
                <div>
                  <label style={lbl}>Max Teams {req}</label>
                  <input type="number" min="1" style={inp()} placeholder="e.g. 50" value={formData.maxTeams} onChange={e=>setFormData({...formData,maxTeams:e.target.value})}/>
                </div>
              </div>
            </div>

            {/* 2 — Main Event Dates */}
            <div style={{background:'rgba(16,185,129,0.04)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'12px',padding:'24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'rgba(16,185,129,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><Calendar size={16} color="var(--success)"/></div>
                <div>
                  <h3 style={{fontSize:'15px',fontWeight:'700',margin:0}}>2 — Main Event Dates {req}</h3>
                  <p style={{fontSize:'12px',color:'var(--text-secondary)',margin:0}}>Event must start <strong>at least 1 day after</strong> registration closes.</p>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
                <div>
                  <label style={lbl}>Event Start Date {req}</label>
                  <input type="date" style={inp(evtStartNotAfterReg?errBorder:{})} value={formData.startDate} min={regEnd || (isEditMode ? undefined : new Date().toISOString().split('T')[0])} onChange={e=>setFormData({...formData,startDate:e.target.value})}/>
                  {evtStartNotAfterReg && <InlineWarn msg="Must be at least 1 day after registration closes"/>}
                </div>
                <div>
                  <label style={lbl}>Event End Date {req}</label>
                  <input type="date" style={inp(evtEndBeforeStart?errBorder:{})} value={formData.endDate} min={evtStart || (isEditMode ? undefined : new Date().toISOString().split('T')[0])} onChange={e=>setFormData({...formData,endDate:e.target.value})}/>
                  {evtEndBeforeStart && <InlineWarn msg="End date must be after start date"/>}
                </div>
              </div>
            </div>

            <div>
              <label style={lbl}>Event Description</label>
              <textarea style={{...inp(),resize:'vertical'}} rows="4" placeholder="Brief description of the event…" value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})}/>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep===2 && (
          <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',gap:'32px'}}>
            <div>
              <h3 style={{fontSize:'16px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'8px'}}><AlertCircle size={18} color="var(--warning)"/> Sub-topics Pool</h3>
              <p style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:'16px'}}>These topics will be used for randomized drawing and automated Track assignment.</p>
              <div style={{background:'rgba(245,158,11,0.05)',padding:'20px',borderRadius:'12px',border:'1px dashed rgba(245,158,11,0.3)',display:'flex',gap:'16px',alignItems:'flex-start',marginBottom:'16px'}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:'12px'}}>
                  <div><label style={{...lbl,color:'var(--warning)'}}>Topic Name</label><input type="text" style={{...inp(),background:'#F8FAFC'}} placeholder="e.g. Legal Document RAG System" value={newTopicName} onChange={e=>setNewTopicName(e.target.value)}/></div>
                  <div><label style={{...lbl,color:'var(--warning)'}}>Detailed Description</label><textarea style={{...inp(),background:'#F8FAFC',resize:'vertical'}} rows="2" placeholder="Detailed requirements…" value={newTopicDesc} onChange={e=>setNewTopicDesc(e.target.value)}/></div>
                </div>
                <button className="btn btn-primary" onClick={addSubTopic} disabled={!newTopicName.trim()||!newTopicDesc.trim()} style={{background:'var(--warning)',color:'#000',marginTop:'26px'}}><Plus size={18}/> Add Topic</button>
              </div>
              {(!formData.subTopics||formData.subTopics.length===0)
                ? <div style={{padding:'24px',textAlign:'center',color:'var(--text-secondary)',background:'#F8FAFC',borderRadius:'12px',border:'1px solid var(--border-color)'}}>No topics yet. Add a topic above.</div>
                : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
                    {formData.subTopics.map(topic=>(
                      <div key={topic.id} style={{padding:'16px',background:'var(--bg-subtle)',border:'1px solid var(--border-color)',borderRadius:'12px',position:'relative'}}>
                        <button onClick={()=>removeSubTopic(topic.id)} style={{position:'absolute',top:'12px',right:'12px',background:'rgba(239,68,68,0.1)',border:'none',color:'var(--text-secondary)',cursor:'pointer',display:'flex',padding:'4px',borderRadius:'50%'}}><X size={14}/></button>
                        <h4 style={{fontSize:'14px',marginBottom:'8px',paddingRight:'24px'}}>{topic.name}</h4>
                        <p style={{fontSize:'13px',color:'var(--text-secondary)',lineHeight:'1.5'}}>{topic.desc}</p>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep===3 && (
          <div className="animate-fade-in" style={{display:'flex',flexDirection:'column',gap:'24px'}}>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h3 style={{fontSize:'16px',marginBottom:'4px'}}>Competition Rounds</h3>
                {formData.rounds.length===0 && <p style={{fontSize:'12px',color:'var(--danger)',margin:0,display:'flex',alignItems:'center',gap:'4px'}}><AlertTriangle size={12}/> At least one round is required</p>}
              </div>
              <button className="btn btn-secondary" onClick={addRound}><Plus size={16}/> Add Round</button>
            </div>

            {/* Team Flow Indicator */}
            {formData.rounds.length>0 && maxTeamsNum>0 && (
              <div style={{padding:'16px 20px',background:hasTeamFlowError?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.05)',border:`1px solid ${hasTeamFlowError?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.2)'}`,borderRadius:'12px'}}>
                <div style={{fontSize:'12px',fontWeight:'700',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}><Users size={13}/> Team Flow — starting with {maxTeamsNum} teams</div>
                <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:'4px'}}>
                  <span style={{fontSize:'13px',fontWeight:'700',padding:'4px 10px',background:'var(--bg-hover)',borderRadius:'8px'}}>{maxTeamsNum}</span>
                  {teamFlow.map((r,i)=>(
                    <React.Fragment key={i}>
                      <span style={{fontSize:'11px',color:'var(--text-secondary)',padding:'0 2px'}}>→</span>
                      <span style={{fontSize:'13px',padding:'4px 10px',borderRadius:'8px',fontWeight:'600',display:'flex',alignItems:'center',gap:'4px',background:r.isInvalid?'rgba(239,68,68,0.15)':r.isFinal?'rgba(255,215,0,0.15)':'var(--bg-hover)',color:r.isInvalid?'var(--danger)':r.isFinal?'#b8860b':'var(--text-primary)',border:`1px solid ${r.isInvalid?'rgba(239,68,68,0.4)':'transparent'}`}}>
                        {r.isFinal?'🏆':r.isInvalid?'❌':''}{r.name}
                        {!r.isFinal&&<span style={{fontSize:'11px',color:r.isInvalid?'var(--danger)':'var(--text-secondary)'}}>({r.promotedPerTrack} per track = {r.promotedTotal} total)</span>}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                {hasTeamFlowError&&<div style={{fontSize:'12px',color:'var(--danger)',marginTop:'8px',display:'flex',alignItems:'center',gap:'4px'}}><AlertTriangle size={12}/> Promoted teams must be less than the available pool from the previous round (and ≥ 1).</div>}
              </div>
            )}

            {formData.rounds.length===0 && <div style={{padding:'40px',textAlign:'center',color:'var(--text-secondary)',background:'#F8FAFC',borderRadius:'12px',border:'1px dashed var(--border-color)'}}>Please add at least one round (e.g. Qualifying Round).</div>}

            {formData.rounds.length>0 && (
              <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
                {formData.rounds.map((round,rIdx)=>{
                  const roundErrs=allRoundErrors[rIdx]; const hasErrs=roundErrs.length>0;
                  const totalWeight=round.criteria.reduce((s,c)=>s+(c.weight||0),0);
                  const weightErr=round.criteria.length>0&&totalWeight!==100;
                  const isFinalRound=rIdx===formData.rounds.length-1;
                  return (
                    <div key={round.id} style={{padding:'24px',background:'#F8FAFC',borderRadius:'16px',border:`1px solid ${hasErrs?'rgba(239,68,68,0.4)':isFinalRound?'rgba(255,215,0,0.3)':'var(--border-color)'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                        <span style={{fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'1px',padding:'3px 10px',borderRadius:'20px',background:isFinalRound?'rgba(255,215,0,0.15)':'rgba(99,102,241,0.1)',color:isFinalRound?'#b8860b':'var(--primary)'}}>{isFinalRound?'🏆 Final Round':`Round ${rIdx+1}`}</span>
                        <button className="btn-icon" onClick={()=>removeRound(round.id)} style={{color:'var(--danger)',background:'rgba(239,68,68,0.1)'}}><Trash2Icon/></button>
                      </div>

                      <div style={{display:'flex',gap:'16px',marginBottom:'16px',flexWrap:'wrap'}}>
                        <div style={{flex:2,minWidth:'160px'}}>
                          <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'4px',display:'block'}}>Round Name</label>
                          <input type="text" style={inp()} value={round.name} onChange={e=>updateRound(round.id,'name',e.target.value)}/>
                        </div>
                        <div style={{flex:1,minWidth:'160px'}}>
                          <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'4px',display:'block'}}>Start Time {req}</label>
                          <input type="datetime-local" style={inp(roundErrs.some(e=>e.toLowerCase().includes('start'))?errBorder:{})} value={round.start} min={evtStart?`${evtStart}T00:00`:undefined} max={evtEnd?`${evtEnd}T23:59`:undefined} onChange={e=>updateRound(round.id,'start',e.target.value)}/>
                        </div>
                        <div style={{flex:1,minWidth:'160px'}}>
                          <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'4px',display:'block'}}>End Time {req}</label>
                          <input type="datetime-local" style={inp(roundErrs.some(e=>e.toLowerCase().includes('end'))?errBorder:{})} value={round.end} min={round.start||(evtStart?`${evtStart}T00:00`:undefined)} max={evtEnd?`${evtEnd}T23:59`:undefined} onChange={e=>updateRound(round.id,'end',e.target.value)}/>
                        </div>
                        {!isFinalRound?(
                          <div style={{flex:1,minWidth:'140px'}}>
                            <label style={{fontSize:'12px',color:'var(--text-secondary)',marginBottom:'4px',display:'block'}}>Teams Promoted <span style={{fontSize:'10px',fontWeight:'400'}}>(per track)</span></label>
                            <div style={{position:'relative'}}>
                              <input type="number" min="1" style={{...inp(),paddingRight:'40px'}} placeholder="e.g. 10" value={round.promotionTopN} onChange={e=>updateRound(round.id,'promotionTopN',e.target.value)}/>
                              <span style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'11px',color:'var(--text-secondary)',pointerEvents:'none'}}>teams</span>
                            </div>
                          </div>
                        ):(
                          <div style={{flex:1,minWidth:'140px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <span style={{fontSize:'12px',color:'#b8860b',fontStyle:'italic',textAlign:'center'}}>No elimination —<br/>this is the Final Round</span>
                          </div>
                        )}
                      </div>

                      {hasErrs&&(
                        <div style={{marginBottom:'16px',padding:'10px 14px',background:'rgba(239,68,68,0.06)',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.2)',display:'flex',flexDirection:'column',gap:'4px'}}>
                          {roundErrs.map((e,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'var(--danger)'}}><AlertTriangle size={11}/> {e}</div>)}
                        </div>
                      )}

                      <div style={{background:'var(--bg-subtle)',padding:'20px',borderRadius:'12px',border:`1px solid ${weightErr?'var(--danger)':'var(--bg-hover)'}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                          <h4 style={{fontSize:'14px',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:'8px'}}>
                            Scoring Criteria
                            {weightErr&&<span style={{fontSize:'12px',color:'var(--danger)',display:'flex',alignItems:'center',gap:'4px',background:'rgba(239,68,68,0.1)',padding:'2px 8px',borderRadius:'20px'}}><AlertTriangle size={12}/> {totalWeight}% (need 100%)</span>}
                            {!weightErr&&round.criteria.length>0&&<span style={{fontSize:'12px',color:'var(--success)',background:'rgba(16,185,129,0.1)',padding:'2px 8px',borderRadius:'20px'}}>✓ 100%</span>}
                          </h4>
                          <button className="btn btn-secondary" style={{fontSize:'12px',padding:'6px 12px'}} onClick={()=>addCriterion(round.id)}><Plus size={14}/> Add Criterion</button>
                        </div>
                        {round.criteria.length===0
                          ? <div style={{fontSize:'13px',color:'var(--text-secondary)',fontStyle:'italic'}}>No criteria yet. Add criteria for judges to evaluate.</div>
                          : <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                              {round.criteria.map(c=>(
                                <div key={c.id} style={{display:'flex',gap:'16px',alignItems:'center'}}>
                                  <div style={{flex:1}}><input type="text" style={inp()} placeholder="Criterion Name (e.g. Technical Complexity)" value={c.name} onChange={e=>updateCriterion(round.id,c.id,'name',e.target.value)}/></div>
                                  <div style={{width:'120px',position:'relative'}}>
                                    <input type="number" style={{...inp(),paddingRight:'28px'}} placeholder="Weight" value={c.weight||''} onChange={e=>updateCriterion(round.id,c.id,'weight',e.target.value)}/>
                                    <span style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--text-secondary)',fontSize:'14px',pointerEvents:'none'}}>%</span>
                                  </div>
                                  <button className="btn-icon" onClick={()=>removeCriterion(round.id,c.id)} style={{color:'var(--text-secondary)'}}><X size={16}/></button>
                                </div>
                              ))}
                            </div>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
    </div>
  );
};

const Trash2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export default EventForm;
