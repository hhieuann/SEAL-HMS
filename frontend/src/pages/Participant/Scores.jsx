import React, { useState, useEffect } from 'react';
import { Trophy, Star, Award, MessageSquare, Target, TrendingUp, Medal, Clock, AlertCircle } from 'lucide-react';
import { mockService } from '../../api/mockService';
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

        const eventsRes = await mockService.getEvents();
        const evt = eventsRes.data[0];
        setEvent(evt);
        
        const roundIdx = parseInt(localStorage.getItem('currentRoundIndex') || '0');
        setCurrentRoundIndex(roundIdx);
        const round = evt?.rounds?.[roundIdx];
        setCurrentRound(round);

        const teamRes = await mockService.getTeamDetails(teamId);
        const myTeam = teamRes.data;
        setTeamData(myTeam);

        if (!round) { setLoading(false); return; }

        const roundId = round.id || String(roundIdx);
        const allScoresRes = await mockService.getAllScores(roundId);
        const allScores = allScoresRes.data || {};

        // Calculate my team's detailed scores
        const myJudgesScores = allScores[teamId] ? Object.values(allScores[teamId]) : [];
        if (myJudgesScores.length > 0) {
          // Average total
          const totalAvg = myJudgesScores.reduce((s, j) => s + (j.total || 0), 0) / myJudgesScores.length;
          setMyScore(Math.round(totalAvg * 10) / 10);

          // Average criteria
          const cAvg = {};
          round.criteria?.forEach(c => {
            const key = c.id || c.name;
            let sum = 0;
            myJudgesScores.forEach(j => {
              sum += (j.criteriaScores?.[key] || 0);
            });
            cAvg[key] = Math.round((sum / myJudgesScores.length) * 10) / 10;
          });
          setCriteriaAvg(cAvg);

          // Feedbacks
          const fbs = myJudgesScores.filter(j => j.feedback?.trim()).map(j => ({
            judgeId: j.judgeId,
            text: j.feedback
          }));
          setFeedbacks(fbs);
        }

        // Leaderboard Logic
        const trackDrawStr = localStorage.getItem('trackDraw');
        const teamsRes = await mockService.getTeams();
        const teamsList = teamsRes.data;

        if (trackDrawStr) {
          const drawn = JSON.parse(trackDrawStr);
          
          let foundTrack = null;
          
          // Rebuild all standings
          drawn.forEach((track) => {
            const teamEntries = (track.teams || []).map(teamName => {
              const teamObj = teamsList.find(t => t.name === teamName);
              const tId = teamObj?.id;
              const judgeEntries = tId && allScores[tId] ? Object.values(allScores[tId]) : [];
              const avgScore = judgeEntries.length > 0
                ? Math.round((judgeEntries.reduce((s, j) => s + (j.total || 0), 0) / judgeEntries.length) * 10) / 10
                : null;
              return { team: teamName, teamId: tId, score: avgScore, university: teamObj?.university || 'Unknown' };
            });

            teamEntries.sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              return b.score - a.score;
            });

            const cutoff = 2;
            const ranked = teamEntries.map((entry, idx) => {
              const rank = idx + 1;
              let status = idx < cutoff ? 'Promoted' : 'Eliminated';
              return { ...entry, rank, status };
            });

            if (ranked.find(r => r.teamId == teamId)) {
              foundTrack = {
                name: `${track.name}${track.subTopic ? ' — ' + track.subTopic.name : ''}`,
                teams: ranked
              };
            }
          });

          // If finals, gather all teams who have scores
          if (roundIdx > 0) {
            setIsFinals(true);
            setTrackName('Finals');
            
            const allFinalists = [];
            teamsList.forEach(t => {
               const jE = allScores[t.id] ? Object.values(allScores[t.id]) : [];
               if (jE.length > 0) {
                  const avg = Math.round((jE.reduce((s, j) => s + (j.total || 0), 0) / jE.length) * 10) / 10;
                  allFinalists.push({ team: t.name, teamId: t.id, score: avg, university: t.university || 'Unknown' });
               } else if (foundTrack && foundTrack.teams.find(rt => rt.teamId == t.id && rt.status === 'Promoted')) {
                  // Keep them in list with null score if they advanced but not scored yet
                  allFinalists.push({ team: t.name, teamId: t.id, score: null, university: t.university || 'Unknown' });
               }
            });
            allFinalists.sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              return b.score - a.score;
            });
            const rankedFinals = allFinalists.map((entry, idx) => {
               let status = idx < 3 ? 'Winner' : 'Participant';
               return { ...entry, rank: idx + 1, status };
            });
            setLeaderboard(rankedFinals);
          } else {
            if (foundTrack) {
              setTrackName(foundTrack.name);
              setLeaderboard(foundTrack.teams);
            }
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
              <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>/{currentRound?.criteria?.reduce((s,c)=>s+c.weight,0)||100}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentRound?.criteria?.map((c, i) => {
              const key = c.id || c.name;
              const val = criteriaAvg[key] || 0;
              const max = c.weight;
              const pct = max > 0 ? (val / max) * 100 : 0;
              const colors = ['var(--primary)', 'var(--accent-1)', 'var(--success)', 'var(--warning)'];
              const color = colors[i % colors.length];
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span>{c.name}</span>
                    <strong>{val} / {max}</strong>
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
