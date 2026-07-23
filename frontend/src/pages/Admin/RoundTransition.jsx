import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ChevronRight, CheckCircle, AlertCircle, Lock, XCircle, Users, Trophy, ArrowRight, Download, Gavel } from 'lucide-react';
import { teamService } from '../../api/teamService';
import ConfirmModal from '../../components/ConfirmModal';
import { eventService } from '../../api/eventService';
import { standingsService } from '../../api/scoreService';

const RoundTransition = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [confirmed, setConfirmed] = useState(false);
  const [lockError, setLockError] = useState(false);
  const [lockShaking, setLockShaking] = useState(false);
  const [lockToast, setLockToast] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const [activeTrack, setActiveTrack] = useState(null);

  const [event, setEvent] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });
  const [showManualAdvanceModal, setShowManualAdvanceModal] = useState(false);
  const [manualOverrideList, setManualOverrideList] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [viewRoundIndex, setViewRoundIndex] = useState(-1);
  const [trackStandings, setTrackStandings] = useState([]);
  const [startRoundError, setStartRoundError] = useState(null);

  // Penalty Modal State
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyTeamId, setPenaltyTeamId] = useState(null);
  const [penaltyAction, setPenaltyAction] = useState('deduct'); // 'deduct', 'disqualify'
  const [penaltyPoints, setPenaltyPoints] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [disqualificationReason, setDisqualificationReason] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
        const eventRes = await eventService.getEventDetails(parsedEventId);
        
        // We will validate assignments after fetching tracks and teams
        const evt = eventRes.data;
        setEvent(evt);
        if (evt && (evt.status === 'CREATED' || evt.status === 'UPCOMING')) {
          setIsLocked(true);
        }

        let rounds = evt.rounds || [];
        // Sort rounds chronologically by roundSeq
        rounds.sort((a, b) => (a.roundSeq || 0) - (b.roundSeq || 0));
        evt.rounds = rounds; // Ensure the sorted array is used everywhere

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
        
        const activeIdx = viewRoundIndex === -1 ? savedRoundIdx : viewRoundIndex;
        const round = evt.rounds?.[activeIdx];
        const roundId = round?.id || String(activeIdx);

        // Load real standings from DB for this round
        let dbScoreMap = {}; // teamId -> score
        let dbPenaltyMap = {}; // teamId -> penaltyPoints
        let dbReasonMap = {}; // teamId -> penaltyReason
        try {
          const standingsRes = await standingsService.getStandings(round?.id || savedRoundIdx);
          const dbStandings = standingsRes?.data || [];
          dbStandings.forEach(s => { 
            if (s.teamId && s.score != null) dbScoreMap[s.teamId] = parseFloat(s.score); 
            if (s.teamId && s.penaltyPoints != null) dbPenaltyMap[s.teamId] = parseFloat(s.penaltyPoints);
            if (s.teamId && s.penaltyReason) dbReasonMap[s.teamId] = s.penaltyReason;
          });
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

        const teamsRes = await teamService.getTeamsByEvent(parsedEventId);
        const teamsList = teamsRes?.data || [];
        
        let dbTracks = [];
        try {
          const { trackService } = await import('../../api/trackService.js');
          dbTracks = (await trackService.getTracksByEvent(parsedEventId))?.data || [];
        } catch (e) {}

        // Validate starting rounds (check judges for tracks, and mentors for teams)
        try {
          const { adminApi } = await import('../../api/adminApi.js');
          const assignments = await adminApi.getEventAssignments(parsedEventId);
          
          let errorMsg = null;
          // Check if every track has at least one judge
          for (const track of dbTracks) {
            const hasJudge = assignments.some(a => a.trackId === track.id && a.role === 'JUDGE');
            if (!hasJudge) {
              errorMsg = `Cannot start round: Track "${track.name}" is missing a judge. Please assign at least one judge to every track.`;
              break;
            }
          }

          if (!errorMsg) {
             // Check if every participating team has a mentor
             for (const team of teamsList) {
               if (team.status !== 'REJECTED' && team.status !== 'WITHDRAWN' && !team.mentor) {
                 errorMsg = `Cannot start round: Team "${team.name}" is missing a mentor. Please assign a mentor to every participating team.`;
                 break;
               }
             }
          }
          setStartRoundError(errorMsg);
        } catch (e) {
          console.warn("Could not validate assignments", e);
        }
        
        const trackDrawStr = localStorage.getItem(`trackDraw_${parsedEventId}`);
        let baseDraw = null;
        
        if (trackDrawStr && savedRoundIdx > 0) {
           baseDraw = JSON.parse(trackDrawStr);
        } else if (dbTracks.length > 0) {
           // Construct baseDraw from DB
           baseDraw = dbTracks.map(dbTrack => ({
             id: dbTrack.id,
             name: dbTrack.name, // optionally append topic later if needed
             teams: teamsList.filter(t => t.trackId === dbTrack.id).map(t => ({ id: t.id, name: t.name }))
           }));
        }

        if (baseDraw) {
          const standings = baseDraw.map((track, i) => {
            const teamEntries = (track.teams || []).map(teamItem => {
              const teamNameStr = typeof teamItem === 'object' ? teamItem.name : teamItem;
              const teamObj = teamsList.find(t => t.name === teamNameStr);
              const teamId = teamObj?.id || (typeof teamItem === 'object' ? teamItem.id : undefined);
              const score = (teamId && dbScoreMap[teamId] != null) ? dbScoreMap[teamId] : null;
              const penalty = (teamId && dbPenaltyMap[teamId] != null) ? dbPenaltyMap[teamId] : 0;
              const penaltyReason = (teamId && dbReasonMap[teamId]) ? dbReasonMap[teamId] : '';
              const isDisqualified = teamObj?.isDisqualified || false;
              const disqualificationReason = teamObj?.disqualificationReason || '';
              return { team: teamNameStr, teamId, score, penalty, penaltyReason, isDisqualified, disqualificationReason };
            });

            // Sort by score desc (null scores go to bottom, disqualified to very bottom)
            teamEntries.sort((a, b) => {
              if (a.isDisqualified && !b.isDisqualified) return 1;
              if (!a.isDisqualified && b.isDisqualified) return -1;
              if (a.score === null && b.score === null) return 0;
              if (a.score === null) return 1;
              if (b.score === null) return -1;
              return b.score - a.score;
            });

            // Assign rank
            const roundObj = evt.rounds?.[activeIdx];
            const ranked = teamEntries.map((entry, idx) => {
              const rank = idx + 1;
              return { rank, team: entry.team, teamId: entry.teamId, score: entry.score, penalty: entry.penalty, penaltyReason: entry.penaltyReason, isDisqualified: entry.isDisqualified };
            });

            return {
              id: track.id,
              name: track.name,
              color: track.color || trackColors[i % trackColors.length].color,
              teams: ranked,
            };
          });

          setTrackStandings(standings);
          if (standings.length > 0) setActiveTrack(standings[0].id);
        } else {
          setTrackStandings([]);
        }
      } catch (err) {
        console.error('RoundTransition load error:', err);
      }
    };
    loadData();
  }, [eventId, viewRoundIndex]);

  const rounds = event?.rounds || [];
  const currentRound = rounds[currentRoundIndex] || null;
  const nextRound = rounds[currentRoundIndex + 1] || null;
  const isLastRound = !nextRound;
  const isFinalsMode = isLastRound && currentRoundIndex > 0;

  // If finals (last round AND not the first round): flatten all teams into one list (no tracks)
  const finalsTeamList = isFinalsMode
    ? trackStandings.flatMap(track =>
        track.teams.map(t => ({ ...t, fromTrack: track.name }))
      ).sort((a, b) => {
        if (a.isDisqualified && !b.isDisqualified) return 1;
        if (!a.isDisqualified && b.isDisqualified) return -1;
        return (b.score ?? 0) - (a.score ?? 0);
      }).map((t, i) => ({ ...t, rank: i + 1 }))
    : [];

  const handleComputeStandings = async () => {
    if (!currentRound) return;
    try {
      const { standingsService } = await import('../../api/scoreService.js');
      const manuallyPromoted = Array.from(selectedTeams);

      await standingsService.computeRoundRanking(currentRound.id, manuallyPromoted);
      alert('Round rankings computed successfully and saved to database!');
    } catch (err) {
      alert("Error computing rankings: " + (err.response?.data?.message || err.message));
    }
  };

  const openPenaltyModal = (teamId) => {
    let t = trackStandings.flatMap(ts => ts.teams).find(x => x.teamId === teamId);
    if (!t) t = finalsTeamList.find(x => x.teamId === teamId);

    setPenaltyTeamId(teamId);
    setPenaltyAction('deduct');
    setPenaltyPoints(t?.penalty || '');
    setPenaltyReason(t?.penaltyReason || '');
    setDisqualificationReason('');
    setConfirmStep(false);
    setShowPenaltyModal(true);
  };

  const handleConfirmClick = () => {
    if (penaltyAction === 'deduct' && !penaltyReason.trim()) {
      showToast("Please provide a reason.", "error");
      return;
    }
    if (penaltyAction === 'disqualify' && !disqualificationReason.trim()) {
      showToast("Please provide a disqualification reason.", "error");
      return;
    }
    if (penaltyAction === 'deduct' && (penaltyPoints === '' || parseFloat(penaltyPoints) < 0)) {
      showToast("Please enter valid penalty points (0 to revert).", "error");
      return;
    }
    setConfirmStep(true);
  };

  const executePenalty = async () => {
    if (!currentRound || !penaltyTeamId) return;
    try {
      const { teamService } = await import('../../api/teamService.js');
      
      if (penaltyAction === 'disqualify') {
        await teamService.disqualifyTeam(penaltyTeamId, true, disqualificationReason);
        showToast("Team disqualified successfully!");
      } else {
        const parsedPoints = parseFloat(penaltyPoints) || 0;
        await teamService.applyPenalty(penaltyTeamId, currentRound.id, { 
          penaltyPoints: parsedPoints, 
          penaltyReason 
        });
        showToast(parsedPoints === 0 ? "Penalty reverted successfully!" : "Penalty applied successfully!");
      }
      
      setShowPenaltyModal(false);
      setPenaltyTeamId(null);
      setConfirmStep(false);
      setDisqualificationReason('');
      
      // Reload silently to refresh standings snapshot
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast("Error applying penalty: " + (err.response?.data?.message || err.message), "error");
    }
  };

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

  // Helper for advancing round
  const proceedWithAdvance = async (currentRoundObj) => {
    setConfirmed(true);
    setLockToast(true);
    
    const promotedTeamIds = Array.from(selectedTeams);
    
    // Compute round ranking in backend before advancing (sets promoted flags)
    try {
      await standingsService.computeRoundRanking(currentRoundObj.id, promotedTeamIds);
    } catch (e) {
      console.error('Failed to compute round ranking:', e);
    }

    const statuses = ['CREATED', 'ACTIVE', 'SCORING', 'UNDER_REVIEW', 'COMPLETED'];
    const startIdx = statuses.indexOf(currentRoundObj.status);
    if (startIdx !== -1) {
      for (let i = startIdx + 1; i <= statuses.indexOf('COMPLETED'); i++) {
         await eventService.updateRoundStatus(currentRoundObj.id, statuses[i]);
      }
    } else {
      await eventService.updateRoundStatus(currentRoundObj.id, 'COMPLETED');
    }

    if (!isLastRound) {
      // Build next round track draw (only keep advanced teams)
      const nextRoundDraw = trackStandings.map(track => {
        const advancedTeams = track.teams
          .filter(t => selectedTeams.has(t.teamId))
          .map(t => t.team);
        return { ...track, teams: advancedTeams };
      });
      const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
      localStorage.setItem(`trackDraw_${parsedEventId}`, JSON.stringify(nextRoundDraw));
      
      const nextRoundObj = event?.rounds?.[currentRoundIndex + 1];
      if (nextRoundObj) {
         await eventService.updateRoundStatus(nextRoundObj.id, 'ACTIVE');
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleShowResults = async () => {
    const currentRoundObj = event?.rounds?.[currentRoundIndex];
    if (!currentRoundObj) return;

    if (trackStandings.length === 0 && !isLastRound) {
      setLockError(true);
      setLockShaking(true);
      setTimeout(() => setLockShaking(false), 500);
      setModalConfig({ isOpen: true, title: 'Missing Tracks', message: 'Cannot show results: Track Draw is missing. Please ensure tracks are set up.', onConfirm: null, type: 'warning' });
      return;
    }

    // Check if all judges have completed scoring
    try {
      const parsedEvId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
      const { adminApi } = await import('../../api/adminApi.js');
      const allAssignments = await adminApi.getEventAssignments(parsedEvId);
      const judgeAssignments = allAssignments.filter(a => a.role === 'JUDGE');
      const incompleteJudges = judgeAssignments.filter(a => !a.scoringCompleted);
      
      if (incompleteJudges.length > 0) {
        const details = incompleteJudges.map(j => 
          `• "${j.lecturerFullName || j.lecturerEmail}" (Track: ${j.trackName || j.trackId})`
        ).join('\n');
        setLockError(true);
        setLockShaking(true);
        setTimeout(() => setLockShaking(false), 500);
        setModalConfig({ 
          isOpen: true, 
          title: 'Judges have not completed scoring', 
          message: `Cannot show results: The following judge(s) have not clicked "Complete Scoring" yet:\n\n${details}\n\nPlease wait for all judges to finalize their scores before proceeding.`, 
          onConfirm: null, 
          type: 'warning' 
        });
        return;
      }
    } catch (e) {
      console.warn('Could not validate judge scoring completion', e);
    }

    setModalConfig({
      isOpen: true,
      title: 'Show Results',
      message: 'Compute round rankings and proceed to manual team selection?',
      onConfirm: async () => {
        try {
          const { standingsService } = await import('../../api/scoreService.js');
          await standingsService.computeRoundRanking(currentRoundObj.id, []);
          await eventService.updateRoundStatus(currentRoundObj.id, 'UNDER_REVIEW');
          window.location.reload();
        } catch (err) {
          console.error("Error updating round status", err);
          showToast('Failed to update round status', 'error');
        }
      },
      type: 'warning'
    });
  };

  const handleLock = async () => {
    if (confirmed) return;
    const currentRoundObj = event?.rounds?.[currentRoundIndex];
    if (!currentRoundObj) return;

    try {
        if (currentRoundObj.status === 'CREATED' || currentRoundObj.status?.toLowerCase() === 'planned') {
          if (startRoundError) {
            setLockError(true);
            setLockShaking(true);
            setTimeout(() => setLockShaking(false), 500);
            setModalConfig({ isOpen: true, title: 'Start round incomplete', message: startRoundError, onConfirm: null, type: 'warning' });
            return;
          }

          setModalConfig({
            isOpen: true,
            title: 'Start Round',
            message: `Are you sure you want to start "${currentRoundObj.name}"? Submissions will be opened for teams.`,
            onConfirm: async () => {
              await eventService.updateRoundStatus(currentRoundObj.id, 'ACTIVE');
              window.location.reload();
            },
            type: 'warning'
          });
          return;
        }

        // If the current round is ACTIVE, we END it for scoring.
        if (currentRoundObj.status === 'ACTIVE') {
          setModalConfig({
            isOpen: true,
            title: 'End Round',
            message: `Close submissions for "${currentRoundObj.name}" and move to scoring? Teams will no longer be able to submit.`,
            onConfirm: async () => {
              await eventService.updateRoundStatus(currentRoundObj.id, 'SCORING');
              window.location.reload();
            },
            type: 'warning'
          });
          return;
        }

        // Advance to next round (from UNDER_REVIEW to COMPLETED)
        if (currentRoundObj.status === 'UNDER_REVIEW' || isLastRound) {
          const promotionTopN = currentRoundObj.promotionTopN || 0;
          const targetCount = promotionTopN;
          const selectedCount = selectedTeams.size;

          if (!isLastRound && selectedCount > targetCount) {
             setLockError(true);
             setLockShaking(true);
             setTimeout(() => setLockShaking(false), 500);
             setModalConfig({
               isOpen: true,
               title: 'Error: Too many teams selected',
               message: `You have selected ${selectedCount} teams, but the maximum quota is only ${targetCount} teams in total. Please deselect some teams to proceed.`,
               onConfirm: null,
               type: 'error'
             });
             return;
          }

          if (!isLastRound && selectedCount < targetCount) {
             setModalConfig({
               isOpen: true,
               title: 'Warning: Missing Teams',
               message: `Attention: You have only selected ${selectedCount} teams to advance, which is less than the target quota of ${targetCount} teams in total. Are you sure you want to force advance with this list?`,
               onConfirm: async () => {
                  await proceedWithAdvance(currentRoundObj);
               },
               type: 'warning'
             });
             return;
          }

          setModalConfig({
            isOpen: true,
            title: isLastRound ? 'Finalize Event' : 'Advance Round',
            message: isLastRound ? 'Finalize the event results? Rankings will be computed and this cannot be undone.' : `Confirm eliminations and advance ${selectedCount} teams to the next round? Eliminated teams cannot submit anymore.`,
            onConfirm: async () => {
               await proceedWithAdvance(currentRoundObj);
            },
            type: 'info'
          });
        }

          return;
    } catch (err) {
       console.error("Error updating round status", err);
       showToast('Failed to update round status', 'error');
    }
  };

  const handleEndEvent = () => {
    setShowEndConfirmModal(true);
  };

  const executeEndEvent = async () => {
    setShowEndConfirmModal(false);
    try {
      const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
      const eventStatuses = ['PLANNED', 'UPCOMING', 'ONGOING', 'COMPLETED'];
      const startEventIdx = event?.status ? eventStatuses.indexOf(event.status.toUpperCase()) : -1;
      
      if (startEventIdx !== -1) {
        for (let i = startEventIdx + 1; i <= eventStatuses.indexOf('COMPLETED'); i++) {
          await eventService.updateEventStatus(parsedEventId, eventStatuses[i]);
        }
      } else {
        await eventService.updateEventStatus(parsedEventId, 'COMPLETED');
      }

      setLockToast(true);
      setTimeout(() => setLockToast(false), 4000);
      setTimeout(() => {
        setShowCelebration(true);
      }, 500);
    } catch (err) {
      console.error("Error finalizing event", err);
      showToast('Failed to finalize event', 'error');
    }
  };

  const activeTrackData = trackStandings.find(t => t.id === activeTrack);
  const actualViewIdx = viewRoundIndex === -1 ? currentRoundIndex : viewRoundIndex;

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
          
          {actualViewIdx === currentRoundIndex && isLastRound && currentRound?.status === 'COMPLETED' && event?.status?.toUpperCase() !== 'COMPLETED' && event?.status?.toUpperCase() !== 'ENDED' && (
            <button onClick={handleEndEvent} className="btn btn-primary" style={{ background: 'var(--success)', padding: '10px 24px', gap: '8px' }}>
              <Trophy size={16} /> End Event & Archive
            </button>
          )}

          {actualViewIdx === currentRoundIndex && (!isLastRound || currentRound?.status !== 'COMPLETED') && (
            <button
              onClick={currentRound?.status === 'SCORING' ? handleShowResults : handleLock}
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
                ? <><CheckCircle size={16} /> {isLastRound ? 'Scores Published' : `Advanced to ${nextRound?.name}`}</>
                : (currentRound?.status === 'CREATED' || currentRound?.status?.toLowerCase() === 'planned')
                  ? <><ArrowRight size={16} /> Start {currentRound?.name || 'Round'}</>
                  : currentRound?.status === 'ACTIVE'
                    ? <><Lock size={16} /> End {currentRound?.name} for Scoring</>
                    : currentRound?.status === 'SCORING'
                      ? <><CheckCircle size={16} /> Show Results</>
                      : isLastRound
                        ? <><CheckCircle size={16} /> Confirm Results & Publish Scores</>
                        : <><ArrowRight size={16} /> Advance to {nextRound?.name || 'Next Round'}</>
              }
            </button>
          )}
        </div>
      </div>

      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            <strong>Action Locked:</strong> Event is still in the Registration phase. You cannot start or transition rounds until the event begins.
          </span>
        </div>
      )}

      {/* Round Progress Bar */}
      {rounds.length > 0 && (
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px' }}>
          {rounds.map((r, i) => {
            return (
            <React.Fragment key={r.id || i}>
              <div 
                onClick={() => setViewRoundIndex(i)}
                style={{
                flex: 1, padding: '12px 16px',
                background: i === actualViewIdx ? 'rgba(59,130,246,0.15)' : i < currentRoundIndex ? 'rgba(16,185,129,0.1)' : 'var(--bg-subtle)',
                border: `1px solid ${i === actualViewIdx ? 'rgba(59,130,246,0.4)' : i < currentRoundIndex ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                borderRadius: i === 0 ? '10px 0 0 10px' : i === rounds.length - 1 ? '0 10px 10px 0' : '0',
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: i < currentRoundIndex ? 'var(--success)' : i === currentRoundIndex ? 'var(--primary)' : 'var(--bg-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700'
                }}>
                  {i < currentRoundIndex ? <CheckCircle size={14} color="white" /> : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: i === actualViewIdx ? '600' : '400', color: i === actualViewIdx ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{r.name}</div>
                  {r.start && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.start} → {r.end || 'TBD'}</div>}
                </div>
              </div>
              {i < rounds.length - 1 && <div style={{ width: '1px', background: 'var(--border-color)' }} />}
            </React.Fragment>
          )})}
        </div>
      )}

      {/* Lock Error Banner */}
      {lockError && (
        <div
          className={lockShaking ? 'shake' : ''}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', marginBottom: '24px' }}
        >
          <XCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#ef4444', marginBottom: '2px' }}>Action Blocked!</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Please review your team selections or check if the round conditions are met.</div>
          </div>
        </div>
      )}

      {/* FINALS MODE: flat list, no tracks */}
      {isFinalsMode && finalsTeamList.length > 0 && (
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
            {finalsTeamList.map((s, i) => {
              const isFinished = actualViewIdx < currentRoundIndex || (isLastRound && (currentRound?.status === 'COMPLETED' || currentRound?.status === 'UNDER_REVIEW'));
              return (
              <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', background: isFinished && i < 3 ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                {isFinished ? (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'var(--bg-active)',
                    color: 'white', fontWeight: '800', fontSize: '14px', flexShrink: 0
                  }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : s.rank}
                  </div>
                ) : (
                  <div style={{ width: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '600' }}>•</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', textDecoration: s.isDisqualified ? 'line-through' : 'none', color: s.isDisqualified ? 'var(--danger)' : 'inherit' }}>{s.team}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>From: {s.fromTrack}</span>
                    {s.isDisqualified && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderRadius: '6px', fontWeight: '800' }} title={s.disqualificationReason || 'Disqualified'}>DISQUALIFIED</span>}
                    {isFinished && s.penalty > 0 && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', fontWeight: '600' }}>Penalty: -{s.penalty} pts</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {!s.isDisqualified && (
                    <button 
                      onClick={() => openPenaltyModal(s.teamId)}
                      style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title="Apply Penalty"
                    >
                      <Gavel size={14} /> Penalty
                    </button>
                  )}
                  {isFinished ? (
                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: i === 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {s.score ?? '—'}
                      </div>
                      {i < 3 && (
                        <div style={{ fontSize: '11px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                          <Trophy size={11} /> Top {i + 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* ── QUALIFYING MODE: track tabs ── */}
      {!isFinalsMode && trackStandings.length > 0 && (
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

              {(actualViewIdx < currentRoundIndex || (isLastRound && currentRound?.status === 'COMPLETED')) ? (
                <div style={{ padding: '6px 24px', background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                  Top {rounds[currentRoundIndex]?.promotionTopN ?? activeTrackData?.teams?.filter(t => t.status === 'advance').length ?? '?'} teams in total will advance to <strong>{nextRound?.name}</strong>
                </div>
              ) : (
                <div style={{ padding: '6px 24px', background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid rgba(245,158,11,0.15)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Rankings and scores will appear after scoring is complete
                </div>
              )}

              <div style={{ position: 'relative' }}>
                {activeTrackData.teams.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No teams assigned to this track yet.</p>
                  </div>
                ) : activeTrackData.teams.map((s, i) => {
                  const isScoringComplete = actualViewIdx < currentRoundIndex || currentRound?.status === 'UNDER_REVIEW' || currentRound?.status === 'COMPLETED';
                  const isUnderReview = currentRound?.status === 'UNDER_REVIEW' && actualViewIdx === currentRoundIndex;
                  const isChecked = selectedTeams.has(s.teamId);

                  return (
                    <React.Fragment key={i}>
                      {isScoringComplete && !isUnderReview && i === (rounds[currentRoundIndex]?.promotionTopN ?? 2) && (
                        <div style={{ padding: '8px 24px', background: 'rgba(16,185,129,0.1)', borderTop: '1px dashed rgba(16,185,129,0.6)', borderBottom: '1px dashed rgba(16,185,129,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ChevronRight size={14} color="var(--success)" />
                          <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Cutoff reached</span>
                        </div>
                      )}
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: isChecked ? 'rgba(16,185,129,0.04)' : 'transparent', opacity: isScoringComplete && !isChecked && !isUnderReview ? 0.6 : 1 }}>
                        {isUnderReview && !s.isDisqualified ? (
                          <div style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                const newSet = new Set(selectedTeams);
                                if (e.target.checked) newSet.add(s.teamId);
                                else newSet.delete(s.teamId);
                                setSelectedTeams(newSet);
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          </div>
                        ) : isScoringComplete ? (
                          <span style={{ width: '24px', fontSize: '14px', fontWeight: '800', color: s.rank <= 2 ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center' }}>#{s.rank}</span>
                        ) : (
                          <span style={{ width: '24px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>•</span>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', textDecoration: s.isDisqualified ? 'line-through' : 'none', color: s.isDisqualified ? 'var(--danger)' : 'inherit' }}>{s.team}</div>
                          {isScoringComplete && s.tied && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', borderRadius: '6px', fontWeight: '600' }}>TIED</span>}
                          {s.isDisqualified && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderRadius: '6px', fontWeight: '800', marginLeft: '6px' }} title={s.disqualificationReason || 'Disqualified'}>DISQUALIFIED</span>}
                          {isScoringComplete && s.penalty > 0 && <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '6px', fontWeight: '600', marginLeft: '6px' }}>Penalty: -{s.penalty} pts</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {!s.isDisqualified && (
                            <button 
                              onClick={() => openPenaltyModal(s.teamId)}
                              style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                              title="Apply Penalty"
                            >
                              <Gavel size={14} /> Penalty
                            </button>
                          )}
                          {isScoringComplete ? (
                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                              <div style={{ fontSize: '16px', fontWeight: '800', color: isChecked ? 'var(--success)' : 'var(--text-secondary)' }}>
                                {s.score ?? '—'}
                              </div>
                              {isChecked && <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}><CheckCircle size={12} /> Advance</span>}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'right', minWidth: '70px' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>
                            </div>
                          )}
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

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmText="Proceed"
        cancelText="Cancel"
        type={modalConfig.type}
      />

      {/* End Event Confirmation Modal */}
      <ConfirmModal
        isOpen={showEndConfirmModal}
        title="End Event?"
        message="Are you sure you want to officially end this event? This action will permanently move the event to the Archive for all participants. Make sure everyone has had time to review their published scores!"
        onConfirm={executeEndEvent}
        onClose={() => setShowEndConfirmModal(false)}
        confirmText="Yes, End Event"
        cancelText="Cancel"
        type="warning"
      />

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

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content animate-fade-in" style={{ background: 'white', borderRadius: '16px', maxWidth: '450px', width: '90%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>
              Apply Penalty or Disqualify
            </h2>
            
            {confirmStep ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--danger)' }}>Are you sure?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
                  {penaltyAction === 'deduct' 
                    ? `You are about to deduct ${penaltyPoints} points from this team.`
                    : 'You are about to DISQUALIFY this team. They will not be able to proceed.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setConfirmStep(false)} style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600' }}>Back</button>
                  <button className="btn btn-primary" onClick={executePenalty} style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', background: 'var(--danger)', border: 'none' }}>Yes, proceed</button>
                </div>
              </div>
            ) : (
              <>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', background: 'var(--bg-subtle)', padding: '6px', borderRadius: '12px' }}>
                    <button
                      className={`btn ${penaltyAction === 'deduct' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '8px', border: 'none', background: penaltyAction === 'deduct' ? 'var(--primary)' : 'transparent', color: penaltyAction === 'deduct' ? 'white' : 'var(--text-secondary)', fontWeight: '600' }}
                      onClick={() => setPenaltyAction('deduct')}
                    >
                      Deduct Points
                    </button>
                    <button
                      className={`btn ${penaltyAction === 'disqualify' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '8px', border: 'none', background: penaltyAction === 'disqualify' ? 'var(--danger)' : 'transparent', color: penaltyAction === 'disqualify' ? 'white' : 'var(--text-secondary)', fontWeight: '600' }}
                      onClick={() => setPenaltyAction('disqualify')}
                    >
                      Disqualify
                    </button>
                  </div>

                {penaltyAction === 'deduct' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>Penalty Points</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '15px' }}
                      value={penaltyPoints}
                      onChange={(e) => setPenaltyPoints(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                )}

                {penaltyAction === 'deduct' && (
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reason for Penalty</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '15px', resize: 'none' }}
                      value={penaltyReason}
                      onChange={(e) => setPenaltyReason(e.target.value)}
                      placeholder="Reason for penalty..."
                    />
                  </div>
                )}

                {penaltyAction === 'disqualify' && (
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: 'var(--danger)' }}>Disqualification Reason</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.5)', fontSize: '15px', resize: 'none' }}
                      value={disqualificationReason}
                      onChange={(e) => setDisqualificationReason(e.target.value)}
                      placeholder="Explain why this team is being disqualified..."
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600' }}
                    onClick={() => {
                      setShowPenaltyModal(false);
                      setPenaltyTeamId(null);
                      setPenaltyPoints('');
                      setPenaltyReason('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', background: penaltyAction === 'disqualify' ? 'var(--danger)' : undefined, border: 'none' }}
                    onClick={handleConfirmClick}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999,
          background: toast.type === 'error' ? 'var(--danger)' : '#10b981',
          color: 'white', padding: '12px 24px', borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: '600',
          animation: 'fade-in 0.3s ease-out'
        }}>
          {toast.message}
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
