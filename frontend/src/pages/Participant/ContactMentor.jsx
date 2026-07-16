import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, RefreshCw, UserX, Users } from 'lucide-react';
import { teamService } from '../../api/teamService';
import './Workspace.css';

// Real mentor chat: mentor info comes from the team (assigned by staff) and the
// conversation is persisted through /api/v1/teams/{id}/messages — no mock data.
const ContactMentor = () => {
  const teamId = localStorage.getItem('p_teamId');
  const myAccountId = Number(localStorage.getItem('accountId') || localStorage.getItem('userId') || 0);

  const [mentor, setMentor] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadAll = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    try {
      setError('');
      const [teamRes, msgRes] = await Promise.all([
        teamService.getTeamDetails(teamId),
        teamService.getMentorMessages(teamId),
      ]);
      setMentor(teamRes.data?.mentor || null);
      setTeamName(teamRes.data?.name || '');
      setMessages(msgRes.data || []);
    } catch (err) {
      console.error('Failed to load mentor chat', err);
      setError(err.response?.data?.message || 'Failed to load mentor conversation.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await teamService.sendMentorMessage(teamId, { message: text });
      setMessages(prev => [...prev, res.data]);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const EmptyState = ({ icon, title, subtitle }) => (
    <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {icon}
      <h3 style={{ fontSize: '18px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '420px' }}>{subtitle}</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Mentor Support</h1>
            <p className="subtitle">Chat with the mentor assigned to your team{teamName ? ` — ${teamName}` : ''}.</p>
          </div>
          <button className="btn btn-secondary" onClick={loadAll} title="Refresh conversation"><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      {!teamId ? (
        <EmptyState icon={<Users size={40} color="var(--text-secondary)" />} title="You are not in a team yet"
          subtitle="Join or create a team first. Once staff assigns a mentor to your team, you can chat with them here." />
      ) : loading ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading conversation…</div>
      ) : !mentor ? (
        <EmptyState icon={<UserX size={40} color="var(--text-secondary)" />} title="No mentor assigned yet"
          subtitle="Your team has not been assigned a mentor. The organizers assign mentors after track allocation — check back later." />
      ) : (
        <div className="glass-panel chat-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Mentor: {mentor.name}</h2>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{mentor.email}</div>
            </div>
            <MessageSquare size={20} color="var(--primary)" />
          </div>

          <div className="chat-messages" style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && <div style={{ color: 'var(--danger, #ef4444)', fontSize: '13px' }}>{error}</div>}
            {messages.length === 0 && !error && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                No messages yet. Say hello to your mentor!
              </p>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === myAccountId;
              return (
                <div key={msg.id} className={`chat-bubble ${isMine ? 'sent' : 'received'}`}
                  style={{ maxWidth: '75%', ...(isMine ? {} : { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }) }}>
                  <span className="chat-sender" style={{ color: isMine ? 'white' : 'var(--primary)', opacity: isMine ? 0.8 : 1 }}>
                    {isMine ? `${msg.senderName} (You)` : `${msg.senderName}${msg.senderRole ? ` · ${msg.senderRole}` : ''}`}
                  </span>
                  <p>{msg.message}</p>
                  <span className="chat-time">{formatTime(msg.createdAt)}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
            <form onSubmit={handleSend}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <input type="text" placeholder={`Message ${mentor.name}…`} value={message} onChange={(e) => setMessage(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '8px 12px', outline: 'none', fontSize: '14px' }} />
                <button type="submit" className="btn-send" disabled={sending}><Send size={18} /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMentor;
