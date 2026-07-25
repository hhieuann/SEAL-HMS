import { useState, useEffect } from 'react';
import { Trophy, MessageSquare, Target, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import './Workspace.css';

const Scores = () => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [teamData, setTeamData] = useState(null);
  
  const [myScore, setMyScore] = useState(0);
  const [criteriaAvg, setCriteriaAvg] = useState({});
  // Feedback text is rendered per judge from `judgeEvaluations`; only the setter is kept.
  const [, setFeedbacks] = useState([]);
  const [judgeEvaluations, setJudgeEvaluations] = useState([]);
  const [isScorePending, setIsScorePending] = useState(false);
  
  const [trackName, setTrackName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isFinals, setIsFinals] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const teamId = localStorage.getItem('p_teamId');
        if (!teamId) { setLoading(false); return; }

        const { eventService } = await import('../../api/eventService');
        const { teamService } = await import('../../api/teamService');
        const { criterionService, submissionService, scoreService } = await import('../../api/scoreService');
        
        const eventsRes = await eventService.getEvents();
        const evts = eventsRes.data || [];
        
        let evt = null;
        let myTeamsList = [];
        for (const e of evts) {
          try {
            const teamsData = await teamService.getTeamsByEvent(e.id);
            const tList = teamsData?.data || teamsData || [];
            if (tList.some(t => t.id === parseInt(teamId) || t.id === teamId)) {
              evt = e;
              myTeamsList = tList;
              break;
            }
          } catch { /* ignored on purpose */ }
        }
        
        if (!evt && evts.length > 0) evt = evts[0];

        // Fallback: If user is not in any team (e.g. Admin testing), just load teams for the first event
        if (myTeamsList.length === 0 && evt) {
          try {
            const teamsData = await teamService.getTeamsByEvent(evt.id);
            myTeamsList = teamsData?.data || teamsData || [];
          } catch { /* ignored on purpose */ }
        }

        if (evt) {
          const roundsRes = await eventService.getEventRounds(evt.id);
          evt.rounds = roundsRes.data || [];
        }
        setEvent(evt);
        
        let activeRoundIdx = 0;
        let savedRoundIdx = 0;
        if (evt?.rounds && evt.rounds.length > 0) {
          const now = new Date();
          const nowStr = now.toISOString();
          activeRoundIdx = evt.rounds.findIndex(r => {
            if (!r.start || !r.end) return false;
            return r.start <= nowStr && r.end >= nowStr;
          });
          if (activeRoundIdx === -1) {
            activeRoundIdx = evt.rounds.length - 1;
          }

          let lastStartedIdx = -1;
          for (let i = evt.rounds.length - 1; i >= 0; i--) {
            if (evt.rounds[i].status !== 'CREATED' && evt.rounds[i].status?.toLowerCase() !== 'planned') {
              lastStartedIdx = i;
              break;
            }
          }
          savedRoundIdx = lastStartedIdx !== -1 ? lastStartedIdx : 0;
        }
        setCurrentRoundIndex(savedRoundIdx);
        const round = evt?.rounds?.[savedRoundIdx] || null;
        setCurrentRound(round);

        const teamName = localStorage.getItem('p_teamName') || 'My Team';
        setTeamData({ id: teamId, name: teamName });

        if (!round) { setLoading(false); return; }

        try {
          const critRes = await criterionService.getCriteria(round.id);
          if (critRes?.data) round.criteria = critRes.data;
        } catch { /* ignored on purpose */ }

        let subId = null;
        try {
          const subRes = await submissionService.getSubmission(round.id, teamId);
          if (subRes?.data?.id) subId = subRes.data.id;
        } catch { /* ignored on purpose */ }

        if (subId) {
          const scoresRes = await scoreService.getScores(subId);
          const scoresData = scoresRes?.data || scoresRes || [];

          const avgMap = {};
          let weightedTotal = 0;
          
          (round.criteria || []).forEach(crit => {
            const cId = crit.id;
            const scoresForCrit = scoresData.filter(s => s.criterionId === cId);
            if (scoresForCrit.length > 0) {
               const rawAvg = scoresForCrit.reduce((acc, curr) => acc + (curr.score || 0), 0) / scoresForCrit.length;
               const max = parseFloat(crit.maxScore) || 1;
               const weight = (parseFloat(crit.weight) || 0) * 100; // BE stores 0–1
               const weightedScore = (rawAvg / max) * weight;
               avgMap[cId] = parseFloat(weightedScore.toFixed(1));
               weightedTotal += weightedScore;
            } else {
               avgMap[cId] = 0;
            }
          });

          const fbList = [];
          const fbSet = new Set();
          
          const judgeMap = {};
          
          scoresData.forEach(s => {
            if (s.comment && s.comment.trim().length > 0) {
              const key = `${s.judgeEmail}-${s.comment}`;
              if (!fbSet.has(key)) {
                fbSet.add(key);
                fbList.push({ judgeId: s.judgeEmail || 'Judge', text: s.comment });
              }
            }
            
            const jEmail = s.judgeEmail || 'Unknown Judge';
            if (!judgeMap[jEmail]) {
               judgeMap[jEmail] = {
                  judgeName: s.judgeName || jEmail,
                  judgeEmail: jEmail,
                  scores: {},
                  comments: []
               };
            }
            judgeMap[jEmail].scores[s.criterionId] = s.score;
            if (s.comment && s.comment.trim()) {
               if (!judgeMap[jEmail].comments.includes(s.comment)) {
                  judgeMap[jEmail].comments.push(s.comment);
               }
            }
          });
          
          setJudgeEvaluations(Object.values(judgeMap));

          let isPending = round?.status?.toUpperCase() !== 'COMPLETED';
          let expectedJudgesCount = 0;
          let myTrackId = teamData?.trackId || (myTeamsList.find(t => t.id === parseInt(teamId) || t.id === teamId)?.trackId);

          if (myTrackId) {
             try {
                const { trackService } = await import('../../api/trackService');
                const trackAssig = await trackService.getTrackAssignments(myTrackId);
                const assignments = trackAssig?.data || trackAssig || [];
                expectedJudgesCount = assignments.filter(a => a.role === 'JUDGE').length;
             } catch { /* ignored on purpose */ }
          }
          
          const actualJudgesCount = Object.keys(judgeMap).length;
          if (expectedJudgesCount > 0 && actualJudgesCount < expectedJudgesCount) {
             isPending = true;
          }
          setIsScorePending(isPending);

          setMyScore(parseFloat(weightedTotal.toFixed(1)));
          setCriteriaAvg(avgMap);
          setFeedbacks(fbList);
        } else {
          setMyScore(0);
          setCriteriaAvg({});
          setFeedbacks([]);
        }

        const isLastRound = savedRoundIdx === (evt?.rounds?.length - 1);
        if (isLastRound) {
          setIsFinals(true);
          setTrackName(savedRoundIdx > 0 ? 'Finals' : 'Current Track');
        } else {
          setIsFinals(false);
          setTrackName('Current Track');
        }
        
        try {
            const { standingsService } = await import('../../api/scoreService');
            const standingsRes = await standingsService.getStandings(round.id);
            const dbStandings = standingsRes?.data || standingsRes || [];
            const dbScoreMap = {};
            dbStandings.forEach(s => { if (s.teamId && s.score != null) dbScoreMap[s.teamId] = parseFloat(s.score); });

            const myStanding = dbStandings.find(s => String(s.teamId) === String(teamId));
            const fullMyTeam = myTeamsList.find(t => String(t.id) === String(teamId));
            
            setTeamData(prev => ({
              ...prev,
              isDisqualified: fullMyTeam?.isDisqualified || false,
              penaltyPoints: myStanding?.penaltyPoints || 0,
              penaltyReason: myStanding?.penaltyReason || ''
            }));

            let finalLeaderboard = [];

            // Try loading tracks from DB (works on any browser, not just admin's)
            let dbTracks = [];
            try {
              const { trackService } = await import('../../api/trackService');
              dbTracks = (await trackService.getTracksByEvent(evt.id))?.data || [];
            } catch { /* ignored on purpose */ }

            if (savedRoundIdx > 0) {
              // Round 2+: Only show teams that have scores for THIS round (= teams that advanced)
              // Teams eliminated in Round 1 won't have submissions/scores in Round 2
              const teamsWithScores = myTeamsList.filter(t => dbScoreMap[t.id] != null);
              
              if (teamsWithScores.length > 0) {
                finalLeaderboard = teamsWithScores.map(t => ({
                  team: t.name, teamId: t.id, 
                  score: dbScoreMap[t.id] ?? null,
                  fromTrack: dbTracks.find(tr => tr.id === t.trackId)?.name || 'Finals',
                  isDisqualified: t.isDisqualified || false
                }));
              } else {
                // No scores yet — fallback: use localStorage trackDraw if available (admin browser)
                const trackDrawStr = localStorage.getItem(`trackDraw_${evt.id}`);
                if (trackDrawStr) {
                  const drawn = JSON.parse(trackDrawStr);
                  finalLeaderboard = drawn.flatMap(track => 
                    (track.teams || []).map(teamItem => {
                      const teamNameStr = typeof teamItem === 'object' ? teamItem.name : teamItem;
                      const teamObj = myTeamsList.find(t => t.name === teamNameStr);
                      const tId = teamObj?.id;
                      return { team: teamNameStr, teamId: tId, score: tId ? (dbScoreMap[tId] ?? null) : null, fromTrack: track.name, isDisqualified: teamObj?.isDisqualified || false };
                    })
                  );
                }
              }

              finalLeaderboard.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
              finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
            } else {
              // Round 1: show teams grouped by their DB track
              if (dbTracks.length > 0) {
                const myTeamName = localStorage.getItem('myTeamName');
                const myTeam = myTeamsList.find(t => t.name === myTeamName);
                const myTrackId = myTeam?.trackId;

                if (myTrackId) {
                  // Show only teams in same track
                  const sameTrackTeams = myTeamsList.filter(t => t.trackId === myTrackId);
                  finalLeaderboard = sameTrackTeams.map(t => ({
                    team: t.name, teamId: t.id,
                    score: dbScoreMap[t.id] ?? null,
                    fromTrack: dbTracks.find(tr => tr.id === myTrackId)?.name || 'My Track',
                    isDisqualified: t.isDisqualified || false
                  }));
                } else {
                  // Can't determine track, show all
                  finalLeaderboard = myTeamsList.map(t => ({
                    team: t.name, teamId: t.id,
                    score: dbScoreMap[t.id] ?? null,
                    fromTrack: dbTracks.find(tr => tr.id === t.trackId)?.name || 'Global',
                    isDisqualified: t.isDisqualified || false
                  }));
                }

                finalLeaderboard.sort((a, b) => {
                  if (a.score === null && b.score === null) return 0;
                  if (a.score === null) return 1;
                  if (b.score === null) return -1;
                  return b.score - a.score;
                });
                finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
              } else {
                // No DB tracks — show all teams globally
                finalLeaderboard = myTeamsList.map(t => ({
                  team: t.name, teamId: t.id,
                  score: dbScoreMap[t.id] ?? null,
                  fromTrack: 'Global',
                  isDisqualified: t.isDisqualified || false
                }));
                finalLeaderboard.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
                finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
              }
            }

            setLeaderboard(finalLeaderboard);
          } catch (err) {
            console.error("Failed to load leaderboard:", err);
            setLeaderboard([]);
          }

      } catch (e) {
        console.error("Failed to load scores data:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <p>Loading scores...</p>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="animate-fade-in" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
        <h2 style={{ marginBottom: '8px' }}>No Team Found</h2>
        <p>You must join a team to see scores.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Scores & Results</h1>
          <p className="subtitle">{trackName ? `Track: ${trackName} | ` : ''}Phase: {currentRound?.name}</p>
        </div>
      </div>

      {teamData.isDisqualified && (
        <div style={{ padding: '16px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AlertCircle size={24} color="var(--danger)" />
          <div>
            <h3 style={{ color: 'var(--danger)', margin: 0, fontSize: '18px' }}>Your Team is Disqualified</h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Please contact the event administrator for more details.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Team Score Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} color="var(--primary)" /> Your Team Score</h2>
            <div style={{ background: '#F8FAFC', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {(() => {
                 const finalScore = myScore - (teamData.penaltyPoints || 0);
                 const hasScore = myScore > 0 || (teamData.penaltyPoints || 0) > 0;
                 return (
                   <span style={{ fontSize: '28px', fontWeight: '800', color: isScorePending ? 'var(--warning)' : (hasScore ? 'var(--success)' : 'var(--text-secondary)') }}>
                     {isScorePending ? 'Pending' : (hasScore ? parseFloat(finalScore.toFixed(2)) : '—')}
                   </span>
                 );
              })()}
              {!isScorePending && <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>/{currentRound?.criteria?.reduce((s,c) => s + Math.round((c.weight||0)*100), 0) || 100}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isScorePending ? (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                Your score is pending. The results will be published here automatically once the Admin officially ends the round and scoring is closed.
              </div>
            ) : (
              <>
                {currentRound?.criteria?.map((c, i) => {
              const key = c.id || c.name;
              const val = criteriaAvg[key] || 0;
              const max = Math.round((c.weight || 0) * 100); // weight is 0–1, display as %
              const pct = max > 0 ? (val / max) * 100 : 0;
              const colors = ['var(--primary)', 'var(--accent-1)', 'var(--success)', 'var(--warning)'];
              const color = colors[i % colors.length];
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span>{c.name}</span>
                    <strong>{val} / {max}%</strong>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color }}></div>
                  </div>
                </div>
              );
            })}
              {teamData.penaltyPoints > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(239,68,68,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--danger)' }}>Penalty Deductions</span>
                    {teamData.penaltyReason && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Reason: {teamData.penaltyReason}</div>}
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>-{teamData.penaltyPoints}</span>
                </div>
              )}
              </>
            )}
            {!isScorePending && (!currentRound?.criteria || currentRound.criteria.length === 0) && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No criteria found.</div>
            )}
          </div>
        </div>

        {/* Individual Judge Evaluations */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><MessageSquare size={20} color="var(--accent-2)" /> Detailed Judge Evaluations</h2>
          {isScorePending ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Evaluations will be visible once the Admin officially ends the round and scoring is closed.
            </div>
          ) : judgeEvaluations.length > 0 ? judgeEvaluations.map((judge, jIdx) => (
            <div key={jIdx} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--accent-3)' }}>🎓 {judge.judgeName}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Scores */}
                <div>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Scores</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentRound?.criteria?.map((c, i) => {
                      const key = c.id || c.name;
                      const val = judge.scores[key] || 0;
                      const max = c.maxScore || 1;
                      const maxScoreValue = parseFloat(max);
                      const pct = maxScoreValue > 0 ? (val / maxScoreValue) * 100 : 0;
                      const colors = ['var(--primary)', 'var(--accent-1)', 'var(--success)', 'var(--warning)'];
                      const color = colors[i % colors.length];
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                            <span>{c.name}</span>
                            <strong>{val} / {maxScoreValue}</strong>
                          </div>
                          <div style={{ height: '6px', background: 'var(--bg-active)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Feedback */}
                <div>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Feedback</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {judge.comments.length > 0 ? judge.comments.map((comment, i) => (
                      <div key={i} style={{ padding: '12px', background: 'white', borderRadius: '8px', borderLeft: '3px solid var(--primary)', fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        "{comment}"
                      </div>
                    )) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No feedback provided.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No evaluations available yet.
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Trophy size={24} color="var(--warning)" /> {isFinals ? 'Finals Leaderboard' : `${trackName} Leaderboard`}</h2>
          {!isFinals && currentRound?.promotionTopN > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981' }}></div>
              Top {currentRound.promotionTopN} advance to {event?.rounds?.[currentRoundIndex + 1]?.name || 'Next Round'}
            </div>
          )}
        </div>

        {isScorePending ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>The leaderboard will be revealed once the Admin officially ends the round and scoring is closed.</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Leaderboard not available yet.</div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Rank</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Team Name</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>University</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Score</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, idx) => {
                  const isMe = team.teamId == teamData?.id;
                  const isTop3 = isFinals && team.rank <= 3;
                  const isPromoted = !isFinals && team.rank <= (currentRound?.promotionTopN || 2);
                  
                  let rankDisplay = team.rank;
                  if (team.rank === 1) rankDisplay = <div className="rank-badge gold" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', fontWeight: 'bold' }}>1</div>;
                  else if (team.rank === 2) rankDisplay = <div className="rank-badge silver" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', color: '#000', fontWeight: 'bold' }}>2</div>;
                  else if (team.rank === 3) rankDisplay = <div className="rank-badge bronze" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff', fontWeight: 'bold' }}>3</div>;

                  return (
                    <tr key={idx} style={{ 
                      background: team.isDisqualified ? 'rgba(239, 68, 68, 0.03)' : (isMe ? 'rgba(59,130,246,0.05)' : (isPromoted || isTop3) ? 'rgba(16, 185, 129, 0.03)' : 'transparent'), 
                      borderBottom: '1px solid var(--border-color)',
                      borderLeft: team.isDisqualified ? '3px solid var(--danger)' : (isMe ? '3px solid var(--primary)' : '3px solid transparent'),
                      opacity: team.isDisqualified ? 0.6 : 1
                    }}>
                      <td style={{ padding: '16px', fontWeight: '600', paddingLeft: typeof rankDisplay === 'number' ? '24px' : '16px' }}>
                        {rankDisplay}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '600', color: isMe ? 'var(--primary)' : 'inherit' }}>
                        {team.team} {isMe && '(You)'}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>{team.university}</td>
                      <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{team.score ?? '—'}</td>
                      <td style={{ padding: '16px' }}>
                        {team.isDisqualified ? (
                          <span style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <AlertCircle size={14} /> Disqualified
                          </span>
                        ) : isFinals ? (
                          team.rank === 1 ? <span style={{ padding: '4px 12px', background: 'rgba(245, 158, 11, 0.2)', color: '#d97706', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Champion 🏆</span> :
                          team.rank === 2 ? <span style={{ padding: '4px 12px', background: 'rgba(148, 163, 184, 0.2)', color: '#64748b', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>Runner-up 🥈</span> :
                          team.rank === 3 ? <span style={{ padding: '4px 12px', background: 'rgba(185, 28, 28, 0.2)', color: '#b91c1c', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>2nd Runner-up 🥉</span> :
                          <span style={{ padding: '4px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>Finalist</span>
                        ) : (
                          isPromoted 
                            ? <span style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}><TrendingUp size={14}/> Promoted</span>
                            : <span style={{ padding: '4px 12px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '12px', fontWeight: '500', width: 'fit-content' }}>Eliminated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scores;
