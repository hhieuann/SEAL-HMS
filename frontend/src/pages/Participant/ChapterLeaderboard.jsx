import { useState, useEffect } from 'react';
import { Award, RefreshCw } from 'lucide-react';
import apiClient from '../../api/apiClient';

// Year-long Chapter Leaderboard — visible to all students. Chapters are ranked by total
// bonus points (champion +20, runner-up +15, third +10 per event), dense-ranked so equal
// totals share a rank. Data comes from GET /api/v1/chapters/leaderboard.
const rankBadge = (rank) => {
  if (!rank) return null;
  const map = { 1: { icon: '🥇', color: '#B8860B' }, 2: { icon: '🥈', color: '#707070' }, 3: { icon: '🥉', color: '#8B4513' } };
  const m = map[rank];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: m ? m.color : 'var(--text-secondary)' }}>
      {m ? m.icon : ''} #{rank}
    </span>
  );
};

const ChapterLeaderboard = () => {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/api/v1/chapters/leaderboard')
      .then(res => { setBoard(res.data?.data || res.data || []); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Could not load the leaderboard.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,var(--primary),#1F4E79)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Award size={30} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '30px', marginBottom: '4px' }}>Chapter Leaderboard</h1>
            <p className="subtitle" style={{ margin: 0 }}>This year's standings — points accumulate from every hackathon in the current year.</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={load} title="Refresh"><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Scoring rule */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span>🥇 Champion <strong style={{ color: 'var(--text-primary)' }}>+20</strong></span>
        <span>🥈 Runner-up <strong style={{ color: 'var(--text-primary)' }}>+15</strong></span>
        <span>🥉 Third place <strong style={{ color: 'var(--text-primary)' }}>+10</strong></span>
        <span>· Equal totals <strong style={{ color: 'var(--text-primary)' }}>share the same rank</strong></span>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading leaderboard...</div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--danger, #ef4444)' }}>{error}</div>
      ) : board.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Award size={40} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No chapters yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>The leaderboard appears once chapters are created and their teams start placing in events.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chapter</th>
                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rank</th>
                <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {board.map((c) => (
                <tr key={c.chapterId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg,var(--primary),#1F4E79)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={19} color="#fff" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '15px' }}>{c.chapterName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>{rankBadge(c.rank)}</td>
                  <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '16px' }}>{c.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChapterLeaderboard;
