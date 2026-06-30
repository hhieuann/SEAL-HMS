import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Code, LayoutTemplate, Briefcase, FileCheck, MessageSquare, HelpCircle, LogOut, Trophy, Bell, Lock, Users, X } from 'lucide-react';
import { authApi } from '../api/auth';
import { teamService } from '../api/teamService';
import './ParticipantLayout.css';

const ParticipantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(localStorage.getItem('p_hasTeam') === 'true');
  const [isEliminated, setIsEliminated] = useState(false);

  // Re-hydrate participant state from backend after login (localStorage was cleared on logout)
  useEffect(() => {
    const checkElimination = () => {
      const eId = localStorage.getItem('p_eventId') || localStorage.getItem('p_selectedEventId') || '1';
      const trackDrawConfirmed = localStorage.getItem(`trackDrawConfirmed_${eId}`) === 'true';
      if (!trackDrawConfirmed) {
        setIsEliminated(false);
        return;
      }
      const trackDrawStr = localStorage.getItem(`trackDraw_${eId}`);
      if (trackDrawStr) {
        try {
          const parsedDraw = JSON.parse(trackDrawStr);
          const myTeamName = localStorage.getItem('myTeamName');
          if (myTeamName) {
            const inDraw = parsedDraw.some(t => t.teams && t.teams.some(teamObj => (typeof teamObj === 'string' ? teamObj : teamObj.name) === myTeamName));
            setIsEliminated(!inDraw);
          }
        } catch(e) {}
      }
    };
    
    const handleStateUpdate = () => {
      checkElimination();
      setIsReady(localStorage.getItem('p_hasTeam') === 'true');
    };
    
    checkElimination();
    window.addEventListener('storage', handleStateUpdate);
    window.addEventListener('participant_state_updated', handleStateUpdate);

    const accountId = parseInt(localStorage.getItem('accountId'));
    const userEmail = localStorage.getItem('userEmail');

    const rehydrate = async () => {
      try {
        const { eventService } = await import('../api/eventService');
        const eventsRes = await eventService.getEvents();
        const allEvents = eventsRes.data || [];

        let foundActiveTeam = false;

        for (const evt of allEvents) {
          if (evt.status?.toLowerCase() === 'completed') {
            continue; // Ignore past events for active dashboard status
          }
          try {
            const teamsRes = await teamService.getTeamsByEvent(evt.id);
            const teams = teamsRes.data || [];

            for (const team of teams) {
              try {
                const membersRes = await teamService.getMembers(team.id);
                const members = membersRes.data || [];
                const isMember = members.some(m => m.accountId === accountId || m.email === userEmail);

                if (isMember) {
                  const me = members.find(m => m.accountId === accountId || m.email === userEmail);

                  if (!accountId && me?.accountId) {
                    localStorage.setItem('accountId', me.accountId);
                    localStorage.setItem('userId', me.accountId);
                  }

                  localStorage.setItem('p_hasTeam', 'true');
                  localStorage.setItem('p_hasJoinedEvent', 'true');
                  localStorage.setItem('p_teamId', team.id);
                  localStorage.setItem('myTeamName', team.name);
                  localStorage.setItem('p_isLeader', me?.role === 'LEADER' ? 'true' : 'false');
                  localStorage.setItem('p_eventId', evt.id);
                  localStorage.setItem('p_selectedEventId', evt.id);
                  localStorage.setItem('p_teamInviteCode', team.inviteCode || `SEAL${team.id}`);
                  setIsReady(true);
                  foundActiveTeam = true;
                  window.dispatchEvent(new Event('participant_state_updated'));
                  return; // Done
                }
              } catch (e) { /* skip */ }
            }
          } catch (e) { /* skip */ }
        }

        if (!foundActiveTeam && localStorage.getItem('p_hasTeam') === 'true') {
           localStorage.removeItem('p_hasTeam');
           localStorage.removeItem('p_hasJoinedEvent');
           localStorage.removeItem('p_teamId');
           localStorage.removeItem('myTeamName');
           localStorage.removeItem('p_isLeader');
           // Keep selectedEventId if they want to browse, but clear the strict eventId lock
           localStorage.removeItem('p_eventId');
           setIsReady(false);
           window.dispatchEvent(new Event('participant_state_updated'));
        }

      } catch (e) {
        console.error('Failed to re-hydrate participant state:', e);
      }
    };

    rehydrate();

    return () => {
      window.removeEventListener('storage', handleStateUpdate);
      window.removeEventListener('participant_state_updated', handleStateUpdate);
    };
  }, []);

  const handleLogout = () => {
    authApi.logout();
  };

  const LockedItem = ({ icon, label }) => (
    <div
      title="Complete setup first: Select an event → choose a track → join or create a team"
      style={{
        opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 16px', borderRadius: '10px',
        color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500'
      }}
    >
      {icon}
      <span>{label}</span>
      <Lock size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
    </div>
  );

  return (
    <div className="app-container">
      <header className="fpt-topbar">
        <div className="logo" style={{ color: 'white', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon" style={{ background: 'white', color: 'var(--primary)' }}><Code size={24} /></div>
          <span className="logo-text">SEAL<span style={{ color: 'white' }}>.</span></span>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 8px' }}></div>
          <img src="/src/assets/FptLogo.png" alt="FPT" style={{ height: '90px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ paddingRight: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '24px', color: 'white' }}>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User')}&background=fff&color=F26F21`} alt="User Avatar" className="avatar" style={{ width: '32px', height: '32px', border: 'none' }} />
            <div className="user-details" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span className="user-name" style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                {localStorage.getItem('userName') || (localStorage.getItem('userEmail') ? localStorage.getItem('userEmail').split('@')[0] : 'Participant')}
              </span>
              <span className="user-role" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Participant</span>
            </div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout" style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">

        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="nav-section-title">HACKATHON</p>

            <NavLink to="/participant/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutTemplate size={20} />
              <span>Explore Events</span>
            </NavLink>

            <NavLink to="/participant/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Bell size={20} />
              <span>Announcements</span>
              <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>2</span>
            </NavLink>

            {isReady ? (
              <>
                <NavLink to="/participant/team-management" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Users size={20} />
                  <span>My Team</span>
                </NavLink>
                <NavLink to="/participant/workspace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Briefcase size={20} />
                  <span>Team Workspace</span>
                </NavLink>
                <NavLink to="/participant/submission" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FileCheck size={20} />
                  <span>My Submission</span>
                </NavLink>
                <NavLink to="/participant/scores" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Trophy size={20} />
                  <span>Scores & Results</span>
                </NavLink>
              </>
            ) : (
              <>
                <LockedItem icon={<Briefcase size={20} />} label="Team Workspace" />
                <LockedItem icon={<FileCheck size={20} />} label="My Submission" />
                <LockedItem icon={<Trophy size={20} />} label="Scores & Results" />
                <div style={{
                  margin: '8px 12px', padding: '10px 12px',
                  background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)',
                  borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7'
                }}>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Setup required:</span><br />
                  Select an event → choose a track → join or create a team.
                </div>
              </>
            )}
          </div>

          <div className="nav-section">
            <p className="nav-section-title">SUPPORT</p>
            {isReady ? (
              <NavLink to="/participant/mentor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Contact Mentor</span>
              </NavLink>
            ) : (
              <LockedItem icon={<MessageSquare size={20} />} label="Contact Mentor" />
            )}
            <NavLink to="/participant/faq" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <HelpCircle size={20} />
              <span>FAQ & Rules</span>
            </NavLink>
          </div>
        </nav>
      </aside>

        <main className="main-content">
          <div className="page-content" style={{ height: '100vh', overflowY: 'auto' }}>
            {isEliminated && (location.pathname.includes('/workspace') || location.pathname.includes('/submission')) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                  <X size={48} color="#ef4444" />
                </div>
                <h1 style={{ fontSize: '32px', color: 'var(--text-primary)', marginBottom: '16px' }}>Your team has been eliminated.</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', lineHeight: '1.6' }}>
                  Thank you for participating in the hackathon! Unfortunately, your team did not advance to the current round. 
                  You can still view your scores and team details using the sidebar.
                </p>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParticipantLayout;
