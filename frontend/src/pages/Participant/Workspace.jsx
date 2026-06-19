import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, UserPlus, FileText, CheckSquare, MessageSquare, Plus, Upload, MoreVertical, Send, Clock, BookOpen, ExternalLink, AlertTriangle, Check, X, Target } from 'lucide-react';
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
    durationStr: '0h'
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
        const myTrack = parsedDraw.find(t => t.teams && t.teams.includes(myTeamName));
        
        if (myTrack) {
          setTeamTrack({
            name: myTrack.name,
            topic: myTrack.subTopic ? myTrack.subTopic.name : 'Custom Topic',
            color: myTrack.color || 'var(--primary)',
            teamsCount: myTrack.teams ? myTrack.teams.length : 0
          });
          
          if (myTrack.subTopic) {
            setProblemStatement(prev => {
              const rName = prev.title.split(' Problem')[0];
              return {
                ...prev,
                title: `${rName} Problem Statement — ${myTrack.name}`,
                body: myTrack.subTopic.desc || prev.body
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
    // Initial load
    checkTrackDraw(localStorage.getItem('trackDraw'));

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

    const eId = localStorage.getItem('p_eventId');
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
                const roundIdx = parseInt(localStorage.getItem('currentRoundIndex') || '0');
                const round = rounds[roundIdx] || rounds[0];
                const rName = round.name || 'Main Event';
                setCurrentRoundName(rName);

                let durationStr = '0h';
                let diffMins = 0;
                if (round.startTime && round.endTime) {
                  const startD = new Date(round.startTime);
                  const endD = new Date(round.endTime);
                  diffMins = Math.floor((endD - startD) / (1000 * 60));
                  if (diffMins > 0) {
                    const h = Math.floor(diffMins / 60);
                    const m = diffMins % 60;
                    durationStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
                  }
                }

                setProblemStatement(prev => {
                  const trackPart = prev.title.includes(' — ') ? prev.title.split(' — ')[1] : 'Track';
                  return {
                    ...prev,
                    title: `${rName} Problem Statement — ${trackPart}`,
                    releasedAt: round.startTime ? new Date(round.startTime).toLocaleString() : 'TBD',
                    deadline: round.endTime ? new Date(round.endTime).toLocaleString() : 'TBD',
                    remainingHours: durationStr,
                    durationStr: durationStr
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
      if (e.key === 'trackDraw') {
        checkTrackDraw(e.newValue, true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [tasks, setTasks] = useState(() => {
    return JSON.parse(localStorage.getItem(`ws_tasks_${tId}`) || '[]');
  });
  const [newTask, setNewTask] = useState('');
  const [showFullProblem, setShowFullProblem] = useState(false);

  const [chatMessages, setChatMessages] = useState(() => {
    return JSON.parse(localStorage.getItem(`ws_chat_${tId}`) || '[]');
  });
  const [newChat, setNewChat] = useState('');

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

  const handleSendChat = () => {
    if (newChat.trim()) {
      const msg = {
        id: Date.now(),
        sender: currentUserEmail.split('@')[0],
        text: newChat.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true
      };
      const newMsgs = [...chatMessages, msg];
      setChatMessages(newMsgs);
      localStorage.setItem(`ws_chat_${tId}`, JSON.stringify(newMsgs));
      setNewChat('');
    }
  };

  return (
    <div className="workspace-container animate-fade-in">
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
          {PROBLEM_RELEASED && teamTrack.name !== 'Awaiting Draw...' && (
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
                    Submission Deadline: <strong>{PROBLEM_STATEMENT.deadline}</strong>
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
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>2</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>To Final Round</div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning)' }}>{problemStatement.durationStr || '7h'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <strong>Topic:</strong> {teamTrack.topic}
              </p>
            </div>
          ) : (
            <div className="glass-panel ws-panel" style={{ background: 'rgba(139,92,246,0.05)', border: '1px dashed rgba(139,92,246,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
              <Clock size={32} color="var(--accent-1)" style={{ marginBottom: '12px', opacity: 0.7 }} />
              <h3 style={{ fontSize: '15px', color: 'var(--accent-1)', marginBottom: '8px' }}>Waiting for Track Draw</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>Your Problem Statement and Leaderboard will appear here once the Admin conducts the track draw.</p>
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
                    <span className="member-name">{m.name || m.accountName || 'Unknown'} {(m.name || m.accountName) === localStorage.getItem('userEmail') ? '(You)' : ''}</span>
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
              <h3 className="panel-title"><MessageSquare size={18} /> Team Chat</h3>
            </div>
            <div className="chat-messages" style={{ overflowY: 'auto' }}>
              {chatMessages.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', textAlign: 'center' }}>No messages yet. Start chatting!</p>}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`chat-bubble ${msg.isMine ? 'sent' : 'received'}`}>
                  {!msg.isMine && <span className="chat-sender">{msg.sender}</span>}
                  <p>{msg.text}</p>
                  <span className="chat-time">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <input type="text" placeholder="Type a message..." className="chat-input" value={newChat} onChange={e => setNewChat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} />
              <button className="btn-send" onClick={handleSendChat}><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
