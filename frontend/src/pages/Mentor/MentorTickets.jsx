import React, { useState, useRef } from 'react';
import { CheckCircle, Clock, AlertTriangle, Send, Search, Paperclip, X, FileText, Image, Plus, AlertCircle } from 'lucide-react';

const FileChip = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', maxWidth: '180px' }}>
      {isImage ? <Image size={13} color="var(--accent-3)" /> : <FileText size={13} color="var(--accent-3)" />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
      {onRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex' }}><X size={12} /></button>}
    </div>
  );
};

const AttachedFilesDisplay = ({ files }) => {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
      {files.map((f, i) => <FileChip key={i} file={f} />)}
    </div>
  );
};

const MentorTickets = () => {
  const [activeTicket, setActiveTicket] = useState(0);
  const [reply, setReply] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ team: '', title: '', body: '', priority: 'medium' });
  const [createError, setCreateError] = useState('');
  const [createShaking, setCreateShaking] = useState(false);
  const [createToast, setCreateToast] = useState(false);

  const tickets = [
    {
      id: 0,
      team: 'NullPointerException',
      member: 'John Doe',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=8b5cf6&color=fff',
      title: 'Database connection issue with MongoDB',
      category: 'Technical',
      status: 'open',
      time: '10 mins ago',
      priority: 'high',
      messages: [
        { from: 'student', name: 'John Doe', text: 'Hi Mentor, we are trying to connect our Express backend to MongoDB Atlas but keep getting a "IP not whitelisted" error even though we allowed access from anywhere (0.0.0.0/0). Can you help?', time: '10:15 AM' },
      ]
    },
    {
      id: 1,
      team: 'ByteStrike',
      member: 'Alice Tran',
      avatar: 'https://ui-avatars.com/api/?name=Alice+Tran&background=3b82f6&color=fff',
      title: 'Can we use a third-party design library?',
      category: 'Rules',
      status: 'open',
      time: '32 mins ago',
      priority: 'medium',
      messages: [
        { from: 'student', name: 'Alice Tran', text: 'Hi! Our team wants to use shadcn/ui for the frontend components. Is this allowed under the hackathon rules or is it considered a pre-built solution?', time: '09:55 AM' },
      ]
    },
    {
      id: 2,
      team: 'DeepMind Innovators',
      member: 'Bob Chen',
      avatar: 'https://ui-avatars.com/api/?name=Bob+Chen&background=10b981&color=fff',
      title: 'How to deploy backend to AWS Lambda?',
      category: 'Technical',
      status: 'resolved',
      time: '1 day ago',
      priority: 'low',
      messages: [
        { from: 'student', name: 'Bob Chen', text: 'Our team wants to deploy our FastAPI backend to AWS Lambda. What is the easiest way to do this for a hackathon?', time: 'Yesterday' },
        { from: 'mentor', name: 'Mentor Sarah', text: 'Hi Bob! I recommend using the Mangum adapter for FastAPI + Lambda. You can deploy with the Serverless Framework or AWS SAM. For a hackathon, Railway.app or Render.com are actually much faster options with zero config!', time: 'Yesterday' },
      ]
    },
  ];

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const active = tickets[activeTicket];

  const handleSend = (e) => {
    e.preventDefault();
    if (!reply.trim() && attachedFiles.length === 0) return;
    active.messages.push({ from: 'mentor', name: 'Mentor Sarah', text: reply, time: 'Just now', files: attachedFiles });
    setReply('');
    setAttachedFiles([]);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const handleCreateTicket = () => {
    setCreateError('');
    if (!createForm.team.trim()) {
      setCreateError('Please enter the team name.');
      setCreateShaking(true); setTimeout(() => setCreateShaking(false), 500); return;
    }
    if (!createForm.title.trim()) {
      setCreateError('Please enter a ticket title.');
      setCreateShaking(true); setTimeout(() => setCreateShaking(false), 500); return;
    }
    if (!createForm.body.trim()) {
      setCreateError('Please enter a note or message for this ticket.');
      setCreateShaking(true); setTimeout(() => setCreateShaking(false), 500); return;
    }
    setShowCreate(false);
    setCreateForm({ team: '', title: '', body: '', priority: 'medium' });
    setCreateToast(true);
    setTimeout(() => setCreateToast(false), 3000);
  };

  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', height: '100%' }}>
      {/* Left: Ticket List */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Support Tickets</h3>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }}>
              <Plus size={14} /> New Ticket
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
            <Search size={15} color="var(--text-secondary)" />
            <input type="text" placeholder="Search team, title..." style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'open', 'resolved'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '12px', border: `1px solid ${filter === f ? 'var(--accent-3)' : 'var(--border-color)'}`, background: filter === f ? 'rgba(20,184,166,0.1)' : 'transparent', color: filter === f ? 'var(--accent-3)' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f} {f === 'all' ? `(${tickets.length})` : `(${tickets.filter(t => t.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((ticket) => (
            <div key={ticket.id} onClick={() => setActiveTicket(ticket.id)} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: activeTicket === ticket.id ? 'var(--bg-subtle)' : 'transparent', borderLeft: `3px solid ${activeTicket === ticket.id ? 'var(--accent-3)' : 'transparent'}`, transition: 'var(--transition)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={ticket.avatar} alt={ticket.member} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{ticket.team}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ticket.member}</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ticket.time}</span>
              </div>
              <p style={{ fontSize: '13px', marginBottom: '10px', lineHeight: '1.4' }}>{ticket.title}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: '8px', color: 'var(--text-secondary)' }}>{ticket.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor[ticket.priority] }}></div>
                  {ticket.status === 'open'
                    ? <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Open</span>
                    : <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Resolved</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Ticket Thread */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img src={active.avatar} alt={active.member} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div>
                <h3 style={{ fontSize: '16px' }}>{active.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  From <strong>{active.member}</strong> — Team {active.team} • {active.category}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: priorityColor[active.priority], background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor[active.priority] }}></div>
              {active.priority.charAt(0).toUpperCase() + active.priority.slice(1)} Priority
            </div>
            {active.status === 'open' ? (
              <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}><CheckCircle size={14} /> Mark Resolved</button>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Resolved</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {active.messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.from === 'mentor' ? 'sent' : 'received'}`} style={{ maxWidth: '70%', ...(msg.from === 'mentor' ? {} : { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }) }}>
              <span className="chat-sender" style={{ color: msg.from === 'mentor' ? 'var(--accent-3)' : 'var(--primary)' }}>{msg.name}</span>
              <p>{msg.text}</p>
              <AttachedFilesDisplay files={msg.files} />
              <span className="chat-time">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {active.status === 'open' ? (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)' }}>
            {attachedFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                {attachedFiles.map((f, i) => <FileChip key={i} file={f} onRemove={() => removeFile(i)} />)}
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple style={{ display: 'none' }} />
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply to the student..."
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 44px 12px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-3)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button type="button" onClick={() => fileInputRef.current.click()} title="Attach files"
                  style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: attachedFiles.length > 0 ? 'var(--accent-3)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <Paperclip size={18} />
                  {attachedFiles.length > 0 && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--accent-3)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{attachedFiles.length}</span>
                  )}
                </button>
              </div>
              <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-3), #0d9488)', boxShadow: '0 4px 15px rgba(20,184,166,0.3)' }}>
                <Send size={16} /> Reply
              </button>
            </form>
          </div>
        ) : (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            This ticket has been resolved. <button className="btn-text" style={{ fontSize: '13px', display: 'inline' }}>Reopen</button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '32px', border: '1px solid rgba(20,184,166,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Create Mentor Ticket</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={20} /></button>
            </div>

            {createError && (
              <div className={createShaking ? 'shake' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', marginBottom: '16px', animation: createShaking ? 'shake 0.4s ease-in-out' : 'none' }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{createError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Team Name *</label>
                <input value={createForm.team} onChange={e => { setCreateForm(f => ({ ...f, team: e.target.value })); setCreateError(''); }}
                  placeholder="e.g. NullPointerException"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${createError && !createForm.team.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ticket Title *</label>
                <input value={createForm.title} onChange={e => { setCreateForm(f => ({ ...f, title: e.target.value })); setCreateError(''); }}
                  placeholder="e.g. Proactive check-in: deployment guidance"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${createError && !createForm.title.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Priority</label>
                  <select value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Category</label>
                  <select style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                    {['Technical', 'General', 'Logistics'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Note / Message *</label>
                <textarea value={createForm.body} onChange={e => { setCreateForm(f => ({ ...f, body: e.target.value })); setCreateError(''); }}
                  placeholder="Describe the issue or write a proactive message to the team..."
                  rows={4}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${createError && !createForm.body.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '12px 14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleCreateTicket} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-3), var(--primary))' }}>
                <Plus size={16} /> Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {createToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={18} color="var(--accent-3)" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Ticket Created!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>The team will be notified of your message.</div>
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

export default MentorTickets;
