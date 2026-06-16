import React, { useState, useRef } from 'react';
import { MessageSquare, Plus, Search, CheckCircle, Clock, Send, MoreVertical, Paperclip, X, FileText, Image } from 'lucide-react';
import './Workspace.css';

const FileChip = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', maxWidth: '180px' }}>
      {isImage ? <Image size={13} color="var(--primary)" /> : <FileText size={13} color="var(--primary)" />}
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

const ContactMentor = () => {
  const [activeTicket, setActiveTicket] = useState(1);
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [messages, setMessages] = useState([
    { from: 'sent', sender: 'John Doe (You)', text: 'Hi Mentor, we are trying to connect our Express backend to MongoDB Atlas but keep getting a "IP not whitelisted" error even though we allowed access from anywhere (0.0.0.0/0). Can you help?', time: 'Today, 10:15 AM', files: [] },
    { from: 'received', sender: 'Mentor David', text: 'Hello John! This is a common issue with MongoDB Atlas. Have you checked if your campus WiFi/Network is blocking outbound connections on port 27017? Also, make sure you clicked "Confirm" after adding the IP address in the Atlas Network Access panel.', time: 'Today, 10:25 AM', files: [] },
  ]);
  const fileInputRef = useRef(null);

  const tickets = [
    { id: 1, title: 'Database connection issue with MongoDB', status: 'open', lastUpdated: '10 mins ago', category: 'Technical' },
    { id: 2, title: 'Clarification on AI Track scoring', status: 'resolved', lastUpdated: '1 day ago', category: 'Rules' },
    { id: 3, title: 'How to deploy backend to AWS?', status: 'open', lastUpdated: '2 hours ago', category: 'Technical' }
  ];

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() && attachedFiles.length === 0) return;
    setMessages(prev => [...prev, {
      from: 'sent',
      sender: 'John Doe (You)',
      text: message,
      time: 'Just now',
      files: attachedFiles
    }]);
    setMessage('');
    setAttachedFiles([]);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Mentor Support</h1>
            <p className="subtitle">Create tickets to ask mentors for technical help or rule clarifications.</p>
          </div>
          <button className="btn btn-primary"><Plus size={18} /> New Ticket</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Left Col: Ticket List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input type="text" placeholder="Search tickets..." style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '12px', padding: '4px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderRadius: '12px', cursor: 'pointer' }}>All (3)</span>
              <span style={{ fontSize: '12px', padding: '4px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '12px', cursor: 'pointer' }}>Open (2)</span>
              <span style={{ fontSize: '12px', padding: '4px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '12px', cursor: 'pointer' }}>Resolved (1)</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tickets.map(ticket => (
              <div key={ticket.id} onClick={() => setActiveTicket(ticket.id)}
                style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: activeTicket === ticket.id ? 'var(--bg-hover)' : 'transparent', borderLeft: activeTicket === ticket.id ? '3px solid var(--primary)' : '3px solid transparent', transition: 'var(--transition)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ticket.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ticket.lastUpdated}</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '500', marginBottom: '12px', lineHeight: '1.4' }}>{ticket.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {ticket.status === 'open'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--warning)' }}><Clock size={14} /> Open</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--success)' }}><CheckCircle size={14} /> Resolved</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Ticket Thread */}
        <div className="glass-panel chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Database connection issue with MongoDB</h2>
              <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>Ticket #1042</span><span>•</span>
                <span>Assigned to: <strong>Mentor David</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary">Mark as Resolved</button>
              <button className="btn-icon" style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px' }}><MoreVertical size={16} /></button>
            </div>
          </div>

          <div className="chat-messages" style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.from}`} style={{ maxWidth: '75%', ...(msg.from === 'received' ? { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' } : {}) }}>
                <span className="chat-sender" style={{ color: msg.from === 'received' ? 'var(--primary)' : 'white', opacity: msg.from === 'sent' ? 0.8 : 1 }}>{msg.sender}</span>
                {msg.text && <p>{msg.text}</p>}
                <AttachedFilesDisplay files={msg.files} />
                <span className="chat-time">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            {/* File preview strip */}
            {attachedFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', padding: '12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                {attachedFiles.map((f, i) => <FileChip key={i} file={f} onRemove={() => removeFile(i)} />)}
              </div>
            )}
            <form onSubmit={handleSend}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple style={{ display: 'none' }} />
                <button type="button" onClick={() => fileInputRef.current.click()} title="Attach files"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: attachedFiles.length > 0 ? 'var(--primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Paperclip size={20} />
                  {attachedFiles.length > 0 && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--primary)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {attachedFiles.length}
                    </span>
                  )}
                </button>
                <input type="text" placeholder="Reply to Mentor David..." value={message} onChange={(e) => setMessage(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px 12px', outline: 'none', fontSize: '14px' }} />
                <button type="submit" className="btn-send"><Send size={18} /></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactMentor;
