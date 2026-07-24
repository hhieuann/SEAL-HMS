import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, UserPlus, ArrowRight, AlertCircle, CheckCircle2, PartyPopper, Copy, Check } from 'lucide-react';
import './Workspace.css';
import apiClient from '../../api/apiClient';

const TeamFormation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInviteCode = searchParams.get('inviteCode');
  
  const [activeTab, setActiveTab] = useState(initialInviteCode ? 'join' : 'create'); // 'create', 'join', 'waiting', 'success_create'
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState(''); // '' = no chapter

  useEffect(() => {
    const eventId = localStorage.getItem('p_eventId') || localStorage.getItem('p_selectedEventId');
    if (!eventId) return;
    apiClient.get(`/api/v1/events/${eventId}/tracks`)
      .then(res => {
        const tracks = res.data?.data || res.data || [];
        if (Array.isArray(tracks) && tracks.length > 0) {
          // Use the first track or the one matching the participant's registered track
          setTrackName(tracks[0].name || '');
        }
      })
      .catch(() => {}); // Fail silently — subtitle just won't show track name
  }, []);

  // Load chapters for the optional "join a chapter" dropdown.
  useEffect(() => {
    apiClient.get('/api/v1/chapters')
      .then(res => setChapters(res.data?.data || res.data || []))
      .catch(() => {}); // no chapters configured -> dropdown just shows the "no chapter" option
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localStorage.getItem('p_teamInviteCode') || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    const teamName = e.target[0].value;
    setIsSubmitting(true);

    try {
      const { teamService } = await import('../../api/teamService.js');
      const eventId = parseInt(localStorage.getItem('p_eventId') || localStorage.getItem('p_selectedEventId') || '1');
      const leaderAccountId = parseInt(localStorage.getItem('accountId') || localStorage.getItem('userId') || '1');
      const response = await teamService.createTeam(eventId, {
        name: teamName,
        leaderAccountId,
        chapterId: chapterId ? parseInt(chapterId) : null, // null = not affiliated with a chapter
      });
      
      // The API returns { success: true, data: { id, name, ... } }
      // teamService returns the full response.data block.
      const teamResponseData = response.data || response; 
      const realData = teamResponseData.data || teamResponseData; // Extract inner data
      localStorage.setItem('p_teamInviteCode', realData.inviteCode || `SEAL${realData.id}`);
      localStorage.setItem('myTeamName', realData.name || teamName);
      localStorage.setItem('p_teamId', realData.id || '1');
      localStorage.setItem('p_hasJoinedEvent', 'true');
      localStorage.setItem('p_hasTeam', 'true');
      localStorage.setItem('p_isLeader', 'true');
      
      window.dispatchEvent(new Event('participant_state_updated'));
      
      setActiveTab('success_create');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create team');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setError('');
    const inviteCode = e.target[0].value.trim();
    setIsSubmitting(true);

    try {
      const { teamService } = await import('../../api/teamService.js');
      const accountId = parseInt(localStorage.getItem('accountId') || localStorage.getItem('userId') || '1');
      
      const teamIdMatch = inviteCode.match(/^SEAL(\d+)$/i);
      if (!teamIdMatch) throw new Error('Invalid invite code. Ensure you use the exact code provided by your leader (e.g. SEAL6)');
      
      const teamId = parseInt(teamIdMatch[1]);

      // Use real backend API to send an invite request
      await teamService.inviteMember(teamId, { accountId });
      
      // User is now in 'INVITED' status. They must wait for the leader to accept.
      localStorage.setItem('p_hasJoinedEvent', 'true');
      localStorage.setItem('p_hasTeam', 'true'); // Pending state
      localStorage.setItem('p_teamInviteCode', inviteCode.toUpperCase());
      
      setActiveTab('waiting');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to join team');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Team Formation</h1>
          <p className="subtitle">
            {trackName
              ? <>You have selected the <strong>{trackName}</strong> track. Now, let's get your team ready.</>
              : "Let's get your team ready for the event."
            }
          </p>
        </div>
      </div>

      {/* Error Message UI */}
      {error && (
        <div
          className={shaking ? 'shake' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', marginBottom: '20px', maxWidth: '900px',
            animation: shaking ? 'shake 0.4s ease-in-out' : 'none',
          }}
        >
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{error}</span>
        </div>
      )}

      {activeTab === 'success_create' ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '60px 40px', textAlign: 'center', maxWidth: '560px', margin: '0 auto', background: '#1c1c1e', border: 'none', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <PartyPopper size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#ffffff', fontWeight: '700' }}>Team Created Successfully!</h2>
          <p style={{ color: '#a1a1aa', marginBottom: '32px', fontSize: '15px' }}>
            Your team <strong style={{ color: '#ffffff' }}>{localStorage.getItem('myTeamName')}</strong> is now ready.
          </p>

          <div style={{ background: '#09090b', borderRadius: '12px', padding: '32px', marginBottom: '32px', border: '1px solid #27272a' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#71717a', textTransform: 'uppercase', marginBottom: '16px' }}>
              Team Invite Code
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              <span style={{ fontSize: '42px', fontWeight: '800', color: '#3b82f6', letterSpacing: '6px' }}>
                {localStorage.getItem('p_teamInviteCode')}
              </span>
              <button 
                onClick={copyToClipboard}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} color="#a1a1aa" />}
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
              Share this code with your friends so they can join your team.
            </p>
          </div>

          <button className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '15px', fontWeight: '600', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#ffffff', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }} onClick={() => navigate('/participant/team-management')}>
            Manage Team <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      ) : activeTab === 'waiting' ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <CheckCircle2 size={64} color="var(--primary)" style={{ margin: '0 auto 24px auto' }} />
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Request Sent Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
            Your request to join the team has been sent to the Team Leader. You will be notified once they approve.
          </p>
          <button className="btn btn-secondary" onClick={() => setActiveTab('join')}>Back to Join</button>
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Create Team Card */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '32px', 
            border: activeTab === 'create' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setActiveTab('create')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <Users size={32} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px' }}>Create a Team</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Become a Team Leader</p>
            </div>
          </div>

          <form onSubmit={handleCreateTeam} style={{ display: activeTab === 'create' ? 'block' : 'none' }}>
            <div className="form-floating" style={{ marginBottom: '20px' }}>
              <input type="text" id="teamName" className="task-input" placeholder=" " required style={{ width: '100%', paddingTop: '20px', paddingBottom: '8px' }} />
              <label htmlFor="teamName">Team Name</label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="chapterSelect" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>
                Chapter <span style={{ fontWeight: '400' }}>(optional)</span>
              </label>
              <select
                id="chapterSelect"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#FFFFFF', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
              >
                <option value="">No chapter (event ranking only)</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                Pick a chapter to contribute points to the year-long <strong>Chapter Leaderboard</strong>. Leave empty to compete in this event only.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>Team Size Constraint</label>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>3 to 5</span> members per team (including Leader).
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                You will be able to invite 2 to 4 other members via an invite code after creation.
              </p>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" required style={{ marginTop: '4px' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  I commit that all team members are <strong>undergraduate students</strong>.
                </span>
              </label>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" required style={{ marginTop: '4px' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  I commit that each member will participate in <strong>only 1 team</strong>.
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting && activeTab === 'create'}>
              {isSubmitting && activeTab === 'create' ? 'Creating...' : <>Create & Proceed <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* Join Team Card */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '32px', 
            border: activeTab === 'join' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setActiveTab('join')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '12px', borderRadius: '12px' }}>
              <UserPlus size={32} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px' }}>Join a Team</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>I have an invite code</p>
            </div>
          </div>

          <form onSubmit={handleJoinTeam} style={{ display: activeTab === 'join' ? 'block' : 'none' }}>
            <div className="form-floating" style={{ marginBottom: '20px' }}>
              <input type="text" id="inviteCode" className="task-input" placeholder=" " defaultValue={initialInviteCode || ''} required style={{ width: '100%', paddingTop: '20px', paddingBottom: '8px' }} />
              <label htmlFor="inviteCode">Invite Code</label>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px', color: 'var(--warning)', fontSize: '13px' }}>
              Note: Joining a team is subject to approval by the Team Leader or System if capacity is full.
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting && activeTab === 'join'}>
              {isSubmitting && activeTab === 'join' ? 'Sending Request...' : <>Request to Join <ArrowRight size={16} /></>}
            </button>
          </form>
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
    </div>
  );
};

export default TeamFormation;
