import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, X, GraduationCap, UserCheck, Loader2 } from 'lucide-react';

const AssignmentMatrix = () => {
  const { eventId } = useParams();
  const [tracks, setTracks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [assignForm, setAssignForm] = useState({ trackId: '', lecturerId: '', role: 'JUDGE' });
  const [assignError, setAssignError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { eventService } = await import('../../api/eventService.js');
        const { trackService } = await import('../../api/trackService.js');
        const { adminApi } = await import('../../api/adminApi.js');
        const { teamService } = await import('../../api/teamService.js');

        let parsedId = eventId && eventId !== 'seal-sp26' ? parseInt(eventId) : null;
        if (!parsedId) {
          const eventsRes = await eventService.getEvents();
          if (eventsRes.data && eventsRes.data.length > 0) {
            parsedId = eventsRes.data[0].id;
          }
        }
        if (!parsedId) return;

        const eventRes = await eventService.getEventDetails(parsedId);
        const activeEvent = eventRes.data;
        if (!activeEvent) return;

        if (activeEvent.status === 'CREATED' || activeEvent.status === 'UPCOMING') {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }

        const tracksRes = await trackService.getTracksByEvent(parsedId);
        let realTracks = tracksRes.data || [];
        
        try {
          const topicsRes = await trackService.getTopicsByEvent(parsedId);
          const topics = topicsRes.data || [];
          realTracks = realTracks.map(t => {
            const trackTopic = topics.find(tp => tp.trackId === t.id);
            return { ...t, topic: trackTopic };
          });
        } catch (e) { console.error(e); }
        
        setTracks(realTracks);

        try {
          const teamsRes = await teamService.getTeamsByEvent(parsedId);
          setTeams(teamsRes.data || teamsRes || []);
        } catch (e) { console.error(e); }

        adminApi.getEventAssignments(parsedId).then(a => setAssignments(a)).catch(() => {});
        adminApi.getLecturers().then(l => setLecturers(l)).catch(() => {});

      } catch (err) {
        console.error("Failed to load assignment data", err);
      }
    };
    fetchData();
  }, [eventId]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.trackId || !assignForm.lecturerId) return;
    setAssignError('');
    setAssignLoading(true);
    try {
      const { adminApi } = await import('../../api/adminApi.js');
      const newAssignment = await adminApi.assignLecturerToTrack(
        Number(assignForm.trackId), Number(assignForm.lecturerId), assignForm.role
      );
      setAssignments(prev => [...prev, newAssignment]);
      setShowAssignModal(false);
      setAssignForm({ trackId: '', lecturerId: '', role: 'JUDGE' });
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign lecturer');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      const { adminApi } = await import('../../api/adminApi.js');
      await adminApi.removeAssignment(assignmentId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch (err) {
      console.error('Failed to remove assignment', err);
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !assignForm.lecturerId) return;
    setAssignError('');
    setAssignLoading(true);
    try {
      const { teamService } = await import('../../api/teamService.js');
      const currentMentors = selectedTeam.mentors ? selectedTeam.mentors.map(m => m.lecturerId) : [];
      if (currentMentors.includes(Number(assignForm.lecturerId))) {
        throw new Error('This lecturer is already a mentor for this team.');
      }
      const updatedTeamRes = await teamService.assignMentors(selectedTeam.id, [...currentMentors, Number(assignForm.lecturerId)]);
      
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? updatedTeamRes.data : t));
      setShowMentorModal(false);
      setSelectedTeam(null);
      setAssignForm({ trackId: '', lecturerId: '', role: 'JUDGE' });
    } catch (err) {
      setAssignError(err.message || err.response?.data?.message || 'Failed to assign mentor');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveMentor = async (teamId, lecturerId) => {
    try {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      const currentMentors = team.mentors ? team.mentors.map(m => m.lecturerId) : [];
      const newMentors = currentMentors.filter(id => id !== lecturerId);
      
      const { teamService } = await import('../../api/teamService.js');
      const updatedTeamRes = await teamService.assignMentors(teamId, newMentors);
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeamRes.data : t));
    } catch (err) {
      console.error('Failed to remove mentor', err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Lecturer Assignments</h1>
          <p className="subtitle">Assign judges to specific tracks in this event.</p>
        </div>
      </div>

      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderRadius: '8px', marginBottom: '24px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <UserCheck size={18} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            <strong>Action Locked:</strong> Event is still in the Registration phase. Assignments are disabled until registration ends.
          </span>
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <GraduationCap size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No tracks configured for this event yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tracks.map(track => {
            const trackAssignments = assignments.filter(a => a.trackId === track.id);
            const judges = trackAssignments.filter(a => a.role === 'JUDGE');
            const mentors = trackAssignments.filter(a => a.role === 'MENTOR');
            return (
              <div key={track.id} className="glass-panel" style={{ padding: '20px 24px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
                      {track.name || `Unnamed Track (ID: ${track.id})`}
                    </div>
                    {track.topic && (
                      <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Topic: {track.topic.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{track.topic.description}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      if (isLocked) {
                        alert("Judge assignment is locked during the Registration phase.");
                        return;
                      }
                      setAssignForm(p => ({ ...p, trackId: track.id, role: 'JUDGE' }));
                      setAssignError('');
                      setShowAssignModal(true);
                    }}
                    className="btn"
                    style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}
                    disabled={isLocked}
                  >
                    <Plus size={14} /> Add Judge
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {[{ label: 'Judges', list: judges, color: 'var(--warning)', role: 'JUDGE' }].map(col => (
                    <div key={col.role}>
                      <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: col.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserCheck size={14} /> {col.label} ({col.list.length})
                      </div>
                      {col.list.length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '8px', textAlign: 'center' }}>None assigned</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {col.list.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600' }}>{a.lecturerFullName || a.lecturerEmail}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.department || a.lecturerEmail}</div>
                              </div>
                              <button 
                                onClick={() => {
                                  if (isLocked) {
                                    alert("Removal is locked during the Registration phase.");
                                    return;
                                  }
                                  handleRemoveAssignment(a.id);
                                }} 
                                style={{ padding: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: 'var(--danger)', cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: isLocked ? 0.5 : 1 }} 
                                title="Remove"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="page-header" style={{ marginTop: '40px' }}>
        <div>
          <h1>Team Mentors</h1>
          <p className="subtitle">Assign mentors directly to participating teams.</p>
        </div>
      </div>
      
      {teams.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No teams found for this event.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {teams.map(team => (
            <div key={team.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{team.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Track: {tracks.find(t => t.id === team.trackId)?.name || 'Not Assigned'}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (isLocked) {
                      alert("Mentor assignment is locked during the Registration phase.");
                      return;
                    }
                    setSelectedTeam(team);
                    setAssignError('');
                    setShowMentorModal(true);
                  }}
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}
                  disabled={isLocked}
                >
                  <Plus size={14} /> Add Mentor
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!team.mentors || team.mentors.length === 0) ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px', background: 'var(--bg-subtle)', borderRadius: '8px', textAlign: 'center' }}>No mentors assigned</div>
                ) : (
                  team.mentors.map(m => (
                    <div key={m.lecturerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-3)' }}>🎓 {m.name}</div>
                      </div>
                      <button 
                        onClick={() => {
                          if (isLocked) { alert("Removal locked."); return; }
                          handleRemoveMentor(team.id, m.lecturerId);
                        }}
                        style={{ padding: '4px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: 'var(--danger)', cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: isLocked ? 0.5 : 1 }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setShowAssignModal(false)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '460px', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <button onClick={() => setShowAssignModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Assign Judge</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Assign a judge to <strong>{tracks.find(t => t.id === assignForm.trackId)?.name || 'this track'}</strong>.
            </p>
            {assignError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{assignError}</div>
            )}
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Lecturer *</label>
                <select required value={assignForm.lecturerId} onChange={e => setAssignForm(p => ({...p, lecturerId: e.target.value}))} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="">Select a lecturer</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName || l.email}{l.department ? ` (${l.department})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ flex: 1, padding: '11px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={assignLoading}>
                  {assignLoading ? <Loader2 size={16} className="spin" /> : <UserCheck size={16} />} Assign Judge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMentorModal && selectedTeam && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => setShowMentorModal(false)} />
          <div className="animate-fade-in" style={{ position: 'relative', width: '90%', maxWidth: '460px', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <button onClick={() => setShowMentorModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>Assign Mentor</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Assign a mentor to <strong>{selectedTeam.name}</strong>.</p>
            {assignError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{assignError}</div>
            )}
            <form onSubmit={handleAssignMentor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Lecturer *</label>
                <select required value={assignForm.lecturerId} onChange={e => setAssignForm(p => ({...p, lecturerId: e.target.value}))} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="">Select a lecturer</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>{l.fullName || l.email}{l.department ? ` (${l.department})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowMentorModal(false)} style={{ flex: 1, padding: '11px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={assignLoading}>
                  {assignLoading ? <Loader2 size={16} className="spin" /> : <UserCheck size={16} />} Assign Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentMatrix;
