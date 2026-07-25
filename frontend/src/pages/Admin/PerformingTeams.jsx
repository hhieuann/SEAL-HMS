import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Users, Star, TrendingUp, Code, Zap, Globe, Shield, ChevronRight, X, ExternalLink, Trophy } from 'lucide-react';

const ICONS = [
  <Zap size={24} color="#3b82f6" />,
  <Star size={24} color="#10b981" />,
  <TrendingUp size={24} color="#8b5cf6" />,
  <Globe size={24} color="#f59e0b" />,
  <Shield size={24} color="#ef4444" />,
  <Code size={24} color="#ec4899" />,
  <Trophy size={24} color="#14b8a6" />,
];

const PerformingTeams = () => {
  const { eventId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(null);

  // Penalty Modal State
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyTeamId, setPenaltyTeamId] = useState(null);
  const [penaltyAction, setPenaltyAction] = useState('deduct'); // 'deduct', 'disqualify', 'requalify'
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
    const load = async () => {
      try {
        const { teamService } = await import('../../api/teamService.js');
        const { eventService } = await import('../../api/eventService.js');
        const { submissionService } = await import('../../api/scoreService.js');
        const apiClient = (await import('../../api/apiClient.js')).default;

        const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);

        const trackDrawStr = localStorage.getItem(`trackDraw_${parsedEventId}`);
        const teamTrackMap = {};
        if (trackDrawStr) {
          const drawn = JSON.parse(trackDrawStr);
          drawn.forEach(track => {
            (track.teams || []).forEach(teamObj => {
              const teamName = typeof teamObj === 'string' ? teamObj : teamObj.name;
              teamTrackMap[teamName] = {
                trackName: `${track.name}${track.subTopic ? ' - ' + track.subTopic.name : ''}`,
                trackColor: track.color || 'var(--primary)',
              };
            });
          });
        }

        const rawTeams = await teamService.getTeamsByEvent(parsedEventId);
        const teamsList = rawTeams.data || rawTeams || [];
        const mappedTeams = Array.isArray(teamsList) ? teamsList : [];

        // Fetch active round
        let activeRound = null;
        try {
          const roundsRes = await eventService.getEventRounds(parsedEventId);
          const rounds = roundsRes.data || [];
          activeRound = rounds[0]; // fallback
          for (let i = rounds.length - 1; i >= 0; i--) {
            if (rounds[i].status !== 'CREATED' && rounds[i].status?.toLowerCase() !== 'planned') {
              activeRound = rounds[i];
              break;
            }
          }
          setCurrentRound(activeRound);
        } catch { /* ignored on purpose */ }

        // Fetch round standings to get scores and penalties
        let standingsMap = {};
        if (activeRound) {
          try {
            const standingsRes = await apiClient.get(`/api/v1/rounds/${activeRound.id}/standings`);
            const sList = standingsRes.data?.data || [];
            sList.forEach(st => {
              standingsMap[st.teamId] = { score: st.score, penaltyPoints: st.penaltyPoints, penaltyReason: st.penaltyReason };
            });
          } catch { /* ignored on purpose */ }
        }

        const enriched = await Promise.all(mappedTeams.map(async (team, i) => {
          const trackInfo = teamTrackMap[team.name];

          let subStatus = '(No submission yet)';
          let desc = null;
          let repo = null;

          if (activeRound) {
            try {
              const subRes = await submissionService.getSubmission(activeRound.id, team.id);
              if (subRes?.data?.id) {
                subStatus = subRes.data.submissionName || 'Submitted';
                desc = subRes.data.description;
                repo = subRes.data.githubUrl;
              }
            } catch { /* ignored on purpose */ }
          }

          return {
            id: team.id,
            name: team.name,
            project: subStatus,
            description: desc,
            repo: repo,
            track: trackInfo ? trackInfo.trackName : 'Not assigned',
            trackColor: trackInfo ? trackInfo.trackColor : 'var(--text-secondary)',
            status: team.status || 'Active',
            score: standingsMap[team.id]?.score !== undefined ? standingsMap[team.id].score : null,
            penaltyPoints: standingsMap[team.id]?.penaltyPoints || 0,
            penaltyReason: standingsMap[team.id]?.penaltyReason || '',
            members: team.memberCount || 0,
            membersList: [],
            icon: ICONS[i % ICONS.length],
            inviteCode: team.inviteCode || 'N/A',
            currentRound: activeRound ? activeRound.name : 'N/A',
          };
        }));

        setTeams(enriched);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load real teams", err);
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleStatusChange = async (teamId, newStatus) => {
    try {
      const { teamService } = await import('../../api/teamService.js');
      await teamService.updateTeamStatus(teamId, newStatus);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update team status via real API", err);
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleRandomAssign = async (teamId) => {
    try {
      const { teamService } = await import('../../api/teamService.js');
      const res = await teamService.randomAssign(teamId, 1);
      
      // Update local state with the new track/topic
      setTeams(prev => prev.map(t => {
        if (t.id === teamId) {
          return {
            ...t,
            track: res.data.trackId ? `Track ${res.data.trackId} — Topic ${res.data.topicId}` : 'Assigned',
            trackColor: 'var(--primary)'
          };
        }
        return t;
      }));
      
      if (selectedTeam && selectedTeam.id === teamId) {
        setSelectedTeam(prev => ({
          ...prev,
          track: res.data.trackId ? `Track ${res.data.trackId} — Topic ${res.data.topicId}` : 'Assigned',
          trackColor: 'var(--primary)'
        }));
      }
      
      showToast('Team successfully assigned to a random track & topic!', 'success');
    } catch (err) {
      console.error("Failed to assign random track", err);
      showToast('Error: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleDisqualify = async (teamId, currentStatus) => {
    openPenaltyModal(teamId, currentStatus ? 'requalify' : 'disqualify');
  };

  const openPenaltyModal = (teamId, action = 'deduct') => {
    const t = teams.find(team => team.id === teamId);
    setPenaltyTeamId(teamId);
    setPenaltyAction(action);
    setPenaltyPoints(t?.penaltyPoints || '');
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
        setTeams(prev => prev.map(t => t.id === penaltyTeamId ? { ...t, isDisqualified: true } : t));
        if (selectedTeam && selectedTeam.id === penaltyTeamId) {
          setSelectedTeam(prev => ({ ...prev, isDisqualified: true }));
        }
        showToast("Team disqualified successfully!");
      } else if (penaltyAction === 'requalify') {
        await teamService.disqualifyTeam(penaltyTeamId, false, '');
        setTeams(prev => prev.map(t => t.id === penaltyTeamId ? { ...t, isDisqualified: false } : t));
        if (selectedTeam && selectedTeam.id === penaltyTeamId) {
          setSelectedTeam(prev => ({ ...prev, isDisqualified: false }));
        }
        showToast("Team re-qualified successfully!");
      } else {
        const parsedPoints = parseFloat(penaltyPoints) || 0;
        await teamService.applyPenalty(penaltyTeamId, currentRound.id, { 
          penaltyPoints: parsedPoints, 
          penaltyReason 
        });
        
        setTeams(prev => prev.map(t => {
           if (t.id === penaltyTeamId) {
             const oldPenalty = t.penaltyPoints || 0;
             const baseScore = t.score ? (parseFloat(t.score) + oldPenalty) : 0;
             const newScore = baseScore - parsedPoints;
             return { ...t, score: newScore.toFixed(2), penaltyPoints: parsedPoints, penaltyReason };
           }
           return t;
        }));

        if (selectedTeam && selectedTeam.id === penaltyTeamId) {
           setSelectedTeam(prev => {
             const oldPenalty = prev.penaltyPoints || 0;
             const baseScore = prev.score ? (parseFloat(prev.score) + oldPenalty) : 0;
             const newScore = baseScore - parsedPoints;
             return { ...prev, score: newScore.toFixed(2), penaltyPoints: parsedPoints, penaltyReason };
           });
        }
        showToast(parsedPoints === 0 ? "Penalty reverted successfully!" : "Penalty applied successfully!");
      }
      
      setShowPenaltyModal(false);
      setPenaltyTeamId(null);
      setConfirmStep(false);
      setDisqualificationReason('');
    } catch (err) {
      showToast("Error applying action: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Pending' && team.status === 'CREATED') ||
      (filterStatus === 'Active' && ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(team.status)) ||
      (filterStatus === 'Eliminated' && ['ELIMINATED', 'DISQUALIFIED', 'REJECTED', 'WITHDRAWN'].includes(team.status));
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performing Teams</h1>
          <p className="page-subtitle">Monitor and manage all participating teams ({teams.length} total)</p>
        </div>
        <div className="header-actions">
        </div>
      </div>

      <div className="filters-bar glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '24px', alignItems: 'center', borderRadius: '16px' }}>
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search teams or projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Pending', 'Active', 'Eliminated'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '14px' }}>Loading teams...</div>
        </div>
      ) : (
        <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredTeams.map(team => (
            <div key={team.id} className="team-card glass-panel" style={{ padding: '24px', borderRadius: '16px', transition: 'transform 0.2s ease, box-shadow 0.2s ease', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(team.status) ? 'var(--primary)' : 'var(--text-secondary)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {team.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{team.name}</h3>
                    <span style={{ fontSize: '12px', color: team.trackColor, padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: '12px', marginTop: '4px', display: 'inline-block' }}>
                      {team.track}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  background: ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(team.status) ? 'rgba(16,185,129,0.1)' : team.status === 'CREATED' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                  color: ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(team.status) ? '#10b981' : team.status === 'CREATED' ? '#f59e0b' : '#ef4444', 
                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' 
                }}>
                  {team.status}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Project ({team.currentRound})</div>
                <div style={{ fontSize: '15px', fontWeight: '500' }}>{team.project}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <Users size={16} /> {team.members} Members
                </div>
                {team.status === 'CREATED' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleStatusChange(team.id, 'REJECTED')} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Reject</button>
                    <button onClick={() => handleStatusChange(team.id, 'REGISTERED')} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Approve</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: team.score >= 90 ? '#3b82f6' : 'var(--text-secondary)' }}>
                    {team.score !== null ? `Score: ${team.score}` : 'Pending score'}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedTeam(team)}
                style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'background 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-active)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
              >
                View Details <ChevronRight size={16} />
              </button>
            </div>
          ))}
          {filteredTeams.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ marginBottom: '8px' }}>{teams.length === 0 ? 'No teams yet' : 'No teams found'}</h3>
              <p>{teams.length === 0 ? 'Teams will appear here once they register.' : 'Try adjusting your search or filters.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedTeam(null)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '32px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <button className="btn-icon" onClick={() => setSelectedTeam(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-hover)' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedTeam.icon}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>{selectedTeam.name}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(59,130,246,0.1)', color: selectedTeam.trackColor, borderRadius: '20px', fontWeight: '600' }}>
                    {selectedTeam.track}
                  </span>
                  <span style={{ fontSize: '13px', padding: '4px 12px', background: ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(selectedTeam.status) ? 'rgba(16,185,129,0.1)' : selectedTeam.status === 'CREATED' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: ['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(selectedTeam.status) ? 'var(--success)' : selectedTeam.status === 'CREATED' ? '#f59e0b' : 'var(--danger)', borderRadius: '20px', fontWeight: '600' }}>
                    {selectedTeam.status}
                  </span>
                  {selectedTeam.isDisqualified && (
                    <span style={{ fontSize: '13px', padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '20px', fontWeight: '800' }}>
                      DISQUALIFIED
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Invite: <code>{selectedTeam.inviteCode}</code></span>
                  
                  {['REGISTERED', 'APPROVED', 'IN_PROGRESS', 'CONFIRMED'].includes(selectedTeam.status) && (!selectedTeam.track || selectedTeam.track === 'Not assigned') && (
                    <button 
                      onClick={() => handleRandomAssign(selectedTeam.id)}
                      className="btn btn-primary btn-sm" 
                      style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                    >
                      <Zap size={14} /> Random Assign Track
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Project Submission</h4>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{selectedTeam.project}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                    {selectedTeam.description || 'No project description submitted yet.'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedTeam.repo ? (
                      <a href={`https://${selectedTeam.repo}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        <Code size={18} />
                        <div style={{ flex: 1, fontSize: '14px' }}>GitHub Repository</div>
                        <ExternalLink size={14} color="var(--text-secondary)" />
                      </a>
                    ) : (
                      <div style={{ padding: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No repository submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Team Members ({selectedTeam.members})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {selectedTeam.membersList.length > 0 ? selectedTeam.membersList.map((member, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, hsl(${i * 60}, 70%, 50%), hsl(${i * 60 + 40}, 70%, 50%))`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role || 'Member'}</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px' }}>No member details.</div>
                  )}
                </div>

                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Evaluation</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Score</div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: selectedTeam.score >= 90 ? '#3b82f6' : 'var(--text-primary)' }}>
                      {selectedTeam.score ?? '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTeam.isDisqualified ? (
                       <button onClick={() => handleDisqualify(selectedTeam.id, true)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', width: '100%', color: 'var(--text-secondary)' }}>
                         Re-qualify Team
                       </button>
                    ) : (
                       <button onClick={() => openPenaltyModal(selectedTeam.id, 'deduct')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', width: '100%', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                         Manage Penalty
                       </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content animate-fade-in" style={{ background: 'white', borderRadius: '16px', maxWidth: '450px', width: '90%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>
              {penaltyAction === 'requalify' ? 'Re-qualify Team' : 'Apply Penalty or Disqualify'}
            </h2>
            
            {confirmStep ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', color: 'var(--danger)' }}>Are you sure?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
                  {penaltyAction === 'deduct' 
                    ? `You are about to deduct ${penaltyPoints} points from this team.`
                    : penaltyAction === 'disqualify' 
                      ? 'You are about to DISQUALIFY this team. They will not be able to proceed.'
                      : 'You are about to RE-QUALIFY this team.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => setConfirmStep(false)} style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600' }}>Back</button>
                  <button className="btn btn-primary" onClick={executePenalty} style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: '600', background: 'var(--danger)', border: 'none' }}>Yes, proceed</button>
                </div>
              </div>
            ) : (
              <>
                {penaltyAction !== 'requalify' && (
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
                )}

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

    </div>
  );
};

export default PerformingTeams;
