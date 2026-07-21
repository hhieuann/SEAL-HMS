import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare } from 'lucide-react';
import { teamService } from '../../api/teamService';

const MentorChat = () => {
  const [teams, setTeams] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  
  const ctx = JSON.parse(localStorage.getItem('expertContext') || '{}');
  const eventId = ctx.eventId || localStorage.getItem('p_eventId') || 1;
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getTeamsByEvent(eventId);
        const allTeams = res.data || [];
        
        let allTracks = [];
        try {
          const { trackService } = await import('../../api/trackService.js');
          allTracks = (await trackService.getTracksByEvent(eventId))?.data || [];
        } catch (err) {}
        setTracks(allTracks);

        // Filter teams mentored by current user
        const mentoredTeams = allTeams.filter(t => t.mentor && t.mentor.email === userEmail && t.status !== 'ELIMINATED' && t.status !== 'DISQUALIFIED');
        setTeams(mentoredTeams);
        if (mentoredTeams.length > 0 && !activeTeamId) {
          setActiveTeamId(mentoredTeams[0].id);
        }
      } catch (e) {
        console.error("Failed to fetch teams", e);
      }
    };
    fetchTeams();
  }, [eventId, userEmail]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (activeTeamId) {
        try {
          const res = await teamService.getMentorMessages(activeTeamId);
          setMessages(res.data || []);
        } catch (e) {
          console.error("Failed to fetch messages", e);
        }
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [activeTeamId]);

  const activeTeam = teams.find(t => t.id === activeTeamId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeTeamId) return;
    try {
      await teamService.sendMentorMessage(activeTeamId, { message: reply.trim() });
      setReply('');
      const res = await teamService.getMentorMessages(activeTeamId);
      setMessages(res.data || []);
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: '100%', minHeight: '600px' }}>
      {/* Left: Team List */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} /> Mentored Teams</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {teams.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              You are not assigned to any teams for this event.
            </div>
          ) : (
            teams.map(team => (
              <div 
                key={team.id} 
                onClick={() => setActiveTeamId(team.id)} 
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid var(--border-color)', 
                  cursor: 'pointer', 
                  background: activeTeamId === team.id ? 'var(--bg-subtle)' : 'transparent', 
                  borderLeft: `3px solid ${activeTeamId === team.id ? 'var(--accent-3)' : 'transparent'}`, 
                  transition: 'var(--transition)' 
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{team.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Track: {tracks.find(tr => tr.id === team.trackId)?.name || team.trackId || 'Any'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat Thread */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTeam ? (
          <>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} /> Team {activeTeam.name}
              </h3>
            </div>

            {/* Messages */}
            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '40px' }}>
                  No messages yet. Send a message to start chatting!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === parseInt(localStorage.getItem('userId') || '0');
                  return (
                    <div key={msg.id} className={`chat-bubble ${isMine ? 'sent' : 'received'}`} style={{ maxWidth: '70%', ...(isMine ? {} : { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }) }}>
                      {!isMine && <span className="chat-sender" style={{ color: 'var(--primary)' }}>{msg.senderName} ({msg.senderRole === 'STUDENT' ? 'Student' : 'Lecturer'})</span>}
                      <p>{msg.message}</p>
                      <span className="chat-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Box */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder="Type your message to the team..."
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-3)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-3), #0d9488)', boxShadow: '0 4px 15px rgba(20,184,166,0.3)', height: '46px', display: 'flex', alignItems: 'center' }}>
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Select a team to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorChat;
