import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronRight, CheckCircle, AlertCircle, Lock, XCircle, Users, Trophy, ArrowRight, Download } from 'lucide-react';
import { teamService } from '../../api/teamService';
import { eventService } from '../../api/eventService';
import { standingsService } from '../../api/scoreService';

const RoundTransition = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [confirmed, setConfirmed] = useState(false);
  const [lockError, setLockError] = useState(false);
  const [lockShaking, setLockShaking] = useState(false);
  const [lockToast, setLockToast] = useState(false);
  const [resolvedTies, setResolvedTies] = useState({});
  const [activeTrack, setActiveTrack] = useState(null);

  const [event, setEvent] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [trackStandings, setTrackStandings] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
        const eventRes = await eventService.getEventDetails(parsedEventId);
        const evt = eventRes.data;
        setEvent(evt);

        const rounds = evt.rounds || [];
        let savedRoundIdx = 0;
        if (rounds.length > 0) {
          let lastStartedIdx = -1;
          for (let i = rounds.length - 1; i >= 0; i--) {
            if (rounds[i].status !== 'CREATED' && rounds[i].status?.toLowerCase() !== 'planned') {
              lastStartedIdx = i;
              break;
            }
          }
          savedRoundIdx = lastStartedIdx !== -1 ? lastStartedIdx : 0;
        }
        setCurrentRoundIndex(savedRoundIdx);
        const round = evt.rounds?.[savedRoundIdx];
        const roundId = round?.id || String(savedRoundIdx);

        // Load real standings from DB for this round
        let dbScoreMap = {}; // teamId -> score
        try {
          const standingsRes = await standingsService.getStandings(round?.id || savedRoundIdx);
          const dbStandings = standingsRes?.data || [];
          dbStandings.forEach(s => { if (s.teamId && s.score != null) dbScoreMap[s.teamId] = parseFloat(s.score); });
        } catch {
          // fall back to localStorage mock scores if API fails
          const localScores = JSON.parse(localStorage.getItem(`scores_${round?.id || savedRoundIdx}`) || '{}');
          Object.entries(localScores).forEach(([tid, judges]) => {
            const vals = Object.values(judges).map(j => j.total || 0);
            if (vals.length) dbScoreMap[parseInt(tid)] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
          });
        }

        const trackColors = [
          { color: 'var(--primary)' },
          { color: 'var(--accent-1)' },
          { color: 'var(--accent-3)' },
          { color: 'var(--warning)' },
        ];

        const teamsList = (await teamService.getTeamsByEvent(parsedEventId))?.data || [];

        const trackDrawStr = localStorage.getItem(`trackDraw_${parsedEventId}`);
        if (trackDrawStr) {
          const drawn = JSON.parse(trackDrawStr);
          const standings = drawn.map((track, i) => {
            const teamEntries = (track.teams || []).map(teamItem => {
              const teamNameStr = typeof teamItem === 'object' ? teamItem.name : teamItem;
              const teamObj = teamsList.find(t => t.name === teamNameStr);
              const teamId = teamObj?.id || (typeof teamItem === 'object' ? teamItem.id : undefined);
              const score = (teamId && dbScoreMap[teamId] != null) ? dbScoreMap[teamId] : null;
              return { team: teamNameStr, teamId, score };
            });

            // Sort by score desc (null scores go to bottom)
            teamEntries.sort((a, b) => {
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              return b.score - a.score;
            });

            // Assign rank and detect ties at the cutoff.
            // Use promotionTopN from the round if available, else fall back to all teams advancing.
            const roundObj = evt.rounds?.[savedRoundIdx];
            const promotionTopN = roundObj?.promotionTopN ?? teamEntries.length;
            const cutoff = promotionTopN;
            const ranked = teamEntries.map((entry, idx) => {
              const rank = idx + 1;
              const cutoffScore = teamEntries[cutoff - 1]?.score;
              const belowCutoffScore = teamEntries[cutoff]?.score;
              const isTiedAtCutoff = cutoffScore !== null && belowCutoffScore !== null
                && cutoffScore === belowCutoffScore
                && (idx === cutoff - 1 || idx === cutoff);

              let status = idx < cutoff ? 'advance' : 'eliminate';
              if (isTiedAtCutoff) status = 'tiebreak';

              return { rank, team: entry.team, teamId: entry.teamId, score: entry.score, status, tied: isTiedAtCutoff };
            });

            return {
              id: track.id,
              name: `${track.name}${track.subTopic ? ' — ' + track.subTopic.name : ''}`,
              color: track.color || trackColors[i % trackColors.length].color,
              teams: ranked,
            };
          });

          setTrackStandings(standings);
          if (standings.length > 0) setActiveTrack(standings[0].id);
        } else {
          const teamsRes = await teamService.getTeamsByEvent(parsedEventId);
          const teams = teamsRes.data || [];
          if (teams.length > 0) {
            const roundObj = evt.rounds?.[savedRoundIdx];
            const promotionTopN = roundObj?.promotionTopN ?? teams.length;
            const placeholder = [{
              id: 'all',
              name: 'All Teams (No track draw yet)',
              color: 'var(--primary)',
              teams: teams.map((t, i) => ({
                rank: i + 1, team: t.name,
                score: null, status: i < promotionTopN ? 'advance' : 'eliminate', tied: false,
              }))
            }];
            setTrackStandings(placeholder);
            setActiveTrack('all');
          }
        }
      } catch (err) {
        console.error('RoundTransition load error:', err);
      }
    };
    loadData();
  }, []);

  const rounds = event?.rounds || [];
  const currentRound = rounds[currentRoundIndex] || null;
  const nextRound = rounds[currentRoundIndex + 1] || null;
  const isLastRound = !nextRound;

  // If finals (last round): flatten all advanced teams into one list (no tracks)
  const finalsTeamList = isLastRound
    ? trackStandings.flatMap(track =>
        track.teams.filter(t => t.status === 'advance').map(t => ({ ...t, fromTrack: track.name }))
      ).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((t, i) => ({ ...t, rank: i + 1 }))
    : [];

  const tiebreakerTeams = trackStandings.flatMap(track =>
    track.teams.filter(t => t.status === 'tiebreak').map(t => ({ ...t, trackId: track.id, trackName: track.name }))
  );
  const allTiesResolved = tiebreakerTeams.every(t => resolvedTies[t.team]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Team,Score,Status,Track\n";
    
    const listToExport = isLastRound ? finalsTeamList : trackStandings.flatMap(t => t.teams.map(team => ({...team, fromTrack: t.name})));
    
    listToExport.forEach(t => {
      const row = `${t.rank || ''},"${t.team || ''}",${t.score || 0},${t.status || ''},"${t.fromTrack || ''}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_${eventId}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLock = async () => {
    if (tiebreakerTeams.length > 0 && !allTiesResolved) {
      setLockError(true);
      setLockShaking(true);
      setTimeout(() => setLockShaking(false), 500);
      return;
    }
    setLockError(false);
    
    try {
      const currentRoundObj = rounds[currentRoundIndex];
      // If the current round hasn't started yet, we START it.
      if (currentRoundObj.status === 'CREATED' || currentRoundObj.status?.toLowerCase() === 'planned') {
        await eventService.updateRoundStatus(currentRoundObj.id, 'ACTIVE');
        window.location.reload();
        return;
      }

      setConfirmed(true);
      setLockToast(true);
      
      const statuses = ['CREATED', 'ACTIVE', 'SCORING', 'UNDER_REVIEW', 'COMPLETED'];
      const startIdx = statuses.indexOf(currentRoundObj.status);
      if (startIdx !== -1) {
        for (let i = startIdx + 1; i <= statuses.indexOf('COMPLETED'); i++) {
           await eventService.updateRoundStatus(currentRoundObj.id, statuses[i]);
        }
      } else {
        // fallback if somehow status is not found, attempt direct transition
        await eventService.updateRoundStatus(currentRoundObj.id, 'COMPLETED');
      }

      if (!isLastRound) {
        // Build next round track draw (only keep advanced teams)
        const nextRoundDraw = trackStandings.map(track => {
          const advancedTeams = track.teams
            .filter(t => t.status === 'advance' || (t.status === 'tiebreak' && resolvedTies[t.teamId] === 'pass'))
            .map(t => t.team);
          return { ...track, teams: advancedTeams };
        });
        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
        localStorage.setItem(`trackDraw_${parsedEventId}`, JSON.stringify(nextRoundDraw));
        
        const nextRoundObj = rounds[currentRoundIndex + 1];
        if (nextRoundObj) {
           await eventService.updateRoundStatus(nextRoundObj.id, 'ACTIVE');
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Finalize Event status in backend
        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
        
        const eventStatuses = ['PLANNED', 'UPCOMING', 'ONGOING', 'COMPLETED'];
        const startEventIdx = event?.status ? eventStatuses.indexOf(event.status.toUpperCase()) : -1;
        
        if (startEventIdx !== -1) {
          for (let i = startEventIdx + 1; i <= eventStatuses.indexOf('COMPLETED'); i++) {
            await eventService.updateEventStatus(parsedEventId, eventStatuses[i]);
          }
        } else {
          // fallback
          await eventService.updateEventStatus(parsedEventId, 'COMPLETED');
        }

        setTimeout(() => setLockToast(false), 4000);
        setTimeout(() => {
          setShowCelebration(true);
        }, 500);
      }
    } catch (err) {
       console.error("Error updating round status", err);
       alert("Failed to update round status");
    }
  };

  const activeTrackData = trackStandings.find(t => t.id === activeTrack);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Round Transition & Result</h1>
          <p className="subtitle">
            {event?.name || 'Hackathon'} —{' '}
            {currentRound
              ? `Current: ${currentRound.name}`
              : 'No round configured'}
            {nextRound ? ` → Next: ${nextRound.name}` : isLastRound && currentRound ? ' (Final Round)' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>Export Results CSV</button>
            <button
              onClick={handleLock}
              disabled={confirmed}
              className="btn btn-primary"
              style={{
                background: confirmed ? 'rgba(16,185,129,0.3)' : lockError ? 'var(--danger)' : isLastRound && currentRound?.status !== 'CREATED' && currentRound?.status?.toLowerCase() !== 'planned' ? 'var(--success)' : 'var(--primary)',
                cursor: confirmed ? 'not-allowed' : 'pointer',
                gap: '8px',
                animation: lockShaking ? 'shake 0.4s ease-in-out' : 'none',
                padding: '10px 24px'
              }}
            >
              {confirmed
                ? <><CheckCircle size={16} /> {isLastRound ? 'Event Finalized' : `Advanced to ${nextRound?.name}`}</>
                : (currentRound?.status === 'CREATED' || currentRound?.status?.toLowerCase() === 'planned')
                  ? <><ArrowRight size={16} /> Start {currentRound?.name || 'Round'}</>
                  : isLastRound
                    ? <><Trophy size={16} /> Finalize & End Event</>
                    : <><ArrowRight size={16} /> Advance to {nextRound?.name || 'Next Round'}</>
              }
            </button>
        </div>
      </div>

      {/* Round Progress Bar */}
      {rounds.length > 0 && (
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px' }}>
          {rounds.map((r, i) => (
            <React.Fragment key={r.id || i}>
              <div style={{
                flex: 1, padding: '12px 16px',
                background: i === currentRoundIndex ? 'rgba(59,130,246,0.15)' : i < currentRoundIndex ? 'rgba(16,185,129,0.1)' : 'var(--bg-subtle)',
                border: `1px solid ${i === currentRoundIndex ? 'rgba(59,130,246,0.4)' : i < currentRoundIndex ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                borderRadius: i === 0 ? '10px 0 0 10px' : i === rounds.length - 1 ? '0 10px 10px 0' : '0',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: i < currentRoundIndex ? 'var(--success)' : i === currentRoundIndex ? 'var(--primary)' : 'var(--bg-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'
                }}>
                  {i < currentRoundIndex ? <CheckCircle size={14} color="white" /> : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: i === currentRoundIndex ? '600' : '400', color: i === currentRoundIndex ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{r.name}</div>
                  {r.start && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.start} → {r.end || 'TBD'}</div>}
                </div>
              </div>
              {i < rounds.length - 1 && <div style={{ width: '1px', background: 'var(--border-color)' }} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Lock Error Banner */}
      {lockError && !allTiesResolved && (
        <div
          className={lockShaking ? 'shake' : ''}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', marginBottom: '24px' }}
        >
          <XCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#ef4444', marginBottom: '2px' }}>Cannot advance round!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>There are tied teams at the cutoff. Please resolve via Penalty Evaluation first.</div>
          </div>
        </div>
      )}

      {/* Tiebreaker Alert */}
      {tiebreakerTeams.length > 0 && (
        <div style={{ padding: '24px', background: 'linear-gradient(to right, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', marginBottom: '28px', display: 'flex', gap: '20px' }}>
          <AlertTriangle size={28} color="var(--warning)" style={{ flexShrink: 0, marginTop: '4px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', color: 'var(--warning)', marginBottom: '8px' }}>Tie-break / Penalty Required</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              The following teams have <strong>tied scores</strong> at the cutoff. Judges must conduct a rapid evaluation to determine who advances.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {tiebreakerTeams.map((t, i) => (
                <div key={i} style={{ padding: '16px 20px', background: '#FFFFFF', borderRadius: '12px', border: `1px solid ${resolvedTies[t.team] === 'Advanced' ? 'rgba(16,185,129,0.5)' : resolvedTies[t.team] === 'Eliminated' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.4)'}`, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.trackName}</div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.team}</div>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', padding: '4px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '14px' }}>
                      {t.score ?? '—'} pt
                    </div>
                  </div>
                  {resolvedTies[t.team] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: resolvedTies[t.team] === 'Advanced' ? 'var(--success)' : 'var(--danger)', fontWeight: '600', padding: '10px', background: resolvedTies[t.team] === 'Advanced' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
                      {resolvedTies[t.team] === 'Advanced' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      Decision: {resolvedTies[t.team] === 'Advanced' ? 'Advance' : 'Eliminated'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setResolvedTies(prev => ({ ...prev, [t.team]: 'Advanced' }))} style={{ flex: 1, padding: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: 'var(--success)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle size={15} /> Pass
                      </button>
                      <button onClick={() => setResolvedTies(prev => ({ ...prev, [t.team]: 'Eliminated' }))} style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <XCircle size={15} /> Fail
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FINALS MODE: flat list, no tracks ── */}
      {isLastRound && finalsTeamList.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))', borderBottom: '2px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} /> {currentRound?.name || 'Final Round'} — All Finalists
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Top teams advanced from qualifying — evaluated together, no track separation
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: '12px' }}>
              <Users size={14} /> {finalsTeamList.length} Finalists
            </div>
          </div>
          <div>
            {finalsTeamList.map((s, i) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', background: i < 3 ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'var(--bg-active)',
                  color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0
                }}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : s.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{s.team}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>From: {s.fromTrack}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: i === 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {s.score ?? '—'}
                  </div>
                  {i < 3 && (
                    <div style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <Trophy size={11} /> Top {i + 1}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QUALIFYING MODE: track tabs ── */}
      {!isLastRound && trackStandings.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {trackStandings.map(track => (
              <button
                key={track.id}
                onClick={() => setActiveTrack(track.id)}
                className={`btn ${activeTrack === track.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap',
                  background: activeTrack === track.id ? track.color : 'var(--bg-hover)',
                  border: activeTrack === track.id ? 'none' : '1px solid var(--border-color)',
                  color: 'white', fontWeight: activeTrack === track.id ? '600' : '500'
                }}
              >
                {track.name}
                <div style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', fontSize: '12px' }}>
                  {track.teams.length}
                </div>
              </button>
            ))}
          </div>

          {activeTrackData && (
            <div className="glass-panel animate-fade-in" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', background: 'var(--bg-subtle)', borderBottom: `2px solid ${activeTrackData.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', color: activeTrackData.color }}>{activeTrackData.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: '12px' }}>
                  <Users size={14} /> {activeTrackData.teams.length} Teams
                </div>
              </div>

              <div style={{ padding: '6px 24px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                Top {rounds[currentRoundIndex]?.promotionTopN ?? activeTrackData?.teams?.filter(t => t.status === 'advance').length ?? '?'} from each track will advance to <strong>{nextRound?.name}</strong>
              </div>

              <div style={{ position: 'relative' }}>
                {activeTrackData.teams.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No teams assigned to this track yet.</p>
                  </div>
                ) : activeTrackData.teams.map((s, i) => {
                  const finalStatus = s.status === 'tiebreak'
                    ? (resolvedTies[s.team] === 'Advanced' ? 'advance' : resolvedTies[s.team] === 'Eliminated' ? 'eliminate' : 'tiebreak')
                    : s.status;

                  return (
                    <React.Fragment key={i}>
                      {i === (rounds[currentRoundIndex]?.promotionTopN ?? 2) && (
                        <div style={{ padding: '8px 24px', background: 'rgba(16,185,129,0.1)', borderTop: '1px dashed rgba(16,185,129,0.6)', borderBottom: '1px dashed rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ChevronRight size={14} color="var(--success)" />
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cutoff → {nextRound?.name}</span>
                        </div>
                      )}
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: finalStatus === 'advance' ? 'rgba(16,185,129,0.04)' : finalStatus === 'tiebreak' ? 'rgba(245,158,11,0.05)' : 'transparent', opacity: finalStatus === 'eliminate' ? 0.6 : 1 }}>
                        <span style={{ width: '24px', fontSize: '14px', fontWeight: '800', color: s.rank <= 2 ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center' }}>#{s.rank}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.team}</div>
                          {s.tied && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', borderRadius: '6px', fontWeight: '600' }}>TIED</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: finalStatus === 'advance' ? 'var(--success)' : finalStatus === 'tiebreak' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                            {s.score ?? '—'}
                          </div>
                          {finalStatus === 'advance' && <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}><CheckCircle size={12} /> Advance</span>}
                          {finalStatus === 'tiebreak' && <span style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}><AlertCircle size={12} /> Review</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {trackStandings.length === 0 && (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ marginBottom: '8px' }}>No Track Draw Yet</h3>
          <p>Complete the Track Draw first before managing round transitions.</p>
        </div>
      )}

      {/* Toast */}
      {lockToast && !isLastRound && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isLastRound ? <Trophy size={18} color="var(--warning)" /> : <CheckCircle size={18} color="var(--success)" />}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>
              {isLastRound ? 'Event Finalized!' : `Advanced to ${nextRound?.name}!`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isLastRound
                ? 'Winners have been selected. The event is now closed.'
                : `Top 2 teams from each track have advanced to ${nextRound?.name}.`}
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '40px', maxWidth: '480px', width: '90%', textAlign: 'center', border: '1px solid var(--primary)', background: 'var(--bg-panel)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(245,158,11,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '2px solid rgba(245,158,11,0.3)' }}>
              <Trophy size={40} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '16px', color: 'var(--primary)' }}>
              EVENT FINALIZED!
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px', marginBottom: '32px' }}>
              The Hackathon has officially concluded. The final Leaderboard is locked in and ready for the award ceremony! 
              You can download the final CSV report or view the leaderboard.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleExportCSV}
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '16px', fontSize: '16px', fontWeight: '600', gap: '8px' }}
              >
                <Download size={18} /> Export CSV
              </button>
              <button 
                onClick={() => setShowCelebration(false)}
                className="btn btn-primary" 
                style={{ flex: 1, padding: '16px', fontSize: '16px', fontWeight: '600', gap: '8px', background: 'var(--primary)' }}
              >
                <CheckCircle size={18} /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </>
  );
};

export default RoundTransition;
