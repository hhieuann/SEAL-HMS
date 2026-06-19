import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, CheckCircle, XCircle, ArrowLeft, Loader2, Shield, Map } from 'lucide-react';
import { teamService } from '../../api/teamService';
import { trackService } from '../../api/trackService';
import './Workspace.css';

const TeamManagement = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const isLeader = localStorage.getItem('p_isLeader') === 'true';
  const teamId = localStorage.getItem('p_teamId');
  const eventId = 1; // Assuming event ID 1 for now

  useEffect(() => {
    if (!teamId) {
      navigate('/participant/team-formation');
      return;
    }

    const loadTeamData = async () => {
      try {
        const res = await teamService.getTeamDetails(teamId);
        let teamData = res.data;
        
        if (teamData && teamData.members) {
           teamData.members = teamData.members.map(m => ({
             ...m,
             name: m.name || m.accountName || 'Unknown'
           }));
        }
        
        // Fetch track info if assigned
        if (teamData.trackId) {
          try {
            const tracksRes = await trackService.getTracksByEvent(eventId);
            const assignedTrack = tracksRes.data?.find(t => t.id === teamData.trackId);
            if (assignedTrack) {
              teamData.trackName = assignedTrack.name;
            }
          } catch (e) {
            console.error('Failed to load track info');
          }
        }

        setTeam({...teamData, inviteCode: localStorage.getItem('p_teamInviteCode') || 'CODE123', pendingRequests: []});
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamData();
  }, [teamId, navigate]);

  const handleRequest = async (requestId, action) => {
    setProcessingId(requestId);
    try {
      const res = await mockService.handleJoinRequest(teamId, requestId, action);
      setTeam(res.data);
    } catch (err) {
      alert(err.message || 'Error processing request');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 className="spinner" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!team) return <div>Team not found.</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate('/participant/workspace')} className="btn btn-secondary" style={{ marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Workspace
      </button>

      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {team.name}
          </h1>
          <div className="subtitle" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>Invite Code: <strong style={{ color: 'var(--primary)' }}>{team.inviteCode}</strong></span>
            {team.trackName ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '8px', color: 'var(--success)' }}>
                <Map size={14} /> Assigned to {team.trackName}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 10px', borderRadius: '8px', color: 'var(--warning)' }}>
                <Map size={14} /> Track pending draw
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Members List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Users size={20} color="var(--primary)" /> Team Members ({team.members.length}/5)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {team.members.map((member, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{member.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      {member.role === 'Leader' ? <Shield size={12} color="var(--warning)" /> : null}
                      {member.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Requests */}
        {isLeader && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <UserPlus size={20} color="var(--warning)" /> Pending Requests
            </h2>
            
            {team.pendingRequests.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px' }}>
                No pending requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {team.pendingRequests.map((req) => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>{req.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Wants to join</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', padding: '8px 12px' }}
                        onClick={() => handleRequest(req.id, 'Reject')}
                        disabled={processingId === req.id}
                      >
                        <XCircle size={18} />
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '8px 12px' }}
                        onClick={() => handleRequest(req.id, 'Approve')}
                        disabled={processingId === req.id}
                      >
                        {processingId === req.id ? <Loader2 className="spinner" size={18} /> : <CheckCircle size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
