import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Code,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react';
import apiClient from '../../api/apiClient';
import { eventService } from '../../api/eventService';
import { teamService } from '../../api/teamService';
import { submissionService, scoreService } from '../../api/scoreService';
import Settings from '../Shared/Settings';
import FptLogo from '../../assets/FptLogo.png';
import './ExpertDashboard.css';

const ROLE_CONFIG = {
  judge: {
    assignmentRole: 'Judge',
    label: 'Judging',
    heading: 'Judge assignments',
    description: 'Review assigned submissions and complete scoring for active rounds.',
    icon: Shield,
    accent: '#D97706',
    soft: '#FFF7E8',
  },
  mentor: {
    assignmentRole: 'Mentor',
    label: 'Mentoring',
    heading: 'Mentor assignments',
    description: 'Support assigned teams and respond to their active requests.',
    icon: BookOpen,
    accent: '#2F855A',
    soft: '#ECF8F0',
  },
  staff: {
    assignmentRole: 'Event Staff',
    label: 'Operations',
    heading: 'Staff assignments',
    description: 'Coordinate event operations, teams, rounds and communications.',
    icon: User,
    accent: '#0072BC',
    soft: '#EAF5FC',
  },
};

const ACCOUNT_DETAILS = {
  STAFF: {
    label: 'Event Staff',
    portal: 'Staff Operations',
    heading: 'Event operations workspace',
    summary: 'Keep assigned hackathons organized and moving through every round.',
  },
  LECTURER: {
    label: 'Lecturer',
    portal: 'Lecturer Workspace',
    heading: 'Academic expert workspace',
    summary: 'Move between judging and mentoring responsibilities from one place.',
  },
  JUDGE: {
    label: 'Judge',
    portal: 'Judge Workspace',
    heading: 'Evaluation workspace',
    summary: 'Review assigned teams and complete fair, consistent scoring.',
  },
  GUEST_JUDGE: {
    label: 'Guest Judge',
    portal: 'Guest Judge Workspace',
    heading: 'Evaluation workspace',
    summary: 'Review assigned teams and complete fair, consistent scoring.',
  },
  MENTOR: {
    label: 'Mentor',
    portal: 'Mentor Workspace',
    heading: 'Team support workspace',
    summary: 'Guide assigned teams and keep support requests moving.',
  },
};

const getInitialTab = () => {
  const role = localStorage.getItem('userRole');
  if (role === 'STAFF') return 'staff';
  if (role === 'MENTOR') return 'mentor';
  return 'judge';
};

const getAssignmentMetrics = (assignment) => {
  if (assignment.role === 'Judge') {
    return [
      { label: 'Pending', value: assignment.stats.pending, icon: Clock },
      { label: 'Flagged', value: assignment.stats.flagged, icon: AlertCircle, tone: 'danger' },
      { label: 'Completed', value: assignment.stats.completed, icon: CheckCircle2, tone: 'success' },
    ];
  }

  if (assignment.role === 'Mentor') {
    return [
      { label: 'Open tickets', value: assignment.stats.openTickets, icon: Clock },
      { label: 'Urgent', value: assignment.stats.urgentTickets, icon: AlertCircle, tone: 'danger' },
      { label: 'Resolved', value: assignment.stats.resolved, icon: CheckCircle2, tone: 'success' },
    ];
  }

  return [
    {
      label: 'Management access',
      value: assignment.status === 'active' ? 'Active' : 'Scheduled',
      icon: CheckCircle2,
      tone: assignment.status === 'active' ? 'success' : 'neutral',
    },
    { label: 'Scope', value: 'Entire event', icon: Briefcase },
  ];
};

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleEnterWorkspace = (ctx) => {
    const contextData = { event: ctx.event, role: ctx.role, track: ctx.track, trackId: ctx.trackId, path: ctx.path, eventId: ctx.eventId };
    localStorage.setItem('expertContext', JSON.stringify(contextData));
    navigate(ctx.path);
  };

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(() => {
    const email = localStorage.getItem('userEmail') || 'Expert';
    const userName = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole') || 'JUDGE';
    const userId = parseInt(localStorage.getItem('userId') || '1');
    
    const roles = [];
    if (role === 'JUDGE' || role === 'LECTURER' || role === 'GUEST_JUDGE') roles.push('Judge');
    if (role === 'MENTOR' || role === 'LECTURER') roles.push('Mentor');
    if (role === 'STAFF') roles.push('Staff');
    
    const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    return { 
      name: userName || email.split('@')[0], 
      roles,
      userId,
      avatar: u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || email.split('@')[0])}&background=14b8a6&color=fff` 
    };
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (u.name || u.avatarUrl) {
          setCurrentUser(prev => ({
            ...prev,
            name: u.name || prev.name,
            avatar: u.avatarUrl ? `${import.meta.env.VITE_API_BASE_URL || ''}${u.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || prev.name)}&background=14b8a6&color=fff`
          }));
        }
      } catch { /* ignored on purpose */ }
    };
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('participant_state_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('participant_state_updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, assignmentsRes] = await Promise.all([
          eventService.getAssignedEvents(),
          apiClient.get('/api/v1/users/me/assignments').catch(() => ({ data: { data: [] } }))
        ]);
        const events = (eventsRes.data || []).filter(
          e => e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
        );
        const myAssignments = assignmentsRes.data?.data || [];
        
        const dynamicAssignments = [];
        
        for (const evt of events) {
          // Find all tracks for this event that the user is assigned to.
          // Wait, we don't have all tracks fetched here... But we do know the event.
          // We can fetch tracks for the event to map trackId to trackName.
          let eventTracks = [];
          try {
             const { trackService } = await import('../../api/trackService.js');
             const tr = await trackService.getTracksByEvent(evt.id);
             eventTracks = tr.data || [];
          } catch { /* ignored on purpose */ }
          
          let teamsList = [];
          if (evt.status !== 'CREATED') {
            try {
              const teamsData = await teamService.getTeamsByEvent(evt.id);
              teamsList = teamsData?.data || teamsData || [];
            } catch { /* ignored on purpose */ }
          }
          
          // Filter my assignments that match this event's tracks
          const eventTrackIds = eventTracks.map(t => t.id);
          const myAssignmentsForEvent = myAssignments.filter(a => eventTrackIds.includes(a.trackId));
          const judgeAssignments = myAssignmentsForEvent.filter(a => a.role === 'JUDGE');
          
          if (currentUser.roles.includes('Judge')) {
            if (judgeAssignments.length > 0) {
              for (const assignment of judgeAssignments) {
                const trackObj = eventTracks.find(t => t.id === assignment.trackId);
                const trackName = trackObj ? trackObj.name : 'All Tracks';
                const trackId = trackObj ? trackObj.id : null;
                
                // Calculate Judge Stats if applicable
                let pending = '-', completed = '-';
                if (evt.status !== 'CREATED') {
                  try {
                    let p = 0, c = 0;
                    const roundsRes = await eventService.getEventRounds(evt.id);
                    const rounds = roundsRes.data || [];
                    let activeRoundIdx = -1;
                    for (let i = rounds.length - 1; i >= 0; i--) {
                      if (rounds[i].status !== 'CREATED' && rounds[i].status?.toLowerCase() !== 'planned') {
                        activeRoundIdx = i; break;
                      }
                    }
                    const activeRound = rounds[activeRoundIdx !== -1 ? activeRoundIdx : 0];
                    
                    if (activeRound) {
                      await Promise.all(teamsList.map(async (t) => {
                      if (trackId && t.trackId !== trackId) return;
                      if (['REGISTERED', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(t.status)) {
                        try {
                          const subRes = await submissionService.getSubmission(activeRound.id, t.id);
                          if (subRes?.data?.id) {
                            const scoresRes = await scoreService.getScoresByJudge(subRes.data.id, currentUser.userId);
                            if (scoresRes?.data?.length > 0) c++; else p++;
                          }
                        } catch {
                          // No submission yet
                        }
                      }
                    }));
                  }
                  pending = p;
                  completed = c;
                } catch (e) { console.error(e); }
              }

              dynamicAssignments.push({
                id: `judge-${evt.id}-${trackId || 'any'}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Judge',
                track: trackName,
                trackId: trackId,
                path: '/judge/panel',
                stats: { pending, flagged: 0, completed },
                status: evt.status === 'CREATED' ? 'upcoming' : 'active'
              });
            }
          } else {
            dynamicAssignments.push({
                id: `judge-none-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Judge',
                track: 'No judge assignments',
                trackId: null,
                path: null,
                stats: { pending: '-', flagged: '-', completed: '-' },
                status: 'upcoming'
              });
            }
          }

          if (currentUser.roles.includes('Mentor')) {
            const userEmail = localStorage.getItem('userEmail');
            const isMentor = teamsList.some(t => t.mentor && (t.mentor.email === userEmail || t.mentor.id === currentUser.userId));
            
            if (isMentor) {
              const mentoredTeams = teamsList.filter(t => t.mentor && (t.mentor.email === userEmail || t.mentor.id === currentUser.userId));
              const mentoredTrackIds = [...new Set(mentoredTeams.map(t => t.trackId).filter(Boolean))];
              const mentoredTrackNames = mentoredTrackIds.map(tid => {
                const tr = eventTracks.find(t => t.id === tid);
                return tr ? tr.name : null;
              }).filter(Boolean);
              const trackLabel = mentoredTrackNames.length > 0 ? mentoredTrackNames.join(', ') : 'All Tracks';

              dynamicAssignments.push({
                id: `mentor-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Mentor',
                track: trackLabel,
                trackId: mentoredTrackIds[0] || null,
                path: '/mentor/tickets',
                stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
                status: evt.status === 'CREATED' ? 'upcoming' : 'active'
              });
            } else {
              dynamicAssignments.push({
                id: `mentor-none-${evt.id}`,
                eventId: evt.id,
                event: evt.name,
                role: 'Mentor',
                track: 'No mentor assignments',
                trackId: null,
                path: null,
                stats: { openTickets: '-', urgentTickets: '-', resolved: '-' },
                status: 'upcoming'
              });
            }
          }

          if (currentUser.roles.includes('Staff')) {
            dynamicAssignments.push({
              id: `staff-${evt.id}`,
              eventId: evt.id,
              event: evt.name,
              role: 'Event Staff',
              track: 'Global Management',
              trackId: null,
              path: `/admin/event/${evt.id}/dashboard`,
              stats: { managed: true },
              status: evt.status === 'CREATED' ? 'upcoming' : 'active'
            });
          }
        }
        
        setAssignments(dynamicAssignments);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentUser.roles, currentUser.userId]);

  const hasJudge = currentUser.roles.includes('Judge');
  const hasMentor = currentUser.roles.includes('Mentor');
  const hasStaff = currentUser.roles.includes('Staff');
  const accountRole = localStorage.getItem('userRole') || 'JUDGE';
  const accountDetails = ACCOUNT_DETAILS[accountRole] || ACCOUNT_DETAILS.JUDGE;
  const roleOptions = [
    { key: 'judge', enabled: hasJudge },
    { key: 'mentor', enabled: hasMentor },
    { key: 'staff', enabled: hasStaff },
  ].filter(option => option.enabled);
  const activeRole = ROLE_CONFIG[activeTab] || ROLE_CONFIG.judge;
  const visibleAssignments = assignments.filter(
    assignment => assignment.role === activeRole.assignmentRole
  );
  const assignedWorkspaces = assignments.filter(assignment => assignment.path);
  const activeWorkspaces = assignedWorkspaces.filter(assignment => assignment.status === 'active');
  const upcomingWorkspaces = assignedWorkspaces.filter(assignment => assignment.status === 'upcoming');
  const activeRoleAssigned = visibleAssignments.filter(assignment => assignment.path);
  const firstName = currentUser.name.trim().split(/\s+/)[0] || 'Expert';

  return (
    <div className="expert-shell animate-fade-in">
      <header className="expert-topbar">
        <div className="expert-topbar-inner">
          <div className="expert-brand">
            <div className="expert-brand-mark" aria-hidden="true">
              <Code size={24} />
            </div>
            <div className="expert-brand-copy">
              <strong>SEAL.</strong>
              <span>{accountDetails.portal}</span>
            </div>
            <div className="expert-brand-divider" />
            <img src={FptLogo} alt="FPT University" className="expert-fpt-logo" />
          </div>

          <div className="expert-account">
            <button
              type="button"
              className={`expert-icon-button ${showSettings ? 'is-active' : ''}`}
              title="My settings"
              aria-label="My settings"
              onClick={() => setShowSettings(previous => !previous)}
            >
              <SettingsIcon size={19} />
            </button>
            <img src={currentUser.avatar} alt={`${currentUser.name} avatar`} className="expert-avatar" />
            <div className="expert-account-copy">
              <strong>{currentUser.name}</strong>
              <span>{accountDetails.label}</span>
            </div>
            <button
              type="button"
              className="expert-icon-button expert-logout-button"
              title="Logout"
              aria-label="Logout"
              onClick={() => {
                import('../../api/auth').then(({ authApi }) => authApi.logout());
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      {showSettings ? (
        <main className="expert-settings-page">
          <button
            type="button"
            className="expert-back-button"
            onClick={() => setShowSettings(false)}
          >
            <ArrowLeft size={18} />
            Back to dashboard
          </button>
          <div className="expert-settings-heading">
            <span>Account</span>
            <h1>Profile and security</h1>
          </div>
          <Settings />
        </main>
      ) : (
        <>
          <section className="expert-hero">
            <div className="expert-hero-inner">
              <div className="expert-hero-copy">
                <span className="expert-hero-kicker">{accountDetails.portal}</span>
                <h1>Welcome back, {firstName}</h1>
                <h2>{accountDetails.heading}</h2>
                <p>{accountDetails.summary}</p>
              </div>
              <div className="expert-hero-role" aria-label={`Current role: ${accountDetails.label}`}>
                <div className="expert-hero-role-icon">
                  {accountRole === 'STAFF' ? <User size={30} /> : <Shield size={30} />}
                </div>
                <div>
                  <span>Signed in as</span>
                  <strong>{accountDetails.label}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="expert-stat-band" aria-label="Assignment summary">
            <div className="expert-stat-band-inner">
              <div className="expert-stat-item expert-stat-orange">
                <Briefcase size={22} />
                <div>
                  <strong>{assignedWorkspaces.length}</strong>
                  <span>Assigned workspaces</span>
                </div>
              </div>
              <div className="expert-stat-item expert-stat-blue">
                <CheckCircle2 size={22} />
                <div>
                  <strong>{activeWorkspaces.length}</strong>
                  <span>Active now</span>
                </div>
              </div>
              <div className="expert-stat-item expert-stat-green">
                <CalendarDays size={22} />
                <div>
                  <strong>{upcomingWorkspaces.length}</strong>
                  <span>Upcoming</span>
                </div>
              </div>
            </div>
          </section>

          <main className="expert-main">
            <section className="expert-work-section">
              <div className="expert-section-heading">
                <div>
                  <span>My work</span>
                  <h2>{activeRole.heading}</h2>
                </div>
                {roleOptions.length > 1 && (
                  <div className="expert-role-switch" aria-label="Assignment role">
                    {roleOptions.map(option => {
                      const config = ROLE_CONFIG[option.key];
                      const RoleIcon = config.icon;
                      return (
                        <button
                          type="button"
                          key={option.key}
                          className={activeTab === option.key ? 'is-active' : ''}
                          style={{ '--role-accent': config.accent }}
                          aria-pressed={activeTab === option.key}
                          onClick={() => setActiveTab(option.key)}
                        >
                          <RoleIcon size={17} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="expert-empty-state" aria-live="polite">
                  <div className="expert-empty-icon is-loading">
                    <Clock size={30} />
                  </div>
                  <h3>Loading your assignments</h3>
                  <p>Checking current events and workspace access.</p>
                </div>
              ) : visibleAssignments.length === 0 ? (
                <div className="expert-empty-state">
                  <div
                    className="expert-empty-icon"
                    style={{ color: activeRole.accent, background: activeRole.soft }}
                  >
                    <LayoutDashboard size={30} />
                  </div>
                  <h3>No {activeRole.label.toLowerCase()} assignments yet</h3>
                  <p>Your assigned events will appear here as soon as an administrator publishes them.</p>
                </div>
              ) : (
                <div className="expert-assignment-grid">
                  {visibleAssignments.map(assignment => {
                    const RoleIcon = activeRole.icon;
                    const metrics = getAssignmentMetrics(assignment);
                    const isAccessible = Boolean(assignment.path);
                    const isActive = assignment.status === 'active';
                    const statusLabel = !isAccessible
                      ? 'Not assigned'
                      : isActive
                        ? 'Active'
                        : 'Scheduled';

                    return (
                      <article
                        key={assignment.id}
                        className="expert-assignment-card"
                        style={{
                          '--role-accent': activeRole.accent,
                          '--role-soft': activeRole.soft,
                        }}
                      >
                        <div className="expert-assignment-card-header">
                          <div className="expert-assignment-role-icon">
                            <RoleIcon size={20} />
                          </div>
                          <div className="expert-assignment-title">
                            <span>{assignment.role}</span>
                            <h3>{assignment.event}</h3>
                          </div>
                          <span
                            className={`expert-assignment-status ${
                              isAccessible && isActive ? 'is-active' : ''
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <div className="expert-assignment-scope">
                          <span>{assignment.role === 'Event Staff' ? 'Scope' : 'Track'}</span>
                          <strong>
                            {assignment.role === 'Event Staff' ? 'Entire event' : assignment.track}
                          </strong>
                        </div>

                        <div className="expert-assignment-metrics">
                          {metrics.map(metric => {
                            const MetricIcon = metric.icon;
                            return (
                              <div key={metric.label} className={`expert-metric ${metric.tone || ''}`}>
                                <span>
                                  <MetricIcon size={16} />
                                  {metric.label}
                                </span>
                                <strong>{metric.value}</strong>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="expert-enter-button"
                          disabled={!isAccessible || !isActive}
                          onClick={() => handleEnterWorkspace(assignment)}
                        >
                          {!isAccessible
                            ? 'Not assigned'
                            : isActive
                              ? 'Enter workspace'
                              : 'Available when event starts'}
                          {isAccessible && isActive && <ArrowRight size={17} />}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="expert-side-column">
              <section
                className="expert-role-summary"
                style={{ '--role-accent': activeRole.accent, '--role-soft': activeRole.soft }}
              >
                <div className="expert-role-summary-heading">
                  <div className="expert-role-summary-icon">
                    <activeRole.icon size={22} />
                  </div>
                  <div>
                    <span>Current view</span>
                    <h2>{activeRole.label}</h2>
                  </div>
                </div>
                <p>{activeRole.description}</p>
                <dl>
                  <div>
                    <dt>Assigned</dt>
                    <dd>{activeRoleAssigned.length}</dd>
                  </div>
                  <div>
                    <dt>Active</dt>
                    <dd>
                      {activeRoleAssigned.filter(assignment => assignment.status === 'active').length}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="expert-quick-panel">
                <div>
                  <SettingsIcon size={20} />
                  <h2>Account settings</h2>
                </div>
                <p>Update your profile, avatar and password.</p>
                <button type="button" onClick={() => setShowSettings(true)}>
                  Open settings
                  <ArrowRight size={16} />
                </button>
              </section>
            </aside>
          </main>
        </>
      )}
    </div>
  );
};

export default ExpertDashboard;
