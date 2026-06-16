import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, Clock, Shuffle, CheckCircle, ArrowRight, Info } from 'lucide-react';

// Simulate: has the track draw been completed by Admin?
const DRAW_DONE = localStorage.getItem('trackDraw') !== null;
const assignedTrack = DRAW_DONE
  ? { track: 'Track B', color: 'var(--accent-1)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', subTopic: 'Medical Knowledge RAG', teamsInTrack: 8 }
  : null;

const EventSelection = () => {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleRegister = () => {
    setRegistering(true);
    localStorage.setItem('p_hasJoinedEvent', 'true');
    setTimeout(() => {
      setRegistered(true);
      setRegistering(false);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px' }}>
      <div className="page-header" style={{ marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Hackathons</h1>
          <p className="subtitle">Discover and register for SEAL hackathons.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '32px' }}>

        {/* ── Active Event: SEAL SP26 ── */}
        <div className="glass-panel" style={{ padding: '32px', border: '1px solid rgba(59,130,246,0.2)' }}>
          {/* Event header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  🟢 Live Now
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>SEAL Hackathon Spring 2026</span>
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', lineHeight: '1.3' }}>
                "Mastering Domain-Specific<br />AI RAG Systems"
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={15} /> 11 – 12/04/2026</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} /> FPT University TP.HCM (Offline)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={15} /> 24 Teams Registered</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Prize Pool</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--warning)' }}>16,500,000 VND</div>
            </div>
          </div>

          {/* Action Area */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            {(!localStorage.getItem('p_hasJoinedEvent') && !registered) ? (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, padding: '20px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px' }}>
                  <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '15px' }}>Important Track Info</div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <Shuffle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
                      The specific competition track and topic will be <strong style={{ color: 'var(--text-primary)' }}>randomly drawn by the organizers</strong> on <strong style={{ color: 'var(--warning)' }}>Day 1 — Apr 11, 2026 at 14:00</strong>.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                  <button onClick={handleRegister} disabled={registering} className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px 24px', fontSize: '15px' }}>
                    {registering ? 'Registering...' : 'Register to Join'}
                  </button>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
                    Register to proceed to team formation
                  </div>
                </div>
              </div>
            ) : !localStorage.getItem('p_hasTeam') ? (
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
                    Your team is fully registered. Enter the Workspace to check track draw results and work on your project.
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
        </div>

        {/* ── Upcoming Event ── */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  🔵 Upcoming
                </span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>SEAL Hackathon Summer 2026</h2>
              <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={15} /> Jul 2026</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={15} /> FPT University TP.HCM</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Topic: Emerging Technologies — AI, IoT, Blockchain</p>
            </div>
            <button className="btn btn-secondary" disabled style={{ opacity: 0.5 }}>Registration Closed</button>
          </div>
        </div>

        {/* ── Ended Event ── */}
        <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Ended</span>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>SEAL Hackathon Fall 2025</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dec 2025 • FPT University HN</div>
            </div>
            <button type="button" onClick={() => navigate('/participant/archive')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} color="#ffd700" /> View Results
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EventSelection;
