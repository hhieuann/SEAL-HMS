import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Send, Pin, PinOff, Trash2, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import apiClient from '../../api/apiClient';

const tagColors = {
  Important: { bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: 'rgba(239,68,68,0.3)' },
  Deadline:  { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', border: 'rgba(245,158,11,0.3)' },
  Update:    { bg: 'rgba(59,130,246,0.12)', color: 'var(--primary)', border: 'rgba(59,130,246,0.3)' },
  General:   { bg: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'var(--border-color)' },
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const AdminBroadcast = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', tag: 'General' });
  const [sendError, setSendError] = useState('');
  const [sendShaking, setSendShaking] = useState(false);
  const [sendToast, setSendToast] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/announcements');
      const raw = res.data?.data || res.data || [];
      setPosts(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSend = async () => {
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

    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/announcements', {
        title: form.title,
        content: form.body,
        eventId: null, // global announcement; can be extended to pass event id
      });
      setForm({ title: '', body: '', tag: 'General' });
      setComposing(false);
      setSendToast('Announcement sent successfully!');
      setTimeout(() => setSendToast(''), 3000);
      await fetchPosts(); // reload list
    } catch (err) {
      console.error('Failed to send announcement', err);
      setSendError(err.response?.data?.message || 'Failed to send. Please try again.');
      setSendShaking(true);
      setTimeout(() => setSendShaking(false), 500);
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await apiClient.delete(`/api/v1/announcements/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      setSendToast('Announcement deleted.');
      setTimeout(() => setSendToast(''), 2500);
    } catch (err) {
      console.error('Failed to delete announcement', err);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Announcements Broadcast</h1>
          <p className="subtitle">Compose and send announcements to all participants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setComposing(true); setSendError(''); }}>
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: composing ? '1fr 420px' : '1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
              <p>Loading announcements...</p>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Megaphone size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p>No announcements yet. Create the first one!</p>
            </div>
          )}

          {!loading && posts.map(post => {
            const tag = tagColors[post.tag] || tagColors.General;
            return (
              <div key={post.id} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', padding: '3px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={11} /> Global
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => deletePost(post.id)}
                      title="Delete"
                      style={{ padding: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '10px' }}>{post.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{post.content}</p>

                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--bg-active)' }}>
                  <span>Posted {formatTime(post.createdAt)}</span>
                  {post.createdByEmail && <span>by {post.createdByEmail}</span>}
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
              <input
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setSendError(''); }}
                placeholder="Enter announcement title..."
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${sendError && !form.title.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = sendError && !form.title.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Message *</label>
              <textarea
                value={form.body}
                onChange={e => { setForm(f => ({ ...f, body: e.target.value })); setSendError(''); }}
                placeholder="Write your announcement..."
                rows={5}
                style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: `1px solid ${sendError && !form.body.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '12px 14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = sendError && !form.body.trim() ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setComposing(false); setSendError(''); }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleSend} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                {submitting ? 'Sending...' : 'Send Now'}
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
            <div style={{ fontWeight: '600', fontSize: '14px' }}>Done!</div>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminBroadcast;
