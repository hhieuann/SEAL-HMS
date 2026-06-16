import React, { useState } from 'react';
import { Megaphone, Plus, Send, Users, Tag, Pin, PinOff, Trash2, Eye, Globe, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

const initialPosts = [
  {
    id: 1, title: 'Final Round Judging Schedule', body: 'Dear participants, the final round judging will take place on May 22, 2026 from 8:00 AM to 6:00 PM. Each team will be allocated a 15-minute presentation slot. Please check your assigned time in your Team Workspace.',
    audience: 'All', tag: 'Important', pinned: true, sent: 'May 15, 2026', views: 234
  },
  {
    id: 2, title: 'Submission Deadline Reminder', body: 'This is a reminder that all project submissions are due by May 20, 2026 at 23:59 (GMT+7). Late submissions will incur a 5-point penalty per 15 minutes. Make sure your GitHub repo and demo video links are working.',
    audience: 'Participants', tag: 'Deadline', pinned: false, sent: 'May 18, 2026', views: 187
  },
  {
    id: 3, title: 'Judging Rubric Update for AI Track', body: 'Attention Judges: The scoring rubric for the AI & Machine Learning track has been updated. The "Impact" criterion weight has been adjusted from 35% to 40%. Please review the updated guidelines before scoring.',
    audience: 'Judges', tag: 'Update', pinned: false, sent: 'May 17, 2026', views: 12
  },
];

const tagColors = {
  Important: { bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: 'rgba(239,68,68,0.3)' },
  Deadline: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: 'rgba(245,158,11,0.3)' },
  Update: { bg: 'rgba(59,130,246,0.12)', color: 'var(--primary)', border: 'rgba(59,130,246,0.3)' },
  General: { bg: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'var(--border-color)' },
};

const audienceColors = {
  All: 'var(--accent-1)',
  Participants: 'var(--primary)',
  Judges: 'var(--warning)',
  Mentors: 'var(--accent-3)',
};

const AdminBroadcast = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'All', tag: 'General', pinned: false });
  const [sendError, setSendError] = useState('');
  const [sendShaking, setSendShaking] = useState(false);
  const [sendToast, setSendToast] = useState('');

  const handleSend = () => {
    setSendError('');
    if (!form.title.trim()) {
      setSendError('Announcement title cannot be empty.');
      setSendShaking(true);
      setTimeout(() => setSendShaking(false), 500);
      return;
    }
    if (!form.body.trim()) {
      setSendError('Message body cannot be empty.');
      setSendShaking(true);
      setTimeout(() => setSendShaking(false), 500);
      return;
    }
    setPosts(prev => [{
      id: Date.now(), title: form.title, body: form.body,
      audience: form.audience, tag: form.tag, pinned: form.pinned,
      sent: 'Just now', views: 0
    }, ...prev]);
    setForm({ title: '', body: '', audience: 'All', tag: 'General', pinned: false });
    setComposing(false);
    setSendToast(`Announcement sent to ${form.audience}!`);
    setTimeout(() => setSendToast(''), 3000);
  };

  const togglePin = (id) => setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  const deletePost = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  const sorted = [...posts].sort((a, b) => b.pinned - a.pinned);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Announcements Broadcast</h1>
          <p className="subtitle">Compose and send announcements to participants, judges, or mentors.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setComposing(true)}>
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: composing ? '1fr 420px' : '1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sorted.map(post => {
            const tag = tagColors[post.tag] || tagColors.General;
            return (
              <div key={post.id} className="glass-panel" style={{ padding: '24px', border: post.pinned ? '1px solid rgba(139,92,246,0.3)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {post.pinned && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: 'var(--accent-1)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Pin size={11} /> PINNED
                      </span>
                    )}
                    <span style={{ fontSize: '12px', padding: '3px 10px', background: tag.bg, border: `1px solid ${tag.border}`, borderRadius: '10px', color: tag.color, fontWeight: '600' }}>{post.tag}</span>
                    <span style={{ fontSize: '12px', padding: '3px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', color: audienceColors[post.audience] || 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} /> {post.audience}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => togglePin(post.id)} title={post.pinned ? 'Unpin' : 'Pin'} style={{ padding: '6px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', color: post.pinned ? 'var(--accent-1)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                      {post.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                    </button>
                    <button onClick={() => deletePost(post.id)} title="Delete" style={{ padding: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px' }}>{post.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{post.body}</p>

                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--bg-active)' }}>
                  <span>Sent {post.sent}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {post.views} views</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={12} /> Sent to {post.audience}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compose Panel */}
        {composing && (
          <div className="glass-panel" style={{ padding: '28px', position: 'sticky', top: '24px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="var(--primary)" /> New Announcement
            </h3>

            {/* Error UI */}
            {sendError && (
              <div
                className={sendShaking ? 'shake' : ''}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', marginBottom: '16px',
                  animation: sendShaking ? 'shake 0.4s ease-in-out' : 'none',
                }}
              >
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>{sendError}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Title *</label>
              <input value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setSendError(''); }}
                placeholder="Enter announcement title..." style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${sendError && !form.title.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = sendError && !form.title.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Message *</label>
              <textarea value={form.body} onChange={e => { setForm(f => ({ ...f, body: e.target.value })); setSendError(''); }}
                placeholder="Write your announcement..." rows={5}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${sendError && !form.body.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '12px 14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = sendError && !form.body.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Send To</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                  {['All', 'Participants', 'Judges', 'Mentors'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Tag</label>
                <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                  {Object.keys(tagColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }}>
              <div onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: form.pinned ? 'var(--accent-1)' : 'var(--bg-active)', cursor: 'pointer', transition: 'var(--transition)', position: 'relative', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: 'white', top: '2px', left: form.pinned ? '22px' : '2px', transition: 'var(--transition)' }} />
              </div>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pin this announcement to top</span>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setComposing(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleSend} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Send size={16} /> Send Now
              </button>
            </div>
          </div>
        )}
      </div>

      {sendToast && (
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Announcement Sent!</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sendToast}</div>
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

export default AdminBroadcast;
