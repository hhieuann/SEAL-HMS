import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckSquare, MessageSquare, Plus, Upload, MoreVertical, Send, Clock, BookOpen, ExternalLink, AlertTriangle, Check } from 'lucide-react';
import './Workspace.css';

// Simulate: problem statement released after 07:00 Day 2
const PROBLEM_RELEASED = true;

const Workspace = () => {
  const [teamTrack, setTeamTrack] = useState({ name: 'Awaiting Draw...', topic: 'TBD', color: 'var(--text-secondary)' });
  const [problemStatement, setProblemStatement] = useState({
    title: 'Qualifying Round Problem Statement',
    body: 'Build a specialized AI RAG (Retrieval-Augmented Generation) system based on a domain-specific dataset. The system must have mechanisms to detect and prevent hallucination, support multi-hop reasoning, and feature a user-friendly interface.',
    requirements: [
      'Use frameworks: LangGraph, OpenAI SDK, Gemini SDK, LlamaIndex, CrewAI, AutoGen, HuggingFace Agents.',
      'Dataset must be domain-specific, prepared by the team or from public sources.',
      'Include reliability evaluation mechanisms (Ragas or equivalent).',
      'Source code MUST be stored on GitHub, Jira, Confluence, or Notion (Google Drive is not allowed).',
      'Live slide presentation (Canva, Google Slides, PowerPoint Online) - PDF is not allowed.',
    ],
    releasedAt: '12/04/2026 - 07:00',
    deadline: '12/04/2026 - 14:00',
    remainingHours: '5h 23m',
  });

  const [showNotification, setShowNotification] = useState(false);
  const [copied, setCopied] = useState(false);

  const [resources, setResources] = useState([
    { type: 'PDF', name: 'SEAL_SP26_Rules.pdf', meta: 'Uploaded by Admin' },
    { type: 'URL', name: 'PubMed Dataset Links', meta: 'External · Shared by John' },
    { type: 'PPT', name: 'Pitch_Deck_Draft.pptx', meta: '4.5 MB · Alice' },
  ]);
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
        type: typeStr,
        name: file.name,
        meta: `${sizeMB} MB · You (Just now)`
      };
      
      setResources(prev => [newFile, ...prev]);
    }
  };

  const handleInviteLink = () => {
    const inviteCode = localStorage.getItem('p_teamInviteCode') || '123456';
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
            color: myTrack.color || 'var(--primary)'
          });
          
          if (myTrack.subTopic) {
            setProblemStatement(prev => ({
              ...prev,
              title: `Qualifying Round Problem Statement — ${myTrack.name}`,
              body: myTrack.subTopic.desc || prev.body
            }));
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

    // Real-time listener
    const handleStorage = (e) => {
      if (e.key === 'trackDraw') {
        checkTrackDraw(e.newValue, true);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Setup GitHub Repository + project structure', completed: true },
    { id: 2, text: 'Prepare dataset (Domain specific)', completed: true },
    { id: 3, text: 'Build RAG pipeline', completed: false },
    { id: 4, text: 'Integrate Ragas for hallucination evaluation', completed: false },
    { id: 5, text: 'Build user interface', completed: false },
    { id: 6, text: 'Prepare presentation slides (Canva/Google Slides)', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const [showFullProblem, setShowFullProblem] = useState(false);

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="workspace-container animate-fade-in">
      <header className="workspace-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="track-badge" style={{ background: 'var(--bg-active)', color: teamTrack.color, border: `1px solid ${teamTrack.color}` }}>
              {teamTrack.name}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '3px 10px', borderRadius: '20px', border: '1px solid var(--bg-active)', color: 'white' }}>
              📋 {teamTrack.topic}
            </span>
          </div>
          <h1>Team: {localStorage.getItem('myTeamName') || 'NullPointerException'}</h1>
          <p className="subtitle">SEAL Hackathon Spring 2026 — 12/04/2026</p>
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
          {PROBLEM_RELEASED && (
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
          <div className="glass-panel ws-panel" style={{ background: '#FFFFFF', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="panel-header" style={{ marginBottom: '12px' }}>
              <h3 className="panel-title" style={{ color: 'var(--accent-1)' }}>Track B — Leaderboard</h3>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-1)' }}>8</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Teams / Track</div>
              </div>
              <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>2</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>To Final Round</div>
              </div>
              <div style={{ flex: 1, padding: '10px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--warning)' }}>7h</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code</div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong>Topic:</strong> Medical Knowledge RAG System — Build a specialized medical knowledge retrieval system.
            </p>
          </div>

          {/* Members */}
          <div className="glass-panel ws-panel">
            <div className="panel-header">
              <h3 className="panel-title"><Users size={18} /> Team Members (3/5)</h3>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px', border: '1px dashed var(--border-color)' }}>
                  Code: <strong style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>{localStorage.getItem('p_teamInviteCode') || 'A1B2C3'}</strong>
                </span>
                <button className="btn btn-text btn-sm" onClick={handleInviteLink}>
                  {copied ? <Check size={16} /> : <Plus size={16} />} {copied ? 'Copied Link!' : 'Invite'}
                </button>
              </div>
            </div>
            <div className="member-list">
              {[
                { name: 'John Doe (You)', role: 'Team Leader', color: '8b5cf6' },
                { name: 'Alice Smith', role: 'AI Engineer', color: '3b82f6' },
                { name: 'Bob Chen', role: 'Backend Developer', color: '10b981' },
              ].map(m => (
                <div key={m.name} className="member-item">
                  <img src={`https://ui-avatars.com/api/?name=${m.name.split(' ')[0]}+${m.name.split(' ')[1]}&background=${m.color}&color=fff`} alt={m.name} className="avatar-sm" />
                  <div className="member-info">
                    <span className="member-name">{m.name}</span>
                    <span className="member-role">{m.role}</span>
                  </div>
                </div>
              ))}
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
              {resources.map(f => (
                <div key={f.name} className="file-item">
                  <div className={`file-icon ${f.type === 'PDF' ? 'pdf' : f.type === 'URL' ? 'link' : 'doc'}`}>{f.type}</div>
                  <div className="file-info">
                    <span className="file-name">{f.name}</span>
                    <span className="file-meta">{f.meta}</span>
                  </div>
                  <button className="btn-icon"><MoreVertical size={16} /></button>
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
              {tasks.map(task => (
                <div className={`task-item ${task.completed ? 'completed' : ''}`} key={task.id} onClick={() => toggleTask(task.id)}>
                  <div className="checkbox">{task.completed && <CheckSquare size={14} color="#fff" />}</div>
                  <span className="task-text">{task.text}</span>
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
            <div className="chat-messages">
              <div className="chat-bubble received">
                <span className="chat-sender">Mentor Sarah</span>
                <p>Hi team! I'm here to support you with LangGraph and RAG pipelines. Ping me anytime you need help!</p>
                <span className="chat-time">07:15 AM</span>
              </div>
              <div className="chat-bubble sent">
                <p>Thanks Mentor Sarah! We are currently setting up the pipeline, will ask about Ragas evaluation later.</p>
                <span className="chat-time">07:32 AM</span>
              </div>
              <div className="chat-bubble received">
                <span className="chat-sender">Alice Smith</span>
                <p>PubMed dataset is ready, 2,400 records in total. John is working on the retrieval module right now.</p>
                <span className="chat-time">08:10 AM</span>
              </div>
              <div className="chat-bubble sent">
                <p>Got it! I am integrating the LangGraph agent, should be done before 10 AM.</p>
                <span className="chat-time">08:15 AM</span>
              </div>
            </div>
            <div className="chat-input-area">
              <input type="text" placeholder="Type a message..." className="chat-input" />
              <button className="btn-send"><Send size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
