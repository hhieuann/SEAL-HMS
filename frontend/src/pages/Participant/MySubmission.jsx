import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Upload, GitBranch, Globe, FileText, AlertCircle, Lock, ChevronDown, ChevronUp, Send, XCircle } from 'lucide-react';
import { submissionService, criterionService, standingsService } from '../../api/scoreService';
import { eventService } from '../../api/eventService';
import { teamService } from '../../api/teamService';

const MySubmission = () => {
  const [event, setEvent] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [teamData, setTeamData] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    techStack: '',
    repoUrl: '',
    demoUrl: '',
    slidesUrl: '',
    videoUrl: '',
    contactEmail: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [showAllRounds, setShowAllRounds] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const tId = localStorage.getItem('p_teamId') || localStorage.getItem('userId');
        // Load event from real API
        const eventIdStr = localStorage.getItem('p_eventId') || '1';
        const eventRes = await eventService.getEventDetails(eventIdStr);
        const evt = eventRes?.data || null;
        setEvent(evt);

        let activeRoundIdx = 0;
        if (evt?.rounds && evt.rounds.length > 0) {
          let lastStartedIdx = -1;
          for (let i = evt.rounds.length - 1; i >= 0; i--) {
            if (evt.rounds[i].status !== 'CREATED' && evt.rounds[i].status?.toLowerCase() !== 'planned') {
              lastStartedIdx = i;
              break;
            }
          }
          activeRoundIdx = lastStartedIdx !== -1 ? lastStartedIdx : 0;
        }
        setCurrentRoundIndex(activeRoundIdx);

        const round = evt?.rounds?.[activeRoundIdx] || null;
        
        if (round) {
          try {
            const critRes = await criterionService.getCriteria(round.id);
            if (critRes?.data) round.criteria = critRes.data;
          } catch (e) {}
        }
        setCurrentRound(round);

        let currentTeam = null;
        if (tId) {
          try {
            const teamRes = await teamService.getTeam(tId);
            currentTeam = teamRes?.data || null;
            setTeamData(currentTeam);
          } catch (e) {}
        }

        // Load existing submission
        if (tId && round?.id) {
          let hasCurrentSub = false;
          let existingSubHasData = false;
          try {
            const subRes = await submissionService.getSubmission(round.id, tId);
            if (subRes?.data) {
              const sub = subRes.data;
              setExistingSubmission(sub);
              setFormData({
                projectName: sub.submissionName || '',
                description: sub.description || '',
                techStack: sub.techStackName || '',
                repoUrl: sub.githubUrl || '',
                demoUrl: sub.demoUrl || '',
                slidesUrl: sub.slideUrl || '',
                videoUrl: '',
                contactEmail: '',
              });
              setIsSubmitted(true);
              hasCurrentSub = true;
              if (sub.submissionName && sub.submissionName.trim().length > 0) {
                existingSubHasData = true;
              }
            }
          } catch {
            // No submission yet for current round
          }
          
          // If no submission in current round, or if it is missing the project name, try fetching from the previous round to pre-fill
          if ((!hasCurrentSub || !existingSubHasData) && activeRoundIdx > 0) {
            try {
              const prevRoundId = evt.rounds[activeRoundIdx - 1].id;
              const prevSubRes = await submissionService.getSubmission(prevRoundId, tId);
              if (prevSubRes?.data) {
                const pSub = prevSubRes.data;
                setFormData({
                  projectName: pSub.submissionName || '',
                  description: pSub.description || '',
                  techStack: pSub.techStackName || '',
                  repoUrl: pSub.githubUrl || '',
                  demoUrl: pSub.demoUrl || '',
                  slidesUrl: pSub.slideUrl || '',
                  videoUrl: '',
                  contactEmail: '',
                });
                // We do NOT set existingSubmission or isSubmitted because it's a new round.
              }
            } catch {
              // Ignore if previous round has no submission either
            }
          }
        }
        
        // Check if team is eliminated (using backend standings, not localStorage)
        if (tId && activeRoundIdx > 0) {
          try {
            const prevRoundId = evt.rounds[activeRoundIdx - 1]?.id;
            if (prevRoundId) {
              const standingsRes = await standingsService.getStandings(prevRoundId);
              const standings = standingsRes?.data || [];
              const myStanding = standings.find(s => String(s.teamId) === String(tId));
              // If team exists in standings and was NOT promoted, they are eliminated
              if (myStanding && myStanding.promoted === false) {
                setExistingSubmission({ eliminated: true });
              }
              // If team not found in standings at all, don't mark eliminated (scores may not be computed yet)
            }
          } catch (e) {
            console.error('Failed to check elimination status:', e);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const validate = () => {
    const tId = localStorage.getItem('p_teamId');
    if (!tId || tId === 'undefined') return 'You must join or create a team before submitting.';
    if (!formData.projectName.trim()) return 'Project name is required.';
    if (!formData.repoUrl.trim()) return 'GitHub repository URL is required.';
    if (formData.repoUrl.toLowerCase().includes('drive.google.com')) return 'Google Drive links are not accepted. Please use GitHub.';
    if (!formData.repoUrl.startsWith('http')) return 'Repository URL must start with http:// or https://';
    if (!formData.description.trim()) return 'Project description is required.';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const tId = parseInt(localStorage.getItem('p_teamId') || localStorage.getItem('userId') || '1');
      const accountId = parseInt(localStorage.getItem('userId') || '1');
      const roundId = currentRound?.id;
      if (!roundId) throw new Error('No round ID');

      const payload = {
        submittedByAccountId: accountId,
        submissionName: formData.projectName,
        description: formData.description,
        techStackName: formData.techStack,
        githubUrl: formData.repoUrl,
        demoUrl: formData.demoUrl,
        slideUrl: formData.slidesUrl,
      };

      const result = await submissionService.upsertSubmission(roundId, tId, payload);
      setExistingSubmission(result?.data || result);
      setIsSubmitted(true);
    } catch (e) {
      setError('Submission failed. ' + (e?.response?.data?.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsSubmitted(false);
    setError('');
  };

  const isLocked = currentRound?.status !== 'ACTIVE';

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <p>Loading submission...</p>
      </div>
    );
  }

  if (!currentRound) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <h2 style={{ marginBottom: '8px' }}>No Active Round</h2>
        <p>There is no active round for submission right now. Please wait for the Admin to start a round.</p>
      </div>
    );
  }

  if (existingSubmission?.eliminated) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--danger)' }}>
        <XCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.7 }} />
        <h2 style={{ marginBottom: '8px', color: 'var(--danger)', fontWeight: '800' }}>Team Eliminated</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          We're sorry, but your team did not advance to {currentRound.name}. Thank you for your participation and hard work!
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Project Submission</h1>
          <p className="subtitle">{event?.name || 'Hackathon'} — {currentRound.name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isLocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: 'var(--danger)', fontSize: '13px', fontWeight: '600' }}>
              <Lock size={15} /> Round Locked
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: 'var(--success)', fontSize: '13px', fontWeight: '600' }}>
              <Clock size={15} /> Round Open
            </div>
          )}
        </div>
      </div>

      {/* Round Progress */}
      {event?.rounds && event.rounds.length > 1 && (
        <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAllRounds ? '16px' : '0', cursor: 'pointer' }} onClick={() => setShowAllRounds(p => !p)}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Round {currentRoundIndex + 1} of {event.rounds.length}: <span style={{ color: 'var(--primary)' }}>{currentRound.name}</span>
            </span>
            {showAllRounds ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
          </div>
          {showAllRounds && (
            <div style={{ display: 'flex', gap: '0' }}>
              {event.rounds.map((r, i) => (
                <div key={i} style={{ flex: 1, padding: '10px 14px', background: i === currentRoundIndex ? 'rgba(59,130,246,0.1)' : i < currentRoundIndex ? 'rgba(16,185,129,0.06)' : 'var(--bg-subtle)', border: `1px solid ${i === currentRoundIndex ? 'rgba(59,130,246,0.3)' : 'var(--border-color)'}`, borderRadius: i === 0 ? '8px 0 0 8px' : i === event.rounds.length - 1 ? '0 8px 8px 0' : '0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: i === currentRoundIndex ? 'var(--primary)' : i < currentRoundIndex ? 'var(--success)' : 'var(--text-secondary)' }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {r.start && r.start.includes('T') ? new Date(r.start).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : r.start} → 
                    {r.end ? (r.end.includes('T') ? new Date(r.end).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : r.end) : 'TBD'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Form */}
        <div>
          {isSubmitted && existingSubmission ? (
            /* ── Submitted State ── */
            <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={26} color="var(--success)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--success)' }}>Submission Received!</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Submitted at {new Date(existingSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {[
                  { label: 'Project Name', value: existingSubmission.submissionName },
                  { label: 'Description', value: existingSubmission.description },
                  { label: 'Tech Stack', value: existingSubmission.techStackName },
                  { label: 'Repository URL', value: existingSubmission.githubUrl, isLink: true },
                  existingSubmission.demoUrl && { label: 'Demo URL', value: existingSubmission.demoUrl, isLink: true },
                  existingSubmission.slideUrl && { label: 'Slides', value: existingSubmission.slideUrl, isLink: true },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{item.label}</div>
                    {item.isLink ? (
                      <a href={item.value} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--primary)', wordBreak: 'break-all' }}>{item.value}</a>
                    ) : (
                      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{item.value}</div>
                    )}
                  </div>
                ))}
              </div>

              {!isLocked && (
                <button onClick={handleEdit} className="btn btn-secondary" style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}>
                  Edit Submission
                </button>
              )}
            </div>
          ) : (
            /* ── Form State ── */
            <div className="glass-panel" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                  {isLocked 
                    ? (currentRound?.status === 'CREATED' ? '🔒 Submission Closed (Round Not Started)' : '🔒 Round Locked – View Only') 
                    : 'Submit Your Project'}
                </h2>

              {error && (
                <div className={shaking ? 'shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '20px', color: '#ef4444', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Name *</label>
                  <input disabled={isLocked} type="text" value={formData.projectName} onChange={e => setFormData(p => ({ ...p, projectName: e.target.value }))}
                    placeholder="e.g. MedRAG — Medical Knowledge Assistant"
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Project Description *</label>
                  <textarea disabled={isLocked} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your project, the problem it solves, and your approach..."
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tech Stack</label>
                  <input disabled={isLocked} type="text" value={formData.techStack} onChange={e => setFormData(p => ({ ...p, techStack: e.target.value }))}
                    placeholder="e.g. Python, LangChain, Pinecone, React"
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <GitBranch size={14} /> GitHub Repository URL *
                  </label>
                  <input disabled={isLocked} type="url" value={formData.repoUrl} onChange={e => setFormData(p => ({ ...p, repoUrl: e.target.value }))}
                    placeholder="https://github.com/yourteam/project"
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <Globe size={14} /> Demo URL
                    </label>
                    <input disabled={isLocked} type="url" value={formData.demoUrl} onChange={e => setFormData(p => ({ ...p, demoUrl: e.target.value }))}
                      placeholder="https://your-demo.vercel.app"
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <FileText size={14} /> Slides URL
                    </label>
                    <input disabled={isLocked} type="url" value={formData.slidesUrl} onChange={e => setFormData(p => ({ ...p, slidesUrl: e.target.value }))}
                      placeholder="https://slides.com/..."
                      style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Demo Video URL</label>
                  <input disabled={isLocked} type="url" value={formData.videoUrl} onChange={e => setFormData(p => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/..."
                    style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', opacity: isLocked ? 0.6 : 1 }} />
                </div>

                {!isLocked && (
                  <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary"
                    style={{ padding: '14px', fontSize: '15px', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    {isSubmitting ? <><Clock size={18} /> Submitting...</> : <><Send size={18} /> Submit Project</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Team info */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Your Team</h3>
            {teamData ? (
              <>
                <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{teamData.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamData.members?.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `hsl(${i * 60}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                        {m.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No team found. Please join a team first.</p>
            )}
          </div>

          {/* Round info + criteria */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Scoring Criteria</h3>
            {currentRound?.criteria && currentRound.criteria.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentRound.criteria.map((c, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{c.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>{Math.round((c.weight || 0) * 100)}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-active)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((c.weight || 0) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No criteria configured for this round.</p>
            )}
          </div>

          {/* Deadline */}
          <div style={{ padding: '16px', background: isLocked ? 'rgba(239,68,68,0.05)' : 'rgba(59,130,246,0.05)', border: '1px solid', borderColor: isLocked ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', borderRadius: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {isLocked ? <Lock size={16} color="var(--danger)" /> : <Clock size={16} color="var(--primary)" />}
              <span style={{ fontSize: '13px', fontWeight: '600', color: isLocked ? 'var(--danger)' : 'var(--primary)' }}>
                {isLocked 
                  ? (currentRound?.status === 'CREATED' ? 'Round Not Started' : 'Submission Closed') 
                  : 'Deadline'}
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              {isLocked 
                ? (currentRound?.status === 'SCORING' ? 'Judges are currently scoring this round.' : 
                   currentRound?.status === 'UNDER_REVIEW' ? 'This round is currently under review.' : 
                   currentRound?.status === 'COMPLETED' ? 'This round has concluded.' : 
                   currentRound?.status === 'CREATED' ? 'This round has not started yet.' : 'Submissions are locked.')
                : (currentRound.end ? (currentRound.end.includes('T') ? new Date(currentRound.end).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : currentRound.end) : 'TBD')}
            </div>
            {!isLocked && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>You can edit your submission until the round is locked.</div>}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default MySubmission;
