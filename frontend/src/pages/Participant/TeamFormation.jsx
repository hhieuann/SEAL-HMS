import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, UserPlus, ArrowRight, AlertCircle, CheckCircle2, PartyPopper, Copy, Check } from 'lucide-react';
import { mockService } from '../../api/mockService';
import './Workspace.css';

const TeamFormation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInviteCode = searchParams.get('inviteCode');
  
  const [activeTab, setActiveTab] = useState(initialInviteCode ? 'join' : 'create'); // 'create', 'join', 'waiting', 'success_create'
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      // Using eventId=1 and leaderAccountId=1 for Phase 1 integration since auth is not fully set up
      const eventId = 1; 
      const response = await teamService.createTeam(eventId, { 
        name: teamName, 
        leaderAccountId: 1 
      });
      
      // Backend createTeam might not return inviteCode immediately if we haven't implemented it in DB,
      // but let's assume it returns { id, name, inviteCode } or we generate a dummy one for now
      const teamResponseData = response.data || response; // Support both wrapped and unwrapped just in case
      localStorage.setItem('p_teamInviteCode', teamResponseData.inviteCode || 'CODE123');
      localStorage.setItem('myTeamName', teamResponseData.name || teamName);
      localStorage.setItem('p_teamId', teamResponseData.id || '1');
      localStorage.setItem('p_hasJoinedEvent', 'true');
      localStorage.setItem('p_hasTeam', 'true');
      localStorage.setItem('p_isLeader', 'true');
      
      setActiveTab('success_create');
    } catch (err) {
      setError(err.message || 'Failed to create team');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setError('');
    const inviteCode = e.target[0].value;
    setIsSubmitting(true);

    try {
      const currentUser = localStorage.getItem('userEmail') || 'Current User';
      await mockService.joinTeam(inviteCode, currentUser);
      
      localStorage.setItem('p_hasJoinedEvent', 'true');
      localStorage.setItem('p_hasTeam', 'true'); // Pending state
      
      setActiveTab('waiting');
    } catch (err) {
      setError(err.message || 'Failed to send request');
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
          <p className="subtitle">You have selected the <strong>AI & Machine Learning</strong> track. Now, let's get your team ready.</p>
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
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Team Name</label>
              <input type="text" className="task-input" placeholder="e.g., NullPointerException" defaultValue="ByteStrike" required />
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
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Invite Code</label>
              <input type="text" className="task-input" placeholder="Enter 6-digit code or paste link" defaultValue={initialInviteCode || ''} required />
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
