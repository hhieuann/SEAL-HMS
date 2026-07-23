import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, RefreshCw, Users } from 'lucide-react';
import apiClient from '../../api/apiClient';

// Year-long Chapter Leaderboard — public to all students. Chapters are ranked by total
// bonus points (champion +20, runner-up +15, third +10 per event), dense-ranked so equal
// totals share a rank. Data comes from GET /api/v1/chapters/leaderboard.
const rankColor = (rank) => {
  if (rank === 1) return { bg: 'linear-gradient(135deg,#FFD70022,#FFA50011)', border: '#FFD700', text: '#B8860B', label: '🥇' };
  if (rank === 2) return { bg: 'linear-gradient(135deg,#C0C0C022,#A9A9A911)', border: '#C0C0C0', text: '#707070', label: '🥈' };
  if (rank === 3) return { bg: 'linear-gradient(135deg,#CD7F3222,#8B451311)', border: '#CD7F32', text: '#8B4513', label: '🥉' };
  return { bg: 'var(--bg-subtle, #f8fafc)', border: 'var(--border-color)', text: 'var(--text-secondary)', label: '' };
};

const ChapterLeaderboard = () => {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    apiClient.get('/api/v1/chapters/leaderboard')
      .then(res => { setBoard(res.data?.data || res.data || []); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Không tải được bảng xếp hạng.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const maxPoints = Math.max(1, ...board.map(c => c.totalPoints || 0));

  return (
    <div className="animate-fade-in" style={{ padding: '0 20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,var(--primary),#1F4E79)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={30} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '30px', marginBottom: '4px' }}>Chapter Leaderboard</h1>
              <p className="subtitle" style={{ margin: 0 }}>Bảng xếp hạng Chapter xuyên suốt năm — tích luỹ điểm thành tích qua mọi Hackathon.</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={load} title="Làm mới"><RefreshCw size={16} /> Làm mới</button>
        </div>
      </div>

      {/* Rule note */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <span>🥇 Vô địch event <strong style={{ color: 'var(--text-primary)' }}>+20</strong></span>
        <span>🥈 Á quân <strong style={{ color: 'var(--text-primary)' }}>+15</strong></span>
        <span>🥉 Hạng ba <strong style={{ color: 'var(--text-primary)' }}>+10</strong></span>
        <span style={{ color: 'var(--text-secondary)' }}>· Bằng điểm thì <strong style={{ color: 'var(--text-primary)' }}>cùng hạng</strong></span>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải bảng xếp hạng…</div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--danger, #ef4444)' }}>{error}</div>
      ) : board.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Award size={40} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Chưa có chapter nào</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Bảng xếp hạng sẽ xuất hiện khi các chapter được tạo và có đội đạt thành tích.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {board.map((c) => {
            const rc = rankColor(c.rank);
            const pct = Math.round(((c.totalPoints || 0) / maxPoints) * 100);
            return (
              <div key={c.chapterId} className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: '16px' }}>
                {/* Rank badge */}
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#FFFFFF', border: `2px solid ${rc.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {rc.label ? <span style={{ fontSize: '24px', lineHeight: 1 }}>{rc.label}</span>
                            : <span style={{ fontSize: '20px', fontWeight: '800', color: rc.text }}>{c.rank}</span>}
                  {rc.label && <span style={{ fontSize: '10px', fontWeight: '700', color: rc.text, marginTop: '2px' }}>#{c.rank}</span>}
                </div>

                {/* Name + progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{c.chapterName}</h3>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Users size={13} /> {c.teamCount} đội đạt thành tích
                    </span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${rc.border},var(--primary))`, borderRadius: '6px', transition: 'width .4s' }} />
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: rc.text, lineHeight: 1 }}>{c.totalPoints}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>điểm</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChapterLeaderboard;
