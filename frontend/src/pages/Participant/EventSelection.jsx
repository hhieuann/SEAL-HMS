import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, Clock, Shuffle, CheckCircle, ArrowRight, Info, Activity } from 'lucide-react';

// Custom hook for live countdown
const useCountdown = (targetDateStr) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDateStr) {
      setTimeLeft('');
      return;
    }

    const target = new Date(targetDateStr).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  return timeLeft;
};

const UpcomingEventCard = ({ evt, handleRegister, isRegisteringThisEvent, hasJoinedAnyEvent, isJoinedThisEvent, hasTeam, registerError }) => {
  const navigate = useNavigate();
  // We assume BE returns an ISO datetime for the deadline. If it's just a date, we append T23:59:59 to make the countdown accurate to end of day.
  let regCloseStr = evt.registrationEndDate;
  if (regCloseStr && regCloseStr.length === 10) regCloseStr += 'T23:59:59';
  const regCloseTime = useCountdown(regCloseStr);
  
  const max = evt.maxTeams || '∞';
  const current = evt.currentTeams || 0;
  const progressPerc = max === '∞' ? 0 : Math.min(100, (current / max) * 100);

  return (
    <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(59,130,246,0.3)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Upcoming / Registration Open
            </span>
            {regCloseTime && regCloseTime !== 'Expired' && (
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot" style={{ background: 'var(--warning)', width: '8px', height: '8px' }}></span>
                Closes in: {regCloseTime}
              </span>
            )}
            {regCloseTime === 'Expired' && (
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--danger)' }}>Registration Closed</span>
            )}
          </div>
          
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>{evt.name || "Untitled Hackathon"}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '700px', lineHeight: '1.6' }}>
            {evt.description || "Register now to secure your spot and start forming your team before the event begins!"}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" /> 
              <span style={{ fontWeight: '500' }}>Registration:</span> {evt.registrationStartDate || 'TBD'} – {evt.registrationEndDate || 'TBD'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--accent-2)" /> 
              <span style={{ fontWeight: '500' }}>Event starts:</span> {evt.startDate || 'TBD'}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Registered Teams</span>
              <span>{current} / {max}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-active)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPerc}%`, background: progressPerc >= 100 ? 'var(--danger)' : 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>

        <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
          {evt.registrationOpen !== false && (!hasJoinedAnyEvent) && (
            <button 
              onClick={() => handleRegister(evt.id)} 
              disabled={isRegisteringThisEvent || progressPerc >= 100 || regCloseTime === 'Expired'} 
              className="btn btn-primary"
              style={{ padding: '14px 24px', fontSize: '15px', justifyContent: 'center' }}
            >
              {isRegisteringThisEvent ? 'Registering...' : (progressPerc >= 100 ? 'Event Full' : 'Register to Join')}
            </button>
          )}
          {evt.registrationOpen === false && (
            <button className="btn btn-secondary" disabled style={{ opacity: 0.5, padding: '14px 24px', justifyContent: 'center' }}>Registration Closed</button>
          )}
          
          {registerError && registerError.eventId === evt.id && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '8px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '12px', color: '#ef4444', lineHeight: '1.5', marginTop: '8px' }}>
              <span style={{ flexShrink: 0, marginTop: '1px' }}>⚠️</span> {registerError.message}
            </div>
          )}
        </div>
      </div>
      
      {isJoinedThisEvent && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
          {!hasTeam ? (
            <div style={{ padding: '20px 24px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={22} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
                  ✅ Registered — Team formation required
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  You need to create a new team or enter an invite code to join a team (3-5 members) before the event starts.
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <button onClick={() => navigate('/participant/team-formation')} className="btn btn-primary">
                  Join Team <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 24px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={22} color="var(--success)" />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: 'var(--success)' }}>
                  Ready to compete
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Your team is fully registered. Waiting for the event to start.
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <button onClick={() => navigate('/participant/workspace')} className="btn btn-primary" style={{ background: 'var(--success)', color: 'black' }}>
                  Enter Workspace <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LiveEventCard = ({ evt, isJoinedThisEvent }) => {
  const navigate = useNavigate();
  
  const now = new Date();
  let currentRound = null;
  
  if (evt.rounds && evt.rounds.length > 0) {
    currentRound = evt.rounds.find(r => r.status && r.status.toUpperCase() === 'ACTIVE');
    
    if (!currentRound) {
      currentRound = evt.rounds.find(r => {
        const start = r.startTime ? new Date(r.startTime) : new Date(0);
        const end = r.endTime ? new Date(r.endTime) : new Date(8640000000000000);
        return now >= start && now <= end;
      });
    }
    if (!currentRound) {
       currentRound = evt.rounds.find(r => r.startTime && new Date(r.startTime) > now);
    }
  }

  const isActive = currentRound && (
    (currentRound.status && currentRound.status.toUpperCase() === 'ACTIVE') ||
    (now >= new Date(currentRound.startTime || 0) && now <= new Date(currentRound.endTime || 8640000000000000))
  );

  const targetTime = currentRound ? (isActive ? currentRound.endTime : currentRound.startTime) : evt.endDate;
  const countdownLabel = currentRound ? (isActive ? "Ends in:" : "Starts in:") : "Ends in:";
  const roundTimeLeft = useCountdown(targetTime);

  return (
    <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(16,185,129,0.4)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--success)' }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ background: 'var(--success)', width: '8px', height: '8px' }}></span>
              Event is Live
            </span>
          </div>
          
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>{evt.name || "Untitled Hackathon"}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px', maxWidth: '600px' }}>
            <Activity size={24} color="var(--success)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Currently Running
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                {currentRound ? currentRound.name : 'Main Competition Phase'}
                {roundTimeLeft && roundTimeLeft !== 'Expired' && (
                  <span style={{ fontSize: '13px', color: 'var(--success)', background: 'rgba(16,185,129,0.15)', padding: '4px 8px', borderRadius: '6px' }}>
                    {countdownLabel} {roundTimeLeft}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} color="var(--success)" /> <span style={{ fontWeight: '500' }}>Event Window:</span> {evt.startDate} – {evt.endDate || 'TBD'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="var(--primary)" /> <span style={{ fontWeight: '500' }}>Active Teams:</span> {evt.currentTeams || 0} / {evt.maxTeams || '∞'}</span>
          </div>
        </div>

        <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px', alignItems: 'flex-end' }}>
          {isJoinedThisEvent ? (
            <button onClick={() => navigate('/participant/workspace')} className="btn btn-primary" style={{ background: 'var(--success)', color: 'black', padding: '14px 24px', fontSize: '15px' }}>
              Enter Workspace <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
          ) : (
             <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
               Registration Closed<br/><span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-secondary)' }}>Event is currently ongoing</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CompletedEventCard = ({ evt }) => {
  const navigate = useNavigate();
  return (
    <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Ended</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>{evt.name}</h2>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Event ended on {evt.endDate || 'TBD'}</div>
        </div>
        <button type="button" onClick={() => navigate(`/participant/archive/${evt.id}`)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#ffd700" /> View Results
        </button>
      </div>
    </div>
  );
};

const EventSelection = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registeredEventId, setRegisteredEventId] = useState(null);
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [hasTeam, setHasTeam] = useState(localStorage.getItem('p_hasTeam') === 'true');
  const [registerError, setRegisterError] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('p_hasJoinedEvent') === 'true' && localStorage.getItem('p_hasTeam') !== 'true') {
      localStorage.removeItem('p_hasJoinedEvent');
      localStorage.removeItem('p_eventId');
      localStorage.removeItem('p_selectedEventId');
    }

    import('../../api/eventService.js').then(({ eventService }) => {
      eventService.getEvents().then(res => {
        const mappedEvents = (res.data || []).map(evt => {
          return { ...evt, registrationOpen: evt.registrationOpen !== false };
        });
        setEvents(mappedEvents);
      });
    });
    
    const handleStateUpdate = () => {
      setHasTeam(localStorage.getItem('p_hasTeam') === 'true');
    };
    window.addEventListener('participant_state_updated', handleStateUpdate);
    return () => window.removeEventListener('participant_state_updated', handleStateUpdate);
  }, []);

  const handleRegister = async (evtId) => {
    setRegisteringEventId(evtId);
    setRegisterError(null);
    try {
      await new Promise(r => setTimeout(r, 800)); // simulate network
      localStorage.setItem('p_hasJoinedEvent', 'true');
      localStorage.setItem('p_eventId', evtId.toString());
      setRegisteredEventId(evtId);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setRegisterError({ eventId: evtId, message: 'This event has reached its maximum number of teams. Registration is closed.' });
      } else if (status === 400) {
        const msg = err?.response?.data?.message || '';
        if (msg.toLowerCase().includes('not opened')) {
          setRegisterError({ eventId: evtId, message: 'Registration for this event has not opened yet.' });
        } else if (msg.toLowerCase().includes('closed')) {
          setRegisterError({ eventId: evtId, message: 'Registration for this event has closed.' });
        } else {
          setRegisterError({ eventId: evtId, message: msg || 'Unable to register. Please try again.' });
        }
      } else {
        setRegisterError({ eventId: evtId, message: 'Something went wrong. Please try again.' });
      }
    } finally {
      setRegisteringEventId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Explore Hackathons</h1>
          <p className="subtitle">Discover, register, and track ongoing SEAL hackathons.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '32px' }}>
        {events.map((evt) => {
          const isLive = evt.status?.toLowerCase() === 'live' || evt.status?.toLowerCase() === 'ongoing';
          const isUpcoming = evt.status?.toLowerCase() === 'upcoming' || evt.status?.toLowerCase() === 'planned';
          const isCompleted = evt.status?.toLowerCase() === 'completed';

          const joinedEventIdStr = localStorage.getItem('p_eventId');
          const hasTrueTeam = localStorage.getItem('p_hasTeam') === 'true' || hasTeam;
          const isJoinedThisEvent = registeredEventId === evt.id || (hasTrueTeam && joinedEventIdStr === evt.id.toString());
          const hasJoinedAnyEvent = registeredEventId !== null || (hasTrueTeam && !!joinedEventIdStr);

          if (isLive) {
             return <LiveEventCard key={evt.id} evt={evt} isJoinedThisEvent={isJoinedThisEvent} />;
          }
          if (isUpcoming) {
             return <UpcomingEventCard key={evt.id} evt={evt} handleRegister={handleRegister} isRegisteringThisEvent={registeringEventId === evt.id} hasJoinedAnyEvent={hasJoinedAnyEvent} isJoinedThisEvent={isJoinedThisEvent} hasTeam={hasTeam} registerError={registerError} />;
          }
          if (isCompleted) {
             return <CompletedEventCard key={evt.id} evt={evt} />;
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default EventSelection;
