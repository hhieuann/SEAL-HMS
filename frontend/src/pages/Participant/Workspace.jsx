import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, FileText, CheckSquare, MessageSquare, Plus, Upload, MoreVertical, Send, Clock, BookOpen, ExternalLink, AlertTriangle, Check, X, Target, AlertCircle } from 'lucide-react';
import { teamService } from '../../api/teamService';
import './Workspace.css';

// Simulate: problem statement released after 07:00 Day 2
const PROBLEM_RELEASED = true;

const Workspace = () => {
  const navigate = useNavigate();
  const [teamTrack, setTeamTrack] = useState({ name: 'Awaiting Draw...', topic: 'TBD', color: 'var(--text-secondary)', teamsCount: 0 });
  const [teamData, setTeamData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [currentRoundName, setCurrentRoundName] = useState('Main Event');
  const [hasRoundStarted, setHasRoundStarted] = useState(false);
  const [problemStatement, setProblemStatement] = useState({
    title: 'Main Event Problem Statement',
    body: 'Build a specialized AI RAG (Retrieval-Augmented Generation) system based on a domain-specific dataset. The system must have mechanisms to detect and prevent hallucination, support multi-hop reasoning, and feature a user-friendly interface.',
    requirements: [
      'Use frameworks: LangGraph, OpenAI SDK, Gemini SDK, LlamaIndex, CrewAI, AutoGen, HuggingFace Agents.',
      'Dataset must be domain-specific, prepared by the team or from public sources.',
      'Include reliability evaluation mechanisms (Ragas or equivalent).',
      'Source code MUST be stored on GitHub, Jira, Confluence, or Notion (Google Drive is not allowed).',
      'Live slide presentation (Canva, Google Slides, PowerPoint Online) - PDF is not allowed.',
    ],
    releasedAt: 'TBD',
    deadline: 'TBD',
    remainingHours: '0h 0m',
    durationStr: '0h',
    promotionTopN: '--'
  });

  const [showNotification, setShowNotification] = useState(false);
  const [copied, setCopied] = useState(false);

  const tId = localStorage.getItem('p_teamId') || 'temp';
  const currentUserEmail = localStorage.getItem('userEmail') || 'User';

  const [resources, setResources] = useState(() => {
    return JSON.parse(localStorage.getItem(`ws_resources_${tId}`) || '[]');
  });
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toUpperCase();
      let typeStr = 'FILE';
      if (['PDF'].includes(ext)) typeStr = 'PDF';
      else if (['DOC', 'DOCX'].includes(ext)) typeStr = 'DOC';
      else if (['PPT', 'PPTX'].includes(ext)) typeStr = 'PPT';
      else if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(ext)) typeStr = 'IMG';
      
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      const newFile = {
        id: Date.now(),
        type: typeStr,
        name: file.name,
        meta: `${sizeMB} MB · ${currentUserEmail.split('@')[0]} (Just now)`
      };
      
      const newResources = [newFile, ...resources];
      setResources(newResources);
      localStorage.setItem(`ws_resources_${tId}`, JSON.stringify(newResources));
    }
  };

  const deleteResource = (id) => {
    const newResources = resources.filter(r => r.id !== id);
    setResources(newResources);
    localStorage.setItem(`ws_resources_${tId}`, JSON.stringify(newResources));
  };

  const handleInviteLink = () => {
    const inviteCode = localStorage.getItem('p_teamInviteCode') || `SEAL${tId}`;
    const link = `${window.location.origin}/participant/team-formation?inviteCode=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkTrackDraw = (trackDrawStr, isRealTime = false) => {
    if (trackDrawStr) {
      try {
        const parsedDraw = JSON.parse(trackDrawStr);
        const myTeamName = localStorage.getItem('myTeamName') || 'NullPointerException';
        
        // Find if my team is in any of the drawn tracks
        const myTrack = parsedDraw.find(t => t.teams && t.teams.some(teamObj => (typeof teamObj === 'string' ? teamObj : teamObj.name) === myTeamName));
        
        if (myTrack) {
          setTeamTrack({
            name: myTrack.name,
            topic: myTrack.subTopic ? myTrack.subTopic.name : 'Custom Topic',
            color: myTrack.color || 'var(--primary)',
            teamsCount: myTrack.teams ? myTrack.teams.length : 0
          });
          
          if (myTrack.subTopic) {
            setProblemStatement(prev => {
              const rName = prev.title.split(' - ')[0].replace(' Problem Statement', '').replace(' Problem', '');
              return {
                ...prev,
                title: `${rName} - ${myTrack.name} - ${myTrack.subTopic.name}`,
                body: myTrack.subTopic.description || myTrack.subTopic.desc || prev.body
              };
            });
          }
          
          if (isRealTime) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 8000);
          }
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    const eId = localStorage.getItem('p_eventId') || 1;
    
    // Initial load
    const isConfirmed = localStorage.getItem(`trackDrawConfirmed_${eId}`) === 'true';
    if (isConfirmed) {
      checkTrackDraw(localStorage.getItem(`trackDraw_${eId}`));
    }

    const tId = localStorage.getItem('p_teamId');
    if (tId && tId !== 'temp') {
      teamService.getTeamDetails(tId)
        .then(async res => {
          let tData = res.data;
          try {
            const membersRes = await teamService.getMembers(tId);
            // Only show members who are actively in the team
            tData.members = (membersRes.data || []).filter(m => m.status !== 'INVITED');
          } catch (e) {
            tData.members = [];
          }
          setTeamData(tData);
          localStorage.setItem('myTeamName', tData.name);
        })
        .catch(err => console.error(err));
    }

    teamService.getTeamDetails(tId).then(() => { // ensure teamService is loaded or just import eventService directly
      import('../../api/eventService.js').then(({ eventService }) => {
        eventService.getEvents().then(res => {
          let evt;
          if (eId) {
            evt = res.data.find(e => e.id == eId);
          }
          if (!evt && res.data.length > 0) {
            evt = res.data[0]; 
          }
          setEventData(evt);
          
          if (evt) {
            eventService.getEventRounds(evt.id).then(roundRes => {
              const rounds = roundRes.data || [];
              if (rounds.length > 0) {
                let activeRoundIdx = 0;
                let lastStartedIdx = -1;
                for (let i = rounds.length - 1; i >= 0; i--) {
                  if (rounds[i].status !== 'CREATED' && rounds[i].status?.toLowerCase() !== 'planned') {
                    lastStartedIdx = i;
                    break;
                  }
                }
                
                if (lastStartedIdx !== -1) {
                  setHasRoundStarted(true);
                } else {
                  setHasRoundStarted(false);
                }
                
                activeRoundIdx = lastStartedIdx !== -1 ? lastStartedIdx : 0;
                
                const round = rounds[activeRoundIdx] || rounds[0];
                const rName = round.name || 'Main Event';
                setCurrentRoundName(rName);

                let durationStr = '0h';
                let actualRemaining = '0h 0m';
                let calculatedEnd = null;
                if (round.startTime && round.durationHours) {
                  const startD = new Date(round.startTime);
                  calculatedEnd = new Date(startD.getTime() + round.durationHours * 3600000);
                  const now = new Date();
                  
                  durationStr = `${round.durationHours}h`;
                  
                  const remainMins = Math.floor((calculatedEnd - now) / (1000 * 60));
                  if (remainMins > 0) {
                    const h = Math.floor(remainMins / 60);
                    const m = remainMins % 60;
                    actualRemaining = m > 0 ? `${h}h ${m}m` : `${h}h`;
                  } else {
                    actualRemaining = 'Ended';
                  }
                }

                setProblemStatement(prev => {
                  const trackPart = prev.title.includes(' - ') ? prev.title.substring(prev.title.indexOf(' - ') + 3) : 'Track';
                  return {
                    ...prev,
                    title: `${rName} - ${trackPart}`,
                    releasedAt: round.startTime ? new Date(round.startTime).toLocaleString() : 'TBD',
                    deadline: calculatedEnd ? calculatedEnd.toLocaleString() : 'TBD',
                    remainingHours: actualRemaining,
                    durationStr: durationStr,
                    rawEndTime: calculatedEnd,
                    promotionTopN: round.promotionTopN
                  };
                });
              }
            }).catch(err => console.error("Failed to load rounds:", err));
          }
        }).catch(err => console.error(err));
      });
    });

    // Real-time listener
    const handleStorage = (e) => {
      const currentEId = localStorage.getItem('p_eventId') || 1;
      if (e.key === `trackDrawConfirmed_${currentEId}` && e.newValue === 'true') {
        checkTrackDraw(localStorage.getItem(`trackDraw_${currentEId}`), true);
      } else if (e.key === `trackDraw_${currentEId}` && localStorage.getItem(`trackDrawConfirmed_${currentEId}`) === 'true') {
        checkTrackDraw(e.newValue, true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  useEffect(() => {
    const updateRemaining = () => {
      setProblemStatement(prev => {
        if (!prev.rawEndTime) return prev;
        
        const endD = new Date(prev.rawEndTime);
        const now = new Date();
        const diffMs = endD - now;
        
        let newRemaining = '0h0m0s';
        if (diffMs > 0) {
          const h = Math.floor(diffMs / (1000 * 60 * 60));
          const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diffMs % (1000 * 60)) / 1000);
          newRemaining = `${h}h${m}m${s}s`;
        } else {
          newRemaining = 'Ended';
        }
        
        if (prev.remainingHours !== newRemaining) {
          return { ...prev, remainingHours: newRemaining };
        }
        return prev;
      });
    };
    
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, []);
  const [tasks, setTasks] = useState(() => {
    return JSON.parse(localStorage.getItem(`ws_tasks_${tId}`) || '[]');
  });
  const [newTask, setNewTask] = useState('');
  const [showFullProblem, setShowFullProblem] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [newChat, setNewChat] = useState('');

  const fetchChatMessages = async () => {
    if (tId && tId !== 'temp' && teamData?.mentor) {
      try {
        const res = await teamService.getMentorMessages(tId);
        if (res && res.data) {
          setChatMessages(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch chat messages:", e);
      }
    }
  };

  useEffect(() => {
    if (teamData?.mentor) {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [teamData?.mentor, tId]);

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      const newTasks = [...tasks, { id: Date.now(), text: newTask, completed: false }];
      setTasks(newTasks);
      localStorage.setItem(`ws_tasks_${tId}`, JSON.stringify(newTasks));
      setNewTask('');
    }
  };
  const toggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    localStorage.setItem(`ws_tasks_${tId}`, JSON.stringify(newTasks));
  };
  const deleteTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    localStorage.setItem(`ws_tasks_${tId}`, JSON.stringify(newTasks));
  };
  const completedCount = tasks.filter(t => t.completed).length;

  const handleSendChat = async () => {
    if (newChat.trim() && teamData?.mentor) {
      try {
        await teamService.sendMentorMessage(tId, { message: newChat.trim() });
        setNewChat('');
        fetchChatMessages();
      } catch (e) {
        console.error("Failed to send message", e);
      }
    }
  };

  return (
    <div className="workspace-container animate-fade-in">
      {teamData?.isDisqualified && (
        <div style={{ padding: '16px 24px', marginBottom: '24px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--danger)' }}>
          <AlertCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Your Team is Disqualified</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
              {teamData?.disqualificationReason
                ? `Reason: ${teamData.disqualificationReason}`
                : 'You are no longer eligible to participate. Please contact the event administrator.'}
            </p>
          </div>
        </div>
      )}
      <header className="workspace-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', 
              border: '1px solid rgba(139,92,246,0.3)',
              color: 'var(--accent-1)', 
              padding: '5px 14px', 
              borderRadius: '100px', 
              fontSize: '12px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(139,92,246,0.1)'
            }}>
              <Target size={14} /> {currentRoundName}
            </div>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-subtle)',
              border: `1px solid ${teamTrack.color}`,
              color: teamTrack.color,
              padding: '5px 14px', 
              borderRadius: '100px', 
              fontSize: '13px', 
              fontWeight: '700',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              {teamTrack.name}
            </div>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '5px 14px', 
              borderRadius: '100px', 
              fontSize: '13px', 
              fontWeight: '600'
            }}>
              <BookOpen size={14} /> {teamTrack.topic}
            </div>
          </div>
          <h1>Team: {localStorage.getItem('myTeamName') || 'NullPointerException'}</h1>
          <p className="subtitle">{eventData?.name || 'SEAL Hackathon'} — {eventData?.startDate || 'TBD'}</p>
        </div>
        <div className="workspace-actions">
          <Link to="/participant/submission" className="btn btn-primary">Go to Submission</Link>
        </div>
      </header>

      {/* Real-time Notification */}
      {showNotification && (
        <div className="animate-fade-in" style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
          color: 'white', padding: '16px 24px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', gap: '12px',
          border: '1px solid var(--bg-active)'
        }}>
          <AlertTriangle size={24} color="white" />
          <div>
            <h4 style={{ margin: 0, fontSize: '15px' }}>Track draw results are out!</h4>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>Your team has been assigned to <strong>{teamTrack.name}</strong> with topic <strong>{teamTrack.topic}</strong></p>
          </div>
        </div>
      )}

      <div className="workspace-grid">
        {/* Left Column */}
        <div className="ws-col-left">

          {/* 🔴 Problem Statement Widget */}
          {PROBLEM_RELEASED && (teamTrack.name !== 'Awaiting Draw...' || hasRoundStarted) && (
            <div className="glass-panel ws-panel" style={{ background: '#FFFFFF', border: '1px solid rgba(245,158,11,0.35)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--warning), var(--danger))' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)' }}>LIVE</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Released at {problemStatement.releasedAt}</span>
                  </div>
                  <h3 className="panel-title" style={{ color: 'var(--warning)', fontSize: '14px' }}>📋 {problemStatement.title}</h3>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>{problemStatement.remainingHours}</div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '12px', display: showFullProblem ? 'block' : '-webkit-box', WebkitLineClamp: showFullProblem ? 'unset' : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {problemStatement.body}
              </div>

              {showFullProblem && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Requirements</div>
                  {problemStatement.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.5' }}>
                      <span style={{ color: 'var(--warning)', fontWeight: '700', flexShrink: 0 }}>•</span> {req}
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--danger)', display: 'flex', gap: '8px' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    Submission Deadline: <strong>{problemStatement.deadline}</strong>
                  </div>
                </div>
              )}

              <button onClick={() => setShowFullProblem(!showFullProblem)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', gap: '4px', width: '100%', justifyContent: 'center', background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--warning)' }}>
                <BookOpen size={14} /> {showFullProblem ? 'Show less' : 'View full details'}
              </button>
            </div>
          )}

          {/* Track Info */}
          {teamTrack.name !== 'Awaiting Draw...' ? (
            <div className="glass-panel ws-panel" style={{ background: '#FFFFFF', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="panel-header" style={{ marginBottom: '12px' }}>
                <h3 className="panel-title" style={{ color: 'var(--accent-1)' }}>{teamTrack.name} — Leaderboard</h3>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-1)' }}>{teamTrack.teamsCount > 0 ? teamTrack.teamsCount : '--'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Teams / Track</div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>{problemStatement.promotionTopN || '--'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>To Final Round</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>Topic:</strong> {teamTrack.topic}
              </p>
            </div>
          ) : (
            <div className="glass-panel ws-panel" style={{ background: hasRoundStarted ? 'rgba(16,185,129,0.05)' : 'rgba(139,92,246,0.05)', border: `1px dashed ${hasRoundStarted ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
              <Clock size={32} color={hasRoundStarted ? 'var(--success)' : 'var(--accent-1)'} style={{ marginBottom: '12px', opacity: 0.7 }} />
              <h3 style={{ fontSize: '15px', color: hasRoundStarted ? 'var(--success)' : 'var(--accent-1)', marginBottom: '8px' }}>
                {hasRoundStarted ? 'Round In Progress — Awaiting Track Draw' : 'Waiting for Track Draw'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {hasRoundStarted 
                  ? 'The round is live! Your track assignment and leaderboard will appear here once the Admin conducts the track draw.' 
                  : 'Your Problem Statement and Leaderboard will appear here once the Admin conducts the track draw.'}
              </p>
            </div>
          )}


          {/* Members */}
          <div className="glass-panel ws-panel">
            <div className="panel-header">
              <h3 className="panel-title"><Users size={18} /> Team Members ({(teamData && teamData.members) ? teamData.members.length : 0}/5)</h3>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '6px' }}>Code: <strong style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>{localStorage.getItem('p_teamInviteCode') || `SEAL${tId}`}</strong></span>
                <button 
                  onClick={() => navigate('/participant/team-management')}
                  style={{ fontSize: '13px', color: 'var(--primary)', padding: 0, background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <UserPlus size={14} style={{ marginRight: '4px' }}/> Manage / Invite
                </button>
              </div>
            </div>
            <div className="member-list">
              {(teamData && teamData.members && teamData.members.length > 0) ? teamData.members.map((m, idx) => (
                <div key={idx} className="member-item">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {(m.name || m.accountName) ? (m.name || m.accountName).charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{m.name || m.accountName || 'Unknown'} {m.email === localStorage.getItem('userEmail') ? '(You)' : ''}</span>
                    <span className="member-role">{m.role || 'Member'}</span>
                  </div>
                </div>
              )) : teamData ? (
                <div style={{ padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>No members found.</div>
              ) : (
                <div style={{ padding: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>Loading members...</div>
              )}
            </div>
          </div>

          {/* Shared Files */}
          <div className="glass-panel ws-panel">
            <div className="panel-header">
              <h3 className="panel-title"><FileText size={18} /> Resources</h3>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
              <button className="btn btn-text btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Upload</button>
            </div>
            <div className="file-list">
              {resources.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', textAlign: 'center' }}>No resources uploaded yet.</p>}
              {resources.map(f => (
                <div key={f.id} className="file-item">
                  <div className={`file-icon ${f.type === 'PDF' ? 'pdf' : f.type === 'URL' ? 'link' : 'doc'}`}>{f.type}</div>
                  <div className="file-info">
                    <span className="file-name">{f.name}</span>
                    <span className="file-meta">{f.meta}</span>
                  </div>
                  <button className="btn-icon" onClick={() => deleteResource(f.id)} title="Delete file"><X size={16} color="var(--danger)" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Tasks */}
        <div className="ws-col-mid">
          <div className="glass-panel ws-panel" style={{ height: '100%' }}>
            <div className="panel-header">
              <h3 className="panel-title"><CheckSquare size={18} /> Tasks ({completedCount}/{tasks.length})</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {Math.round((completedCount / tasks.length) * 100)}% done
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ margin: '0 0 16px 0', height: '4px', background: 'var(--bg-active)', borderRadius: '2px' }}>
              <div style={{ width: `${(completedCount / tasks.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--success))', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
            <div className="task-input-container">
              <input type="text" className="task-input" placeholder="Add a task and press Enter..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={handleAddTask} />
            </div>
            <div className="task-list">
              {tasks.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', textAlign: 'center' }}>No tasks added yet.</p>}
              {tasks.map(task => (
                <div className={`task-item ${task.completed ? 'completed' : ''}`} key={task.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="checkbox" onClick={() => toggleTask(task.id)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                    {task.completed && <CheckSquare size={14} color="#fff" />}
                  </div>
                  <span className="task-text" onClick={() => toggleTask(task.id)} style={{ flexGrow: 1, cursor: 'pointer' }}>{task.text}</span>
                  <button className="btn-icon" onClick={() => deleteTask(task.id)} title="Delete task" style={{ padding: '4px' }}><X size={14} color="var(--text-secondary)"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="ws-col-right">
          <div className="glass-panel ws-panel chat-panel">
            <div className="panel-header">
              <h3 className="panel-title"><MessageSquare size={18} /> Mentor Chat</h3>
            </div>
            {!teamData?.mentor ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', lineHeight: '1.5' }}>Your team hasn't been assigned a Mentor yet.</p>
                <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>Once assigned, you can chat with them here.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '8px 16px', background: 'rgba(20,184,166,0.1)', borderBottom: '1px solid rgba(20,184,166,0.2)', fontSize: '13px', color: 'var(--accent-3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={14} /> Assigned Mentor: <strong>{teamData.mentor.name || teamData.mentor.email}</strong>
                </div>
                <div className="chat-messages" style={{ overflowY: 'auto' }}>
                  {chatMessages.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', textAlign: 'center' }}>No messages yet. Say hi to your mentor!</p>}
                  {chatMessages.map(msg => {
                    const isMine = msg.senderId === parseInt(localStorage.getItem('userId') || '0');
                    return (
                      <div key={msg.id} className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                        {!isMine && <span className="chat-sender" style={{ color: msg.senderRole === 'STUDENT' ? 'var(--primary)' : 'var(--accent-3)' }}>{msg.senderName} ({msg.senderRole === 'STUDENT' ? 'Student' : 'Lecturer'})</span>}
                        <p>{msg.message}</p>
                        <span className="chat-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="chat-input-area">
                  <input type="text" placeholder="Type a message to your mentor..." className="chat-input" value={newChat} onChange={e => setNewChat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
                  <button className="btn-send" onClick={handleSendChat}><Send size={16} /></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
