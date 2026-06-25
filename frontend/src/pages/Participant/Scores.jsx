import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, MessageSquare, Target, TrendingUp, Medal, Clock, AlertCircle } from 'lucide-react';
import './Workspace.css';

const Scores = () => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [teamData, setTeamData] = useState(null);
  
  const [myScore, setMyScore] = useState(0);
  const [criteriaAvg, setCriteriaAvg] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  
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
          } catch (err) {}
        }
        
        if (!evt && evts.length > 0) evt = evts[0];

        // Fallback: If user is not in any team (e.g. Admin testing), just load teams for the first event
        if (myTeamsList.length === 0 && evt) {
          try {
            const teamsData = await teamService.getTeamsByEvent(evt.id);
            myTeamsList = teamsData?.data || teamsData || [];
          } catch (err) {}
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
        } catch (e) {}

        let subId = null;
        try {
          const subRes = await submissionService.getSubmission(round.id, teamId);
          if (subRes?.data?.id) subId = subRes.data.id;
        } catch (e) {}

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
          scoresData.forEach(s => {
            if (s.comment && s.comment.trim().length > 0) {
              const key = `${s.judgeEmail}-${s.comment}`;
              if (!fbSet.has(key)) {
                fbSet.add(key);
                fbList.push({ judgeId: s.judgeEmail || 'Judge', text: s.comment });
              }
            }
          });

          setMyScore(parseFloat(weightedTotal.toFixed(1)));
          setCriteriaAvg(avgMap);
          setFeedbacks(fbList);
        } else {
          setMyScore(0);
          setCriteriaAvg({});
          setFeedbacks([]);
        }

        if (savedRoundIdx > 0) {
          setIsFinals(true);
          setTrackName('Finals');
        } else {
          setTrackName('Current Track');
        }
        
        if (round?.status?.toUpperCase() === 'COMPLETED' || evt?.status?.toUpperCase() === 'COMPLETED') {
          try {
            const { standingsService } = await import('../../api/scoreService');
            const standingsRes = await standingsService.getStandings(round.id);
            const dbStandings = standingsRes?.data || standingsRes || [];
            const dbScoreMap = {};
            dbStandings.forEach(s => { if (s.teamId && s.score != null) dbScoreMap[s.teamId] = parseFloat(s.score); });

            const trackDrawStr = localStorage.getItem(`trackDraw_${evt.id}`);
            let finalLeaderboard = [];
            
            if (trackDrawStr) {
              const drawn = JSON.parse(trackDrawStr);
              const isFinalsRound = savedRoundIdx === (evt.rounds.length - 1);
              
              const standings = drawn.map(track => {
                return (track.teams || []).map(teamItem => {
                  const teamNameStr = typeof teamItem === 'object' ? teamItem.name : teamItem;
                  const teamObj = myTeamsList.find(t => t.name === teamNameStr);
                  const tId = teamObj?.id || (typeof teamItem === 'object' ? teamItem.id : undefined);
                  const score = (tId && dbScoreMap[tId] != null) ? dbScoreMap[tId] : null;
                  return { team: teamNameStr, teamId: tId, score, fromTrack: track.name };
                });
              });

              if (isFinalsRound) {
                finalLeaderboard = standings.flat();
                finalLeaderboard.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
                finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
              } else {
                const myTeamName = localStorage.getItem('myTeamName');
                const myTrackIdx = drawn.findIndex(t => t.teams && t.teams.some(teamObj => (typeof teamObj === 'string' ? teamObj : teamObj.name) === myTeamName));
                
                if (myTrackIdx !== -1) {
                  finalLeaderboard = standings[myTrackIdx];
                  finalLeaderboard.sort((a, b) => {
                    if (a.score === null && b.score === null) return 0;
                    if (a.score === null) return 1;
                    if (b.score === null) return -1;
                    return b.score - a.score;
                  });
                  finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
                }
              }
            }
            
            // Fallback: If trackDraw doesn't exist (e.g. Incognito browser) or myTrackIdx was not found
            if (finalLeaderboard.length === 0 && myTeamsList.length > 0) {
              finalLeaderboard = myTeamsList.map(t => {
                const score = dbScoreMap[t.id] != null ? dbScoreMap[t.id] : null;
                return { team: t.name, teamId: t.id, score, fromTrack: 'Global' };
              });
              finalLeaderboard.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
              finalLeaderboard = finalLeaderboard.map((t, idx) => ({ ...t, rank: idx + 1 }));
            }

            setLeaderboard(finalLeaderboard);
          } catch (err) {
            console.error("Failed to load leaderboard:", err);
            setLeaderboard([]);
          }
        } else {
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
        <div style={{ textAlign: 'right' }}>
           <div className="status-badge open" style={{ display: 'inline-block', fontSize: '14px', padding: '6px 16px', borderRadius: '20px' }}>
             Results Published
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Team Score Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={20} color="var(--primary)" /> Your Team Score</h2>
            <div style={{ background: '#F8FAFC', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: myScore > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>{myScore > 0 ? myScore : '—'}</span>
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>/{currentRound?.criteria?.reduce((s,c) => s + Math.round((c.weight||0)*100), 0) || 100}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            {(!currentRound?.criteria || currentRound.criteria.length === 0) && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No criteria found.</div>
            )}
          </div>
        </div>

        {/* Judge Feedback Card */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}><MessageSquare size={20} color="var(--accent-2)" /> Judges' Feedback</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '300px' }}>
            {feedbacks.length > 0 ? feedbacks.map((fb, i) => {
              const colors = ['var(--primary)', 'var(--accent-1)', 'var(--warning)'];
              const color = colors[i % colors.length];
              return (
                <div key={i} style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', borderLeft: `3px solid ${color}` }}>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    "{fb.text}"
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>— {fb.judgeId.replace('@gmail.com','').toUpperCase()}</div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No feedback provided yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}><Trophy size={24} color="var(--warning)" /> {isFinals ? 'Finals Leaderboard' : `${trackName} Leaderboard`}</h2>
          {!isFinals && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981' }}></div>
              Top 2 advance to {event?.rounds?.[currentRoundIndex + 1]?.name || 'Next Round'}
            </div>
          )}
        </div>

        {leaderboard.length === 0 ? (
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
                  const isPromoted = !isFinals && team.rank <= 2;
                  
                  let rankDisplay = team.rank;
                  if (team.rank === 1) rankDisplay = <div className="rank-badge gold" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', fontWeight: 'bold' }}>1</div>;
                  else if (team.rank === 2) rankDisplay = <div className="rank-badge silver" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #cbd5e1, #94a3b8)', color: '#000', fontWeight: 'bold' }}>2</div>;
                  else if (team.rank === 3) rankDisplay = <div className="rank-badge bronze" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #f87171, #b91c1c)', color: '#fff', fontWeight: 'bold' }}>3</div>;

                  return (
                    <tr key={idx} style={{ 
                      background: isMe ? 'rgba(59,130,246,0.05)' : (isPromoted || isTop3) ? 'rgba(16, 185, 129, 0.03)' : 'transparent', 
                      borderBottom: '1px solid var(--border-color)',
                      borderLeft: isMe ? '3px solid var(--primary)' : '3px solid transparent'
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
                        {isFinals ? (
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
