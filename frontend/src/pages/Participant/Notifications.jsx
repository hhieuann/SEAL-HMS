import { useState, useEffect } from 'react';
import { Bell, Info, Loader2, AlertTriangle, RefreshCw, Globe } from 'lucide-react';
import './Workspace.css';
import { useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const Notifications = () => {
  const { eventId: paramEventId } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventName, setEventName] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get eventId from URL params first, then localStorage
      const eventId = paramEventId || localStorage.getItem('currentEventId') || localStorage.getItem('p_selectedEventId') || localStorage.getItem('p_eventId');
      const params = {};
      if (eventId) {
        params.eventId = eventId;
        try {
          const { eventService } = await import('../../api/eventService');
          const evt = await eventService.getEventDetails(eventId);
          if (evt?.data?.title) setEventName(evt.data.title);
          else if (evt?.data?.name) setEventName(evt.data.name);
        } catch { /* ignored on purpose */ }
      }

      const res = await apiClient.get('/api/v1/announcements', { params });
      let raw = res.data?.data || res.data || [];
      if (Array.isArray(raw)) {
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'STAFF' || userRole === 'ADMIN') {
          raw = raw.filter(a => !a.targetRole || a.targetRole === 'ALL' || a.targetRole === userRole);
        }
        setAnnouncements(raw);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Failed to fetch announcements', err);
      setError('Could not load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Notifications</h1>
          <p className="subtitle">
            {eventName ? `Stay updated with important announcements and alerts for [${eventName}]` : 'Stay updated with important announcements and alerts.'}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchAnnouncements}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Loading */}
        {loading && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <p>Loading announcements...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={fetchAnnouncements} style={{ marginTop: '12px' }}>
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && announcements.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            <h3 style={{ marginBottom: '8px' }}>No announcements yet</h3>
            <p style={{ fontSize: '14px' }}>You'll be notified here when your coordinator posts updates.</p>
          </div>
        )}

        {/* Announcement list */}
        {!loading && !error && announcements.map((item) => (
          <div
            key={item.id}
            className="glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              gap: '20px',
              borderLeft: '4px solid var(--primary)',
              background: 'rgba(59, 130, 246, 0.04)',
            }}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.12)', padding: '12px', borderRadius: '50%', height: 'fit-content', flexShrink: 0 }}>
              {item.eventId ? <Bell size={24} color="var(--primary)" /> : <Globe size={24} color="var(--primary)" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {formatTime(item.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{item.content}</p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={11} />
                  Posted by {item.createdByEmail || 'Coordinator'}
                </span>
                {!item.eventId ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-1)' }}>
                    <Globe size={11} /> Global
                  </span>
                ) : (
                  item.eventName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                      <Globe size={11} /> {item.eventName}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
