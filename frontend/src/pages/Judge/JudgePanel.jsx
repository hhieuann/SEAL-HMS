import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Star, GitBranch, Globe, FileText, Users, Target, ChevronRight, RefreshCw } from 'lucide-react';
import { teamService } from '../../api/teamService';
import { scoreService, submissionService, criterionService } from '../../api/scoreService';
import { eventService } from '../../api/eventService';
import './JudgePanel.css';

const JudgePanel = () => {
  const [teams, setTeams] = useState([]);
  const [event, setEvent] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [criteria, setCriteria] = useState([]);
  const [submissions, setSubmissions] = useState({});     // teamId -> submission
  const [existingScores, setExistingScores] = useState({}); // teamId -> scores array
  const [loading, setLoading] = useState(true);

  const [activeTeamId, setActiveTeamId] = useState(null);
  const [scores, setScores] = useState({});   // criterionId -> value
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitToast, setSubmitToast] = useState('');
  const [submitError, setSubmitError] = useState('');

  const judgeAccountId = parseInt(localStorage.getItem('userId') || '1');

  useEffect(() => {
    const load = async () => {
      try {
        let evt = null;
        const ctxStr = localStorage.getItem('expertContext');
        let ctx = ctxStr ? JSON.parse(ctxStr) : null;

        if (ctx && ctx.eventId) {
          const eventDetails = await eventService.getEventDetails(ctx.eventId);
          evt = eventDetails?.data || eventDetails || null;
        } else {
          const eventsRes = await eventService.getAssignedEvents();
          evt = eventsRes?.data?.[0] || null;
        }
        
        if (evt) {
          const roundsRes = await eventService.getEventRounds(evt.id);
          evt.rounds = roundsRes.data || [];
        }
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
        setCurrentRound(round);

        if (!evt || !round) return;

        // Load real teams from backend
        const teamsData = await teamService.getTeamsByEvent(evt.id);
        const teamsList = teamsData?.data || teamsData || [];
        const approvedTeams = teamsList.filter(t => {
          const isStatusValid = ['REGISTERED', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(t.status);
          const isTrackValid = (ctx && ctx.trackId) ? t.trackId === ctx.trackId : true;
          return isStatusValid && isTrackValid;
        });

        if (approvedTeams.length > 0) {
          // Load criteria for this round
          try {
            const criteriaRes = await criterionService.getCriteria(round.id);
            const criteriaList = criteriaRes?.data || [];
            setCriteria(criteriaList);
          } catch (e) {
            console.error(e);
          }

          // Load submissions & existing scores for all approved teams
          const subMap = {};
          const scoresMap = {};
          await Promise.all(approvedTeams.map(async (team) => {
            try {
              const subRes = await submissionService.getSubmission(round.id, team.id);
              if (subRes?.data) subMap[team.id] = subRes.data;

              // Try fetching scores for this submission
              if (subRes?.data?.id) {
                const scoresRes = await scoreService.getScoresByJudge(subRes.data.id, judgeAccountId);
                if (scoresRes?.data?.length) scoresMap[team.id] = scoresRes.data;
              }
            } catch {
              // Team hasn't submitted yet for this round — exclude from list
            }
          }));
          setSubmissions(subMap);
          setExistingScores(scoresMap);

          // Only show teams that have a submission for THIS round (eliminates old round carry-overs)
          const teamsWithSubmission = approvedTeams.filter(t => !!subMap[t.id]);
          setTeams(teamsWithSubmission);

          // Set first team with a submission as active
          if (teamsWithSubmission.length > 0) {
            setActiveTeamId(teamsWithSubmission[0].id);
            initScores(teamsWithSubmission[0].id, scoresMap);
          }
        }
      } catch (e) {
        console.error('JudgePanel load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const initScores = (teamId, scoresMap) => {
    const existing = scoresMap[teamId];
    if (existing && existing.length > 0) {
      const init = {};
      existing.forEach(s => { init[s.criterionId] = parseFloat(s.score); });
      setScores(init);
      setFeedback(existing[0]?.comment || '');
    } else {
      setScores({});
      setFeedback('');
    }
  };

  const handleSelectTeam = (teamId) => {
    setActiveTeamId(teamId);
    setSubmitError('');
    initScores(teamId, existingScores);
  };

  const computeTotal = () => {
    let weightedTotal = 0;
    criteria.forEach(c => {
      const val = parseFloat(scores[c.id]) || 0;
      const max = parseFloat(c.maxScore) || 1;
      const weight = (parseFloat(c.weight) || 0) * 100; // BE stores 0–1, display as %
      weightedTotal += (val / max) * weight;
    });
    return weightedTotal;
  };

  const computeExistingTotal = (myScores) => {
    if (!myScores || !myScores.length) return 0;
    let weightedTotal = 0;
    myScores.forEach(s => {
      const c = criteria.find(cr => cr.id === s.criterionId);
      const val = parseFloat(s.score) || 0;
      const max = parseFloat(s.maxScore) || 1;
      const weight = (c ? (parseFloat(c.weight) || 0) : 0) * 100; // BE stores 0–1
      weightedTotal += (val / max) * weight;
    });
    return weightedTotal;
  };

  const handleSubmitScore = async () => {
    const total = computeTotal();
    if (total <= 0) { setSubmitError('Please enter scores before submitting.'); return; }
    if (!criteria.length) { setSubmitError('No criteria defined for this round. Ask admin to add criteria first.'); return; }

    const submission = submissions[activeTeamId];
    if (!submission) { setSubmitError('This team has no submission yet. You can score via in-person assessment but a submission must exist.'); return; }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      const scoreItems = Object.entries(scores).map(([criterionId, value]) => ({
        criterionId: parseInt(criterionId),
        score: parseFloat(value),
        comment: feedback,
      }));

      const result = await scoreService.gradeSubmission(submission.id, judgeAccountId, scoreItems);
      const newScores = result?.data || [];

      setExistingScores(prev => ({ ...prev, [activeTeamId]: newScores }));
      setSubmitToast(`✓ Score submitted: ${total.toFixed(1)} pts for ${activeTeam?.name}`);
      setTimeout(() => setSubmitToast(''), 3500);
    } catch (e) {
      setSubmitError('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const activeSubmission = submissions[activeTeamId];
  const myScoresForActiveTeam = existingScores[activeTeamId];
  const total = computeTotal();
  const maxTotal = 100;

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <p>Loading judge panel...</p>
      </div>
    );
  }

  if (!currentRound) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <h2 style={{ marginBottom: '8px' }}>No Active Round</h2>
        <p>There is no active round to judge right now.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Judge Panel</h1>
          <p className="subtitle">
            {event?.name || 'Hackathon'} — {currentRound.name}
            {currentRoundIndex > 0 && <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>🏆 FINALS</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: 'var(--success)', fontSize: '13px', fontWeight: '600' }}>
          <Star size={15} /> Scoring Open
        </div>
      </div>

      {criteria.length === 0 && (
        <div style={{ padding: '14px 20px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
          <AlertCircle size={18} color="var(--warning)" />
          <span><strong>No criteria defined</strong> for this round. Ask the admin to set up scoring criteria in the <strong>Criteria Manager</strong> first.</span>
        </div>
      )}

      <div className="judge-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Column 1: Team List */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Teams ({teams.length})</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{currentRound.name}</p>
          </div>
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {teams.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No approved teams yet.
              </div>
            ) : teams.map(team => {
              const hasSubmission = !!submissions[team.id];
              const scored = (existingScores[team.id]?.length || 0) > 0;
              return (
                <div
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  style={{
                    padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                    background: activeTeamId === team.id ? 'rgba(245,158,11,0.08)' : 'transparent',
                    borderLeft: activeTeamId === team.id ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{team.name}</div>
                    {scored
                      ? <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                      : hasSubmission
                        ? <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)', flexShrink: 0, marginTop: '3px' }} />
                        : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--bg-active)', flexShrink: 0, marginTop: '3px' }} />
                    }
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {team.trackId ? `Track ID: ${team.trackId}` : 'No track assigned'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: hasSubmission ? 'rgba(16,185,129,0.1)' : 'var(--bg-hover)', color: hasSubmission ? 'var(--success)' : 'var(--text-secondary)', fontWeight: '600' }}>
                      {hasSubmission ? 'Submitted' : 'No submission'}
                    </span>
                    {scored && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--primary)', fontWeight: '600' }}>
                        Scored
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Project Detail */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {!activeTeam ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Select a team to view details</div>
          ) : (
            <>
              <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{activeTeam.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {activeTeam.trackId ? `Track #${activeTeam.trackId}` : 'No track assigned'} · Status: {activeTeam.status}
                </div>
              </div>

              {activeSubmission ? (
                <>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{activeSubmission.submissionName || 'Unnamed Project'}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
                    {activeSubmission.description || 'No description provided.'}
                  </p>
                  {activeSubmission.techStackName && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tech Stack</div>
                      <div style={{ fontSize: '13px' }}>{activeSubmission.techStackName}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeSubmission.githubUrl && (
                      <a href={activeSubmission.githubUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <GitBranch size={16} /><span style={{ flex: 1, fontSize: '13px' }}>GitHub Repository</span><ChevronRight size={14} color="var(--text-secondary)" />
                      </a>
                    )}
                    {activeSubmission.demoUrl && (
                      <a href={activeSubmission.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', color: 'var(--primary)', textDecoration: 'none' }}>
                        <Globe size={16} /><span style={{ flex: 1, fontSize: '13px' }}>Live Demo</span><ChevronRight size={14} />
                      </a>
                    )}
                    {activeSubmission.slideUrl && (
                      <a href={activeSubmission.slideUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <FileText size={16} /><span style={{ flex: 1, fontSize: '13px' }}>Presentation Slides</span><ChevronRight size={14} color="var(--text-secondary)" />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>This team has not submitted yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>You can still score them based on in-person evaluation once their submission exists.</p>
                </div>
              )}

              {myScoresForActiveTeam && myScoresForActiveTeam.length > 0 && (
                <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={16} color="var(--success)" />
                      <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: '600' }}>
                        You already scored this team: <strong>{computeExistingTotal(myScoresForActiveTeam).toFixed(1)} pts total</strong>
                      </span>
                    </div>
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {myScoresForActiveTeam.map((s, i) => (
                      <span key={i} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-subtle)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                        {s.criterionName}: <strong>{s.score}</strong>/{s.maxScore}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Column 3: Scoring Rubric */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--primary)" /> Scoring Rubric
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{currentRound.name}</p>

            {criteria.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {criteria.map((c) => {
                  const val = scores[c.id] ?? 0;
                  const max = parseFloat(c.maxScore) || 10;
                  return (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>{c.name}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number" min="0" max={max} step="0.5" value={val}
                            onChange={e => {
                              const v = Math.max(0, Math.min(max, parseFloat(e.target.value) || 0));
                              setScores(p => ({ ...p, [c.id]: v }));
                            }}
                            style={{ width: '56px', padding: '4px 8px', textAlign: 'center', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                          />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/ {max}</span>
                        </div>
                      </div>
                      <input
                        type="range" min="0" max={max} step="0.5" value={val}
                        onChange={e => setScores(p => ({ ...p, [c.id]: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                      <div style={{ height: '4px', background: 'var(--bg-active)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${(val / max) * 100}%`, height: '100%', background: val / max > 0.8 ? 'var(--success)' : val / max > 0.5 ? 'var(--primary)' : 'var(--warning)', borderRadius: '2px', transition: 'width 0.2s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                No criteria configured for this round.<br />
                <span style={{ fontSize: '12px' }}>Ask an admin to add criteria.</span>
              </p>
            )}

            <div style={{ marginTop: '24px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Feedback (Optional)</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Write your constructive feedback here..."
                rows={3}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Total + Submit */}
          <div className="glass-panel" style={{ padding: '20px', border: `1px solid ${total >= maxTotal * 0.8 ? 'rgba(16,185,129,0.3)' : total >= maxTotal * 0.5 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.2)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Score</span>
              <span style={{ fontSize: '32px', fontWeight: '900', color: total >= maxTotal * 0.8 ? 'var(--success)' : total >= maxTotal * 0.5 ? 'var(--primary)' : 'var(--warning)' }}>
                {total.toFixed(1)}
                <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '400' }}>/{maxTotal}</span>
              </span>
            </div>

            {submitError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} /> {submitError}
              </div>
            )}

            <button
              onClick={handleSubmitScore}
              disabled={isSubmitting || !activeTeamId || !criteria.length || !activeSubmission}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', gap: '8px' }}
            >
              {isSubmitting
                ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                : myScoresForActiveTeam?.length
                  ? <><CheckCircle size={16} /> Update Score</>
                  : <><Star size={16} /> Submit Score</>
              }
            </button>
          </div>
        </div>
      </div>

      {submitToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <CheckCircle size={20} color="var(--success)" />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Score Submitted!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{submitToast}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgePanel;
