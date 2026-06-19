import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter, Users, Star, TrendingUp, Code, Zap, Globe, Shield, ChevronRight, X, ExternalLink, Monitor, Trophy } from 'lucide-react';

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

  useEffect(() => {
    // Build team list from real teams + track draw results
    import('../../api/teamService.js').then(({ teamService }) => {
      const parsedEventId = eventId === 'seal-sp26' ? 1 : (parseInt(eventId) || 1);
      teamService.getTeamsByEvent(parsedEventId).then(rawTeams => {
        const trackDrawStr = localStorage.getItem(`trackDraw_${parsedEventId}`);

        // Build a map: teamName -> { trackName, trackColor }
        const teamTrackMap = {};
        if (trackDrawStr) {
          const drawn = JSON.parse(trackDrawStr);
          drawn.forEach(track => {
            (track.teams || []).forEach(teamName => {
              teamTrackMap[teamName] = {
                trackName: `${track.name}${track.subTopic ? ' — ' + track.subTopic.name : ''}`,
                trackColor: track.color || 'var(--primary)',
              };
            });
          });
        }

        const teamsList = rawTeams.data || rawTeams;
        const mappedTeams = Array.isArray(teamsList) ? teamsList : [];

        const enriched = mappedTeams.map((team, i) => {
          const trackInfo = teamTrackMap[team.name];

          return {
            id: team.id,
            name: team.name,
            project: team.project || '(No submission yet)',
            track: trackInfo ? trackInfo.trackName : 'Not assigned',
            trackColor: trackInfo ? trackInfo.trackColor : 'var(--text-secondary)',
            status: team.status || 'Active',
            score: team.score ?? null,
            members: team.memberCount || 0,
            membersList: [],
            icon: ICONS[i % ICONS.length],
            inviteCode: team.inviteCode || 'N/A',
          };
        });

        setTeams(enriched);
        setLoading(false);
      }).catch(err => {
        console.error("Failed to load real teams", err);
        setLoading(false);
      });
    });
  }, []);

  const handleStatusChange = async (teamId, newStatus) => {
    try {
      const { teamService } = await import('../../api/teamService.js');
      await teamService.updateTeamStatus(teamId, newStatus);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update team status via real API", err);
      alert("Error: " + (err.response?.data?.message || err.message));
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
      
      alert("Team successfully assigned to a random track & topic!");
    } catch (err) {
      console.error("Failed to assign random track", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || team.status === filterStatus;
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
          <button className="btn btn-secondary">
            <Filter size={18} /> Export Data
          </button>
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
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: team.status === 'Active' ? 'var(--primary)' : 'var(--text-secondary)' }} />

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
                  background: ['REGISTERED', 'APPROVED'].includes(team.status) ? 'rgba(16,185,129,0.1)' : team.status === 'CREATED' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                  color: ['REGISTERED', 'APPROVED'].includes(team.status) ? '#10b981' : team.status === 'CREATED' ? '#f59e0b' : '#ef4444', 
                  padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' 
                }}>
                  {team.status}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Project</div>
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
                  <span style={{ fontSize: '13px', padding: '4px 12px', background: ['REGISTERED', 'APPROVED'].includes(selectedTeam.status) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: ['REGISTERED', 'APPROVED'].includes(selectedTeam.status) ? 'var(--success)' : 'var(--danger)', borderRadius: '20px', fontWeight: '600' }}>
                    {selectedTeam.status}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Invite: <code>{selectedTeam.inviteCode}</code></span>
                  
                  {['REGISTERED', 'APPROVED'].includes(selectedTeam.status) && (!selectedTeam.track || selectedTeam.track === 'Not assigned') && (
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformingTeams;
